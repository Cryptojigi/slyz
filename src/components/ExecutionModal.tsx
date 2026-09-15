"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  getJupiterQuote,
  buildSwapTransaction,
  toUsdcBaseUnits,
  fromBaseUnits,
} from "@/lib/jupiter";
import { VERIFIED_STOCKS, BasketComponent, MIN_SOL_BALANCE } from "@/lib/constants";
import { saveBasketInvestment } from "@/lib/portfolio";

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
  components: BasketComponent[];
  solBalance: number;
  usdcBalance: number;
}

export const ExecutionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  basketId,
  basketName,
  totalUsdAmount,
  components,
  solBalance,
  usdcBalance,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [steps, setSteps] = useState<SwapStepState[]>(() =>
    components.map((c) => ({
      symbol: c.symbol,
      dollarAmount: (c.targetWeight / 100) * totalUsdAmount,
      status: "pending",
    }))
  );

  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [gasError, setGasError] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasEnoughSol = solBalance >= MIN_SOL_BALANCE;
  const hasEnoughUsdc = usdcBalance >= totalUsdAmount;

  const startSequentialExecution = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setGasError("Please connect your wallet first.");
      return;
    }

    if (!hasEnoughSol) {
      setGasError(
        `Low SOL balance (${solBalance.toFixed(4)} SOL). You need at least 0.02 SOL to pay for transaction fees and Token-2022 account rent exemption.`
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

      // Skip already completed steps if retrying
      if (step.status === "success" && step.txSignature) {
        executedSignatures.push(step.txSignature);
        continue;
      }

      setActiveStepIndex(i);

      // 1. Quoting
      updateStep(i, { status: "quoting", errorMessage: undefined });
      const asset = VERIFIED_STOCKS[step.symbol];
      if (!asset) {
        updateStep(i, { status: "failed", errorMessage: `Unknown asset: ${step.symbol}` });
        setIsRunning(false);
        return;
      }

      try {
        const baseUnits = toUsdcBaseUnits(step.dollarAmount);
        const quote = await getJupiterQuote({
          outputMint: asset.mint,
          amount: baseUnits,
          slippageBps: 100, // 1% for safety during basket allocation
        });

        // 2. Build Swap Transaction
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

        // Await confirmation using transaction's recentBlockhash and swapRes.lastValidBlockHeight
        const blockhash = transaction.message.recentBlockhash;
        const lastValidBlockHeight =
          swapRes.lastValidBlockHeight ??
          (await connection.getLatestBlockhash("confirmed")).lastValidBlockHeight;

        await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        executedSignatures.push(signature);
        updateStep(i, {
          status: "success",
          txSignature: signature,
          outAmount: quote.outAmount,
        });
      } catch (err: any) {
        console.error(`Error swapping for ${step.symbol}:`, err);
        const msg = err?.message?.includes("User rejected")
          ? "Transaction rejected in wallet."
          : err?.message || "Swap execution failed.";
        updateStep(i, { status: "failed", errorMessage: msg });
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
      components,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#161B26] border border-[#262D3D] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#262D3D] flex items-center justify-between">
          <div>
            <span className="pill-badge pill-badge-lime mb-2">Sequential Execution</span>
            <h3 className="text-lg font-extrabold text-white">
              Investing in {basketName}
            </h3>
            <p className="text-xs text-[#8F9CAE]">
              Total Investment: ${totalUsdAmount.toFixed(2)} USDC
            </p>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] hover:text-white flex items-center justify-center text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Gas / Balance Alert */}
          {gasError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{gasError}</span>
            </div>
          )}

          {/* Stepper Progress List */}
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const asset = VERIFIED_STOCKS[step.symbol];
              return (
                <div
                  key={step.symbol}
                  className={`p-3.5 rounded-xl border transition-all ${
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
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                        {step.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-[#CDE06A]" />
                        ) : step.status === "failed" ? (
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                        ) : idx === activeStepIndex && isRunning ? (
                          <Loader2 className="w-5 h-5 text-[#8D8AFF] animate-spin" />
                        ) : (
                          <span className="text-[#8F9CAE]">{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white">
                          {asset?.underlying || step.symbol}
                        </span>
                        <span className="text-xs text-[#8F9CAE] ml-2">
                          (${step.dollarAmount.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    {/* Step Status Text */}
                    <div className="text-xs font-mono">
                      {step.status === "success" && (
                        <span className="text-[#CDE06A] font-bold">Filled ✓</span>
                      )}
                      {step.status === "signing" && (
                        <span className="text-[#8D8AFF] animate-pulse">Confirm in wallet...</span>
                      )}
                      {step.status === "confirming" && (
                        <span className="text-[#8D8AFF]">Confirming on-chain...</span>
                      )}
                      {step.status === "quoting" && (
                        <span className="text-[#8F9CAE]">Fetching route...</span>
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
                  {step.txSignature && (
                    <div className="mt-2 pl-9">
                      <a
                        href={`https://solscan.io/tx/${step.txSignature}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#8F9CAE] hover:text-[#CDE06A] transition-colors"
                      >
                        <span>View signature: {step.txSignature.slice(0, 8)}...{step.txSignature.slice(-6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Error Message if failed */}
                  {step.errorMessage && (
                    <p className="mt-2 pl-9 text-[11px] text-rose-400">
                      {step.errorMessage}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-[#8F9CAE] mb-1.5 font-mono">
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
        <div className="p-6 bg-[#0B0E14]/80 border-t border-[#262D3D]">
          {!completed ? (
            <button
              onClick={startSequentialExecution}
              disabled={isRunning || !wallet.connected}
              className="btn-primary w-full flex items-center justify-center gap-2"
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
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/30 text-center">
                <p className="text-sm font-bold text-[#CDE06A]">
                  🎉 All {steps.length} swaps confirmed!
                </p>
                <p className="text-xs text-[#8F9CAE] mt-0.5">
                  Your tokenized equity holdings are now active on Solana.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/portfolio"
                  onClick={onClose}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-center"
                >
                  <span>Go to Portfolio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={onClose} className="btn-secondary px-5">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
