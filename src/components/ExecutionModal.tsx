"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  X,
} from "lucide-react";
import {
  getJupiterQuote,
  buildSwapTransaction,
  toUsdcBaseUnits,
  fromBaseUnits,
} from "@/lib/jupiter";
import { VERIFIED_STOCKS, BasketComponent, MIN_SOL_BALANCE } from "@/lib/constants";
import { saveBasketInvestment } from "@/lib/portfolio";
import {
  waitForTransactionConfirmation,
  isSignatureConfirmedOnChain,
} from "@/lib/confirmTransaction";

export type StepStatus =
  | "pending"
  | "quoting"
  | "signing"
  | "confirming"
  | "success"
  | "failed";

export interface SwapStepState {
  symbol: string;
  dollarAmount: number;
  status: StepStatus;
  txSignature?: string;
  outAmount?: string;
  errorMessage?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  basketId: string;
  basketName: string;
  totalUsdAmount: number;
  legs: { symbol: string; amountUsd: number }[];
  solBalance: number;
  usdcBalance: number;
}

export const ExecutionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  basketId,
  basketName,
  totalUsdAmount,
  legs,
  solBalance,
  usdcBalance,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [steps, setSteps] = useState<SwapStepState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [gasError, setGasError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-sync steps whenever modal opens or legs change
  useEffect(() => {
    if (isOpen) {
      setSteps(
        legs
          .filter((l) => l.amountUsd >= 1)
          .map((l) => ({
            symbol: l.symbol,
            dollarAmount: l.amountUsd,
            status: "pending",
          }))
      );
      setIsRunning(false);
      setCompleted(false);
      setActiveStepIndex(0);
      setGasError(null);
    }
  }, [isOpen, legs]);

  if (!isOpen) return null;

  if (steps.length === 0) {
    if (!mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-[#161B26] border border-[#262D3D] rounded-2xl p-5 sm:p-6 max-w-[430px] w-full shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center mx-auto text-[#CDE06A]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">No Eligible Legs to Swap</h3>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            Every stock leg requires at least $1.00 USDC for Jupiter routing. Please increase your investment amount.
          </p>
          <button onClick={onClose} className="btn-secondary w-full text-xs sm:text-sm !py-2.5">
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const hasEnoughSol = solBalance >= MIN_SOL_BALANCE;
  const hasEnoughUsdc = usdcBalance >= totalUsdAmount;

  const startSequentialExecution = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setGasError("Please connect your wallet first.");
      return;
    }

    if (!hasEnoughSol) {
      setGasError(
        `Low SOL balance (${solBalance.toFixed(4)} SOL). You need at least 0.015 SOL to pay for transaction fees and Token-2022 account rent exemption.`
      );
      return;
    }

    if (!hasEnoughUsdc) {
      setGasError(
        `Insufficient USDC balance (${usdcBalance.toFixed(2)} USDC). You need at least $${totalUsdAmount.toFixed(2)} USDC.`
      );
      return;
    }

    setGasError(null);
    setIsRunning(true);

    const executedSignatures: string[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // 1. Skip already completed steps if retrying
      if (step.status === "success" && step.txSignature) {
        if (!executedSignatures.includes(step.txSignature)) {
          executedSignatures.push(step.txSignature);
        }
        continue;
      }

      // 2. Skip steps that already have a landed signature on-chain (prevents double-buys on retry)
      const candidateSig =
        step.txSignature ||
        step.errorMessage?.match(/Signature\s+([1-9A-HJ-NP-Za-km-z]{64,88})/)?.[1] ||
        step.errorMessage?.match(/([1-9A-HJ-NP-Za-km-z]{80,88})/)?.[1];

      if (candidateSig) {
        updateStep(i, { status: "confirming", txSignature: candidateSig, errorMessage: undefined });
        const alreadyConfirmed = await isSignatureConfirmedOnChain(connection, candidateSig);
        if (alreadyConfirmed) {
          updateStep(i, {
            status: "success",
            txSignature: candidateSig,
            errorMessage: undefined,
          });
          if (!executedSignatures.includes(candidateSig)) {
            executedSignatures.push(candidateSig);
          }
          continue;
        }
      }

      setActiveStepIndex(i);

      // 3. Quoting
      updateStep(i, { status: "quoting", errorMessage: undefined });
      const asset = VERIFIED_STOCKS[step.symbol];
      if (!asset) {
        updateStep(i, { status: "failed", errorMessage: `Unknown asset: ${step.symbol}` });
        setIsRunning(false);
        return;
      }

      let currentSignature: string | null = null;

      try {
        const baseUnits = toUsdcBaseUnits(step.dollarAmount);
        const quote = await getJupiterQuote({
          outputMint: asset.mint,
          amount: baseUnits,
          slippageBps: 100, // 1% for safety during basket allocation
        });

        // Price Impact Safety Check (quote.priceImpactPct is a decimal fraction, e.g. 0.002 = 0.2%)
        const impact = Number(quote.priceImpactPct || 0);
        if (impact > 0.05) {
          // 5%+ -> BLOCK: do not sign. Show actionable alert, stop the run.
          updateStep(i, {
            status: "failed",
            errorMessage: `Price impact ${(impact * 100).toFixed(2)}% exceeds the 5% safety limit. Reduce this leg.`,
          });
          setIsRunning(false);
          return;
        }

        if (impact > 0.025) {
          // 2.5%+ -> WARN: display badge on step, continue.
          updateStep(i, {
            errorMessage: `⚠ High price impact: ${(impact * 100).toFixed(2)}%`,
          });
        }

        // 4. Build Swap Transaction immediately before signing to guarantee fresh blockhash
        updateStep(i, { status: "signing" });
        const swapRes = await buildSwapTransaction({
          quoteResponse: quote,
          userPublicKey: wallet.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
        });

        // Deserialize transaction buffer using browser-native Uint8Array
        const binaryString = atob(swapRes.swapTransaction);
        const swapTxBuf = new Uint8Array(binaryString.length);
        for (let b = 0; b < binaryString.length; b++) {
          swapTxBuf[b] = binaryString.charCodeAt(b);
        }
        const transaction = VersionedTransaction.deserialize(swapTxBuf);

        // Request wallet signature and broadcast
        updateStep(i, { status: "confirming" });
        const signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: false,
          maxRetries: 3,
        });
        currentSignature = signature;

        // Immediately persist signature on step so we never lose it
        updateStep(i, { txSignature: signature, status: "confirming" });

        // 5. Robust on-chain confirmation (verifies getSignatureStatus; ignores false-negative block height timeouts)
        const confirmResult = await waitForTransactionConfirmation({
          connection,
          signature,
          blockhash: transaction.message.recentBlockhash,
          lastValidBlockHeight: swapRes.lastValidBlockHeight,
        });

        if (!confirmResult.confirmed) {
          throw confirmResult.err || new Error(confirmResult.errorReason || "Confirmation failed");
        }

        executedSignatures.push(signature);
        updateStep(i, {
          status: "success",
          txSignature: signature,
          outAmount: quote.outAmount,
          errorMessage: undefined,
        });
      } catch (err: any) {
        console.error(`Error swapping for ${step.symbol}:`, err);
        const sigToCheck = currentSignature || step.txSignature;

        // Final safety net: check if transaction actually landed on-chain before declaring failure
        if (sigToCheck) {
          const landed = await isSignatureConfirmedOnChain(connection, sigToCheck);
          if (landed) {
            if (!executedSignatures.includes(sigToCheck)) {
              executedSignatures.push(sigToCheck);
            }
            updateStep(i, {
              status: "success",
              txSignature: sigToCheck,
              errorMessage: undefined,
            });
            continue;
          }
        }

        const rawMsg = err?.message || "";
        let cleanMsg = "Swap execution failed.";
        if (rawMsg.includes("User rejected")) {
          cleanMsg = "Transaction rejected in wallet.";
        } else if (rawMsg.includes("block height exceeded") || rawMsg.includes("has expired")) {
          cleanMsg = "Transaction confirmation timed out. Check Solscan before retrying.";
        } else if (rawMsg.length > 0) {
          cleanMsg = rawMsg;
        }

        updateStep(i, {
          status: "failed",
          txSignature: sigToCheck,
          errorMessage: cleanMsg,
        });
        setIsRunning(false);
        return;
      }
    }

    // All steps finished!
    setIsRunning(false);
    setCompleted(true);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#CDE06A", "#8D8AFF", "#FFFFFF"],
      });
    } catch (_) {}

    // Save to localStorage
    saveBasketInvestment({
      id: `${basketId}-${Date.now()}`,
      name: basketName,
      investedAt: Date.now(),
      components: legs.map((l) => ({
        symbol: l.symbol,
        targetWeight: totalUsdAmount > 0 ? Math.round((l.amountUsd / totalUsdAmount) * 100) : 0,
      })),
      initialDepositUsd: totalUsdAmount,
      txSignatures: executedSignatures,
    });
  };

  const updateStep = (index: number, patch: Partial<SwapStepState>) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s))
    );
  };

  const completedCount = steps.filter((s) => s.status === "success").length;

  if (!mounted || !isOpen || steps.length === 0) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#161B26] border border-[#262D3D] rounded-2xl w-full max-w-[430px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262D3D] flex items-center justify-between shrink-0">
          <div>
            <span className="pill-badge pill-badge-lime mb-1 text-[10px]">Sequential Execution</span>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Investing in {basketName}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8F9CAE]">
              <span>Total Investment:</span>
              <span className="font-mono font-bold text-white flex items-center gap-1">
                <Image
                  src="/usdc-logo.svg"
                  alt="USDC"
                  width={13}
                  height={13}
                  className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                />
                <span>${totalUsdAmount.toFixed(2)} USDC</span>
              </span>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] hover:text-white flex items-center justify-center text-xs transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {/* Live Wallet Balances Indicator */}
          <div className="p-2.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <Image
                src="/usdc-logo.svg"
                alt="USDC"
                width={14}
                height={14}
                className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
              />
              <span className="text-[#8F9CAE]">Capital:</span>
              <span className={`font-bold ${hasEnoughUsdc ? "text-white" : "text-rose-400"}`}>
                ${usdcBalance.toFixed(2)} USDC
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Image
                src="/sol-logo.svg"
                alt="SOL"
                width={14}
                height={14}
                className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
              />
              <span className="text-[#8F9CAE]">SOL:</span>
              <span className={`font-bold ${hasEnoughSol ? "text-white" : "text-amber-400"}`}>
                {solBalance.toFixed(3)} SOL
              </span>
            </div>
          </div>

          {/* Gas / Balance Alert */}
          {gasError && (
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{gasError}</span>
            </div>
          )}

          {/* Stepper Progress List */}
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const asset = VERIFIED_STOCKS[step.symbol];
              return (
                <div
                  key={step.symbol}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                    step.status === "success"
                      ? "bg-[#0B0E14]/70 border-[#CDE06A]/40"
                      : step.status === "failed"
                      ? "bg-rose-950/20 border-rose-500/40"
                      : idx === activeStepIndex && isRunning
                      ? "bg-[#1D2332] border-[#8D8AFF]"
                      : "bg-[#0B0E14]/40 border-[#262D3D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        {step.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#CDE06A]" />
                        ) : step.status === "failed" ? (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        ) : idx === activeStepIndex && isRunning ? (
                          <Loader2 className="w-4 h-4 text-[#8D8AFF] animate-spin" />
                        ) : (
                          <span className="text-[#8F9CAE] text-[11px]">{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-white">
                          {asset?.underlying || step.symbol}
                        </span>
                        <span className="text-[11px] text-[#8F9CAE] ml-1.5 font-mono">
                          (${step.dollarAmount.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    {/* Step Status Text */}
                    <div className="text-[11px] font-mono">
                      {step.status === "success" && (
                        <span className="text-[#CDE06A] font-bold">Filled ✓</span>
                      )}
                      {step.status === "signing" && (
                        <span className="text-[#8D8AFF] animate-pulse">Confirming...</span>
                      )}
                      {step.status === "confirming" && (
                        <span className="text-[#8D8AFF]">Confirming on-chain...</span>
                      )}
                      {step.status === "quoting" && (
                        <span className="text-[#8F9CAE]">Routing...</span>
                      )}
                      {step.status === "pending" && (
                        <span className="text-[#8F9CAE]">Queued</span>
                      )}
                      {step.status === "failed" && (
                        <span className="text-rose-400 font-bold">Failed</span>
                      )}
                    </div>
                  </div>

                  {/* Transaction Link if successful */}
                  {step.status === "success" && step.txSignature && (
                    <div className="mt-2 ml-7 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#8F9CAE]">Transaction:</span>
                      <a
                        href={`https://solscan.io/tx/${step.txSignature}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#CDE06A] hover:underline"
                      >
                        <span>{step.txSignature.slice(0, 6)}...{step.txSignature.slice(-4)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Transaction Link if actively confirming */}
                  {step.status === "confirming" && step.txSignature && (
                    <div className="mt-1.5 ml-7 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8F9CAE]">Broadcasted:</span>
                      <a
                        href={`https://solscan.io/tx/${step.txSignature}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#8D8AFF] hover:underline"
                      >
                        <span>{step.txSignature.slice(0, 6)}...{step.txSignature.slice(-4)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Error Message if failed — bounded, formatted, with clean Solscan fallback */}
                  {step.errorMessage && (
                    <div className="mt-2 ml-7 p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-300 space-y-1.5 overflow-hidden">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="break-words break-all leading-tight font-medium">
                          {step.errorMessage}
                        </span>
                      </div>
                      {step.txSignature && (
                        <div className="pt-1.5 border-t border-rose-900/40 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#8F9CAE]">Broadcasted Sig:</span>
                          <a
                            href={`https://solscan.io/tx/${step.txSignature}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#CDE06A] hover:underline"
                          >
                            <span>{step.txSignature.slice(0, 6)}...{step.txSignature.slice(-6)}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-[#8F9CAE] mb-1 font-mono">
              <span>Progress</span>
              <span>
                {completedCount} of {steps.length} Swaps Completed
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#0B0E14] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#CDE06A] transition-all duration-300 rounded-full"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-4 sm:p-5 bg-[#0B0E14]/80 border-t border-[#262D3D] shrink-0">
          {!completed ? (
            <button
              onClick={startSequentialExecution}
              disabled={isRunning || !wallet.connected}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-2.5 sm:!py-3 text-xs sm:text-sm font-bold shadow-lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Step {activeStepIndex + 1} of {steps.length}...</span>
                </>
              ) : steps.some((s) => s.status === "failed") ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Failed Swaps</span>
                </>
              ) : (
                <>
                  <span>Approve & Execute Swaps (${totalUsdAmount.toFixed(2)} USDC)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/30 text-center">
                <p className="text-xs sm:text-sm font-bold text-[#CDE06A]">
                  🎉 All {steps.length} swaps confirmed!
                </p>
                <p className="text-[11px] text-[#8F9CAE] mt-0.5">
                  Your tokenized equity holdings are now active on Solana.
                </p>
              </div>
              <div className="flex gap-2.5">
                <Link
                  href="/portfolio"
                  onClick={onClose}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-center text-xs !py-2.5"
                >
                  <span>Go to Portfolio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button onClick={onClose} className="btn-secondary px-4 text-xs !py-2.5">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
