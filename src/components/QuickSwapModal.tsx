"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import {
  X,
  ArrowUpDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Zap,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { USDC_MINT } from "@/lib/constants";
import { getJupiterQuote, buildSwapTransaction, QuoteResponse } from "@/lib/jupiter";
import { useWalletBalances, SwapDirection } from "@/context/WalletBalanceContext";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const MIN_GAS_RESERVE_SOL = 0.02; // Always keep 0.02 SOL when hitting MAX on SOL to prevent gas starvation

export const QuickSwapModal: React.FC = () => {
  const modalTitleId = useId();
  const { connection } = useConnection();
  const wallet = useWallet();
  const {
    solBalance,
    usdcBalance,
    refreshBalances,
    isQuickSwapOpen,
    quickSwapDirection,
    quickSwapPrefillAmount,
    closeQuickSwap,
  } = useWalletBalances();

  const [direction, setDirection] = useState<SwapDirection>(quickSwapDirection);
  const [inputAmount, setInputAmount] = useState<string>("");
  const [slippageBps, setSlippageBps] = useState<number>(50); // 0.5% default

  // Quote State
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Execution State
  const [status, setStatus] = useState<"idle" | "signing" | "confirming" | "success" | "error">("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync modal props when opened
  useEffect(() => {
    if (isQuickSwapOpen) {
      setDirection(quickSwapDirection);
      if (quickSwapPrefillAmount && quickSwapPrefillAmount > 0) {
        setInputAmount(quickSwapPrefillAmount.toFixed(quickSwapDirection === "SOL_TO_USDC" ? 3 : 2));
      } else {
        setInputAmount("");
      }
      setQuote(null);
      setQuoteError(null);
      setStatus("idle");
      setTxSignature(null);
      setErrorMessage(null);
    }
  }, [isQuickSwapOpen, quickSwapDirection, quickSwapPrefillAmount]);

  const isSolToUsdc = direction === "SOL_TO_USDC";
  const inputSymbol = isSolToUsdc ? "SOL" : "USDC";
  const outputSymbol = isSolToUsdc ? "USDC" : "SOL";
  const inputDecimals = isSolToUsdc ? 9 : 6;
  const outputDecimals = isSolToUsdc ? 6 : 9;
  const currentMaxInput = isSolToUsdc
    ? Math.max(0, Number((solBalance - MIN_GAS_RESERVE_SOL).toFixed(4)))
    : Number(usdcBalance.toFixed(2));

  // Switch direction
  const handleToggleDirection = () => {
    setDirection((prev) => (prev === "SOL_TO_USDC" ? "USDC_TO_SOL" : "SOL_TO_USDC"));
    setInputAmount("");
    setQuote(null);
    setQuoteError(null);
    setStatus("idle");
    setErrorMessage(null);
  };

  // Quick percentage selection
  const handlePercentageSelect = (pct: number) => {
    if (pct === 100) {
      setInputAmount(currentMaxInput > 0 ? currentMaxInput.toString() : "0");
    } else {
      const calculated = (currentMaxInput * pct) / 100;
      setInputAmount(calculated > 0 ? calculated.toFixed(isSolToUsdc ? 4 : 2) : "0");
    }
  };

  // Debounced Quote Fetching
  const fetchQuote = useCallback(async () => {
    const numAmount = parseFloat(inputAmount);
    if (!numAmount || numAmount <= 0 || isNaN(numAmount)) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    // Balance check
    if (isSolToUsdc && numAmount > solBalance) {
      setQuote(null);
      setQuoteError(`Insufficient SOL balance (${solBalance.toFixed(3)} SOL available).`);
      return;
    }
    if (!isSolToUsdc && numAmount > usdcBalance) {
      setQuote(null);
      setQuoteError(`Insufficient USDC balance ($${usdcBalance.toFixed(2)} USDC available).`);
      return;
    }

    setQuoting(true);
    setQuoteError(null);

    try {
      const baseUnits = Math.floor(numAmount * 10 ** inputDecimals);
      const res = await getJupiterQuote({
        inputMint: isSolToUsdc ? SOL_MINT : USDC_MINT,
        outputMint: isSolToUsdc ? USDC_MINT : SOL_MINT,
        amount: baseUnits,
        slippageBps,
      });
      setQuote(res);
    } catch (err: any) {
      console.error("[QuickSwap] Quote error:", err);
      setQuote(null);
      setQuoteError(err?.message || "Failed to fetch live Jupiter swap quote.");
    } finally {
      setQuoting(false);
    }
  }, [inputAmount, isSolToUsdc, solBalance, usdcBalance, inputDecimals, slippageBps]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  // Estimated output calculation
  const estimatedOutputAmount = quote
    ? Number(quote.outAmount) / 10 ** outputDecimals
    : 0;

  // Execution: Build, Sign, and Confirm
  const handleExecuteSwap = async () => {
    if (!wallet.publicKey || !quote) return;

    setStatus("signing");
    setErrorMessage(null);

    try {
      // 1. Build swap transaction
      const swapRes = await buildSwapTransaction({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      });

      // 2. Deserialize VersionedTransaction
      const binaryString = atob(swapRes.swapTransaction);
      const swapTxBuf = new Uint8Array(binaryString.length);
      for (let b = 0; b < binaryString.length; b++) {
        swapTxBuf[b] = binaryString.charCodeAt(b);
      }
      const transaction = VersionedTransaction.deserialize(swapTxBuf);

      // 3. Send via wallet adapter
      setStatus("confirming");
      const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      // 4. Confirm transaction on Solana Mainnet
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

      setTxSignature(signature);
      setStatus("success");
      // Immediately refresh global wallet balances
      await refreshBalances();
    } catch (err: any) {
      console.error("[QuickSwap] Execution failed:", err);
      setStatus("error");
      setErrorMessage(
        err?.message?.includes("User rejected")
          ? "Transaction rejected by user."
          : err?.message || "Swap execution failed on Solana Mainnet."
      );
    }
  };

  if (!mounted || !isQuickSwapOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-[430px] bg-[#161B26] border border-[#262D3D] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262D3D]">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <div className="w-8 h-8 rounded-full ring-2 ring-[#161B26] overflow-hidden bg-black flex items-center justify-center">
                <Image
                  src="/sol-logo.svg"
                  alt="SOL"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-8 h-8 rounded-full ring-2 ring-[#161B26] overflow-hidden bg-[#2775CA] flex items-center justify-center">
                <Image
                  src="/usdc-logo.svg"
                  alt="USDC"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <h2 id={modalTitleId} className="text-base font-bold text-white">
                Quick Swap • SOL ↔ USDC
              </h2>
              <span className="text-[10px] text-[#8F9CAE]">
                Direct Zero-Slippage Jupiter Lite Route
              </span>
            </div>
          </div>
          <button
            onClick={closeQuickSwap}
            disabled={status === "signing" || status === "confirming"}
            className="p-1.5 rounded-lg hover:bg-[#262D3D] text-[#8F9CAE] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Swap Direction Toggle & Input Box */}
        <div className="space-y-3">
          {/* FROM Input Box */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8F9CAE]">
              <span className="font-semibold text-slate-300">You Pay</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span>Available:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {isSolToUsdc ? (
                    <>
                      <Image
                        src="/sol-logo.svg"
                        alt="SOL"
                        width={13}
                        height={13}
                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                      />
                      <span>{solBalance.toFixed(3)} SOL</span>
                    </>
                  ) : (
                    <>
                      <Image
                        src="/usdc-logo.svg"
                        alt="USDC"
                        width={13}
                        height={13}
                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                      />
                      <span>${usdcBalance.toFixed(2)} USDC</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={inputAmount}
                disabled={status === "signing" || status === "confirming"}
                onChange={(e) => setInputAmount(e.target.value)}
                className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-[#8F9CAE]/40 focus:outline-none"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161B26] border border-[#262D3D] shrink-0 font-bold text-xs text-white">
                {isSolToUsdc ? (
                  <>
                    <Image
                      src="/sol-logo.svg"
                      alt="SOL"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5 rounded-full object-contain shrink-0"
                    />
                    <span>SOL</span>
                  </>
                ) : (
                  <>
                    <Image
                      src="/usdc-logo.svg"
                      alt="USDC"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5 rounded-full object-contain shrink-0"
                    />
                    <span>USDC</span>
                  </>
                )}
              </div>
            </div>

            {/* Percentage Shortcuts */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {[25, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageSelect(pct)}
                    className="px-2 py-0.5 rounded-md bg-[#161B26] hover:bg-[#262D3D] border border-[#262D3D]/60 text-[10px] font-semibold text-[#8F9CAE] hover:text-white transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePercentageSelect(100)}
                  className="px-2 py-0.5 rounded-md bg-[#CDE06A]/10 hover:bg-[#CDE06A]/20 border border-[#CDE06A]/30 text-[10px] font-bold text-[#CDE06A] transition-colors"
                >
                  MAX
                </button>
              </div>

              {isSolToUsdc && (
                <span className="text-[10px] text-[#8F9CAE] font-medium hidden sm:inline">
                  Reserves 0.02 SOL for network fees
                </span>
              )}
            </div>
          </div>

          {/* Direction Switcher Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleToggleDirection}
              disabled={status === "signing" || status === "confirming"}
              className="p-2 rounded-xl bg-[#161B26] hover:bg-[#262D3D] border border-[#262D3D] text-[#CDE06A] hover:scale-105 transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Reverse Swap Direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO Output Box */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8F9CAE]">
              <span className="font-semibold text-slate-300">You Receive (Estimated)</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span>Balance:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {isSolToUsdc ? (
                    <>
                      <Image
                        src="/usdc-logo.svg"
                        alt="USDC"
                        width={13}
                        height={13}
                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                      />
                      <span>${usdcBalance.toFixed(2)} USDC</span>
                    </>
                  ) : (
                    <>
                      <Image
                        src="/sol-logo.svg"
                        alt="SOL"
                        width={13}
                        height={13}
                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                      />
                      <span>{solBalance.toFixed(3)} SOL</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xl sm:text-2xl font-bold text-[#CDE06A]">
                {quoting ? (
                  <span className="text-[#8F9CAE] text-base animate-pulse flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching live quote...</span>
                  </span>
                ) : estimatedOutputAmount > 0 ? (
                  estimatedOutputAmount.toFixed(isSolToUsdc ? 2 : 4)
                ) : (
                  "0.00"
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161B26] border border-[#262D3D] shrink-0 font-bold text-xs text-white">
                {isSolToUsdc ? (
                  <>
                    <Image
                      src="/usdc-logo.svg"
                      alt="USDC"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5 rounded-full object-contain shrink-0"
                    />
                    <span>USDC</span>
                  </>
                ) : (
                  <>
                    <Image
                      src="/sol-logo.svg"
                      alt="SOL"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5 rounded-full object-contain shrink-0"
                    />
                    <span>SOL</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quote Details & Slippage Settings */}
        {quote && !quoting && (
          <div className="p-3 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] text-[11px] space-y-1.5 font-medium text-[#8F9CAE]">
            <div className="flex items-center justify-between">
              <span>Rate:</span>
              <span className="text-white font-mono">
                {isSolToUsdc
                  ? `1 SOL ≈ $${(estimatedOutputAmount / (Number(inputAmount) || 1)).toFixed(2)} USDC`
                  : `1 USDC ≈ ${(estimatedOutputAmount / (Number(inputAmount) || 1)).toFixed(5)} SOL`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Price Impact:</span>
              <span
                className={`font-mono ${
                  Number(quote.priceImpactPct) > 0.01 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {(Number(quote.priceImpactPct) * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#262D3D]/40">
              <span>Slippage Tolerance:</span>
              <div className="flex items-center gap-1.5">
                {[30, 50, 100].map((bps) => (
                  <button
                    key={bps}
                    type="button"
                    onClick={() => setSlippageBps(bps)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      slippageBps === bps
                        ? "bg-[#CDE06A] text-[#0B0E14]"
                        : "bg-[#161B26] text-[#8F9CAE] hover:text-white"
                    }`}
                  >
                    {bps / 100}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error / Alert Banners */}
        {quoteError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{quoteError}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {status === "success" && txSignature && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Swap Confirmed on Solana Mainnet!</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Your balances have been updated automatically across Slyz.
            </p>
            <div className="pt-1">
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#8D8AFF] hover:underline font-bold text-[11px]"
              >
                <span>View on Solscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div>
          {status === "success" ? (
            <button
              type="button"
              onClick={closeQuickSwap}
              className="w-full btn-primary !py-3 text-xs font-bold"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecuteSwap}
              disabled={
                !wallet.publicKey ||
                !quote ||
                quoting ||
                status === "signing" ||
                status === "confirming" ||
                !!quoteError
              }
              className="w-full btn-primary !py-3 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "signing" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Approving in Wallet...</span>
                </>
              ) : status === "confirming" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Confirming on Solana...</span>
                </>
              ) : !wallet.publicKey ? (
                <span>Connect Wallet to Swap</span>
              ) : !inputAmount || parseFloat(inputAmount) <= 0 ? (
                <span>Enter Amount</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Swap {inputSymbol} ➔ {outputSymbol}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
