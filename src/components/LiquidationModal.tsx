"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  ArrowDownLeft,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  VERIFIED_STOCKS,
  USDC_MINT,
  MIN_SOL_BALANCE,
} from "@/lib/constants";
import { getJupiterQuote, buildSwapTransaction } from "@/lib/jupiter";
import { PortfolioPosition } from "@/lib/portfolio";
import {
  waitForTransactionConfirmation,
  isSignatureConfirmedOnChain,
} from "@/lib/confirmTransaction";

export interface LiquidationStepState {
  symbol: string;
  shareAmount: number;
  estimatedUsd: number;
  status: "idle" | "quoting" | "signing" | "confirming" | "success" | "failed";
  txSignature?: string;
  receivedUsdc?: number;
  rawAmountString?: string;
  errorMessage?: string;
}

interface LiquidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: PortfolioPosition[];
  solBalance: number;
  onSuccess: () => void;
}

export function LiquidationModal({
  isOpen,
  onClose,
  positions,
  solBalance,
  onSuccess,
}: LiquidationModalProps) {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Only liquidate assets that have an actual positive balance
  const activeHoldings = positions.filter((p) => p.rawBalance > 0.000001);

  const [steps, setSteps] = useState<LiquidationStepState[]>(() =>
    activeHoldings.map((p) => ({
      symbol: p.symbol,
      shareAmount: p.rawBalance,
      rawAmountString: p.rawAmountString,
      estimatedUsd: p.currentValueUsd,
      status: "idle",
    }))
  );

  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [completed, setCompleted] = useState(false);
  const [gasError, setGasError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize steps whenever modal opens or positions update
  useEffect(() => {
    if (isOpen) {
      const freshActive = positions.filter((p) => p.rawBalance > 0.000001);
      setSteps(
        freshActive.map((p) => ({
          symbol: p.symbol,
          shareAmount: p.rawBalance,
          rawAmountString: p.rawAmountString,
          estimatedUsd: p.currentValueUsd,
          status: "idle",
        }))
      );
      setIsRunning(false);
      setActiveStepIndex(-1);
      setCompleted(false);
      setGasError(null);
    }
  }, [isOpen, positions]);

  if (!mounted || !isOpen) return null;

  const totalUsdEstimated = activeHoldings.reduce((acc, p) => acc + p.currentValueUsd, 0);
  const hasEnoughSol = solBalance >= MIN_SOL_BALANCE;

  const updateStep = (index: number, patch: Partial<LiquidationStepState>) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s))
    );
  };

  const startSequentialLiquidation = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setGasError("Please connect your wallet first.");
      return;
    }

    if (!hasEnoughSol) {
      setGasError(
        `Low SOL balance (${solBalance.toFixed(4)} SOL). You need at least 0.015 SOL to pay for Solana network transaction fees.`
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

      // 2. Skip steps that already landed on-chain (prevents duplicate sales on retry)
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

      // 3. Quoting reverse swap (xStock -> USDC)
      updateStep(i, { status: "quoting", errorMessage: undefined });
      const asset = VERIFIED_STOCKS[step.symbol];
      if (!asset) {
        updateStep(i, { status: "failed", errorMessage: `Unknown asset: ${step.symbol}` });
        setIsRunning(false);
        return;
      }

      let currentSignature: string | null = null;

      try {
        // Use exact on-chain base units string if available to avoid floating-point dust
        const baseUnits =
          step.rawAmountString && step.rawAmountString !== "0"
            ? Number(step.rawAmountString)
            : Math.floor(step.shareAmount * Math.pow(10, asset.decimals));

        if (baseUnits <= 0) {
          updateStep(i, { status: "success", receivedUsdc: 0 });
          continue;
        }

        const quote = await getJupiterQuote({
          inputMint: asset.mint,
          outputMint: USDC_MINT,
          amount: baseUnits,
          slippageBps: 100, // 1% safe slippage
        });

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

        // Persist signature immediately on the step
        updateStep(i, { txSignature: signature, status: "confirming" });

        // 5. Robust on-chain confirmation
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
        const receivedUsdc = Number(quote.outAmount) / 1_000_000;
        updateStep(i, {
          status: "success",
          txSignature: signature,
          receivedUsdc,
          errorMessage: undefined,
        });
      } catch (err: any) {
        console.error(`Error liquidating ${step.symbol}:`, err);
        const sigToCheck = currentSignature || step.txSignature;

        // Safety net: check if transaction actually confirmed on-chain
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
        let cleanMsg = "Liquidation execution failed.";
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

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#CDE06A", "#8D8AFF", "#FFFFFF"],
      });
    } catch (_) {}

    onSuccess();
  };

  const completedCount = steps.filter((s) => s.status === "success").length;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#161B26] border border-[#262D3D] rounded-2xl w-full max-w-[430px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262D3D] flex items-center justify-between shrink-0">
          <div>
            <span className="pill-badge pill-badge-purple mb-1 text-[10px]">Sequential Exit</span>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Liquidate Pie to</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#2775CA]/15 border border-[#2775CA]/30 text-white text-[11px]">
                <Image
                  src="/usdc-logo.svg"
                  alt="USDC"
                  width={13}
                  height={13}
                  className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                />
                <span>USDC</span>
              </span>
            </h3>
            <p className="text-[11px] text-[#8F9CAE]">
              Selling {activeHoldings.length} tokenized positions back to USDC
            </p>
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
          {gasError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{gasError}</span>
            </div>
          )}

          {/* Holdings summary */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] flex items-center justify-between text-xs">
            <span className="text-[#8F9CAE]">Estimated Total Proceeds:</span>
            <span className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
              <Image
                src="/usdc-logo.svg"
                alt="USDC"
                width={16}
                height={16}
                className="w-4 h-4 rounded-full object-contain shrink-0"
              />
              <span>~${totalUsdEstimated.toFixed(2)} USDC</span>
            </span>
          </div>

          {/* Sequential Step List */}
          <div className="space-y-2.5">
            {steps.map((step, idx) => {
              const asset = VERIFIED_STOCKS[step.symbol];
              const isActive = isRunning && activeStepIndex === idx;

              return (
                <div
                  key={step.symbol}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "bg-[#1D2332] border-[#8D8AFF] shadow-lg shadow-[#8D8AFF]/10"
                      : step.status === "success"
                      ? "bg-[#0B0E14]/60 border-[#CDE06A]/30"
                      : step.status === "failed"
                      ? "bg-rose-950/20 border-rose-500/30"
                      : "bg-[#0B0E14] border-[#262D3D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#161B26] border border-[#262D3D] flex items-center justify-center text-xs font-mono text-white">
                        {step.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#CDE06A]" />
                        ) : step.status === "failed" ? (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        ) : isActive ? (
                          <Loader2 className="w-3.5 h-3.5 text-[#8D8AFF] animate-spin" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-sm text-white block">
                          Sell {step.shareAmount.toFixed(4)} {asset?.underlying || step.symbol}
                        </span>
                        <span className="text-[11px] font-mono text-[#8F9CAE]">
                          ~${step.estimatedUsd.toFixed(2)} estimated
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {step.status === "idle" && (
                        <span className="text-[11px] font-mono text-[#8F9CAE]">Queued</span>
                      )}
                      {step.status === "quoting" && (
                        <span className="text-[11px] font-mono text-[#8D8AFF] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Quoting
                        </span>
                      )}
                      {step.status === "signing" && (
                        <span className="text-[11px] font-mono text-[#CDE06A] animate-pulse">
                          Approve in Wallet...
                        </span>
                      )}
                      {step.status === "confirming" && (
                        <span className="text-[11px] font-mono text-white flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Confirming
                        </span>
                      )}
                      {step.status === "success" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#CDE06A]">
                            ~${(step.receivedUsdc || step.estimatedUsd).toFixed(2)} USDC (filled)
                          </span>
                          {step.txSignature && (
                            <a
                              href={`https://solscan.io/tx/${step.txSignature}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8F9CAE] hover:text-white"
                              title="View on Solscan"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                      {step.status === "failed" && (
                        <span className="text-xs font-mono text-rose-400 font-bold">Failed</span>
                      )}
                    </div>
                  </div>

                  {step.errorMessage && (
                    <div className="mt-2 text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50 space-y-1.5 overflow-hidden">
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
                            rel="noopener noreferrer"
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

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-[#8F9CAE] font-mono">
              <span>Exit Progress</span>
              <span>
                {completedCount} of {steps.length} swaps completed
              </span>
            </div>
            <div className="w-full h-2 bg-[#0B0E14] rounded-full overflow-hidden border border-[#262D3D]">
              <div
                className="h-full bg-gradient-to-r from-[#8D8AFF] to-[#CDE06A] transition-all duration-300"
                style={{
                  width: `${(completedCount / Math.max(1, steps.length)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#262D3D] bg-[#0B0E14]/80 flex items-center justify-between gap-3 shrink-0">
          {completed ? (
            <button
              onClick={onClose}
              className="w-full btn-primary flex items-center justify-center gap-2 !py-2.5 sm:!py-3 text-xs sm:text-sm font-bold shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Liquidation Complete — Return to Portfolio</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isRunning}
                className="btn-secondary text-xs !py-2.5 px-3.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={startSequentialLiquidation}
                disabled={isRunning || !hasEnoughSol || activeHoldings.length === 0}
                className="btn-primary flex items-center gap-2 text-xs sm:text-sm flex-1 justify-center !py-2.5 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Swaps ({activeStepIndex + 1}/{steps.length})...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Confirm Exit to USDC ({steps.length} Signatures)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
