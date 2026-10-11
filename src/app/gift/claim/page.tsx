"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Gift,
  Clock,
  ArrowDownLeft,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  PieChart,
} from "lucide-react";
import confetti from "canvas-confetti";
import { VERIFIED_STOCKS } from "@/lib/constants";
import {
  GiftClaimPayload,
  parseGiftClaimFromHash,
  executeClaimGift,
  simulateClaimGift,
} from "@/lib/gifting";
import { GiftCountdownClock } from "@/components/GiftCountdownClock";

export default function GiftClaimPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [mounted, setMounted] = useState(false);
  const [payload, setPayload] = useState<GiftClaimPayload | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [claimStatus, setClaimStatus] = useState<"idle" | "claiming" | "claimed" | "reclaimed" | "failed">("idle");
  const [claimTxSig, setClaimTxSig] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const parsed = parseGiftClaimFromHash(window.location.hash);
      if (parsed) {
        setPayload(parsed);
        const now = Math.floor(Date.now() / 1000);
        const expired = Boolean(
          parsed.expiryTimestamp && parsed.expiryTimestamp > 0 && now >= parsed.expiryTimestamp
        );
        setIsExpired(expired);

        // Fetch backend status to verify if already claimed or reclaimed
        if (parsed.id) {
          fetch(`/api/gifts/${parsed.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data?.gift?.status === "claimed") {
                setClaimStatus("claimed");
                if (data.gift.signature) {
                  setClaimTxSig(data.gift.signature);
                }
              } else if (data?.gift?.status === "reclaimed") {
                setClaimStatus("reclaimed");
                if (data.gift.signature) {
                  setClaimTxSig(data.gift.signature);
                }
              }
            })
            .catch(() => {});
        }
      }
    }
  }, []);

  // Pre-flight simulation check when wallet is connected
  useEffect(() => {
    if (!wallet.publicKey || !payload || isExpired || claimStatus === "claimed") {
      setSimulationError(null);
      setIsSimulating(false);
      return;
    }

    let active = true;
    setIsSimulating(true);
    setSimulationError(null);

    simulateClaimGift({
      connection,
      payload,
      recipientPublicKey: wallet.publicKey,
    })
      .then((res) => {
        if (!active) return;
        setIsSimulating(false);
        if (!res.success) {
          setSimulationError(res.error || "Simulation failed");
        } else {
          setSimulationError(null);
        }
      })
      .catch((err) => {
        if (!active) return;
        setIsSimulating(false);
        setSimulationError(err?.message || "Simulation failed");
      });

    return () => {
      active = false;
    };
  }, [connection, wallet.publicKey, payload, isExpired, claimStatus]);

  const handleExpireEvent = () => {
    setIsExpired(true);
  };

  const handleClaim = async () => {
    if (!wallet.publicKey) {
      setWalletModalVisible(true);
      return;
    }

    if (!payload) return;

    if (isExpired) {
      setErrorMessage("This gift link has expired and can no longer be claimed.");
      return;
    }

    if (simulationError) {
      setErrorMessage(simulationError);
      return;
    }

    setClaimStatus("claiming");
    setErrorMessage(null);

    try {
      const sig = await executeClaimGift({
        connection,
        payload,
        recipientPublicKey: wallet.publicKey,
      });

      setClaimTxSig(sig);
      setClaimStatus("claimed");

      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#CDE06A", "#8D8AFF", "#FFFFFF"],
      });
    } catch (err: any) {
      console.error("Error executing gift claim:", err);
      setErrorMessage(
        err?.message?.includes("custom program error: 0x1")
          ? "This gift has already been claimed or is no longer available in the vault."
          : err?.message || "Failed to claim gift. Please try again."
      );
      setClaimStatus("failed");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#CDE06A] animate-spin" />
      </div>
    );
  }

  // Invalid or missing payload
  if (!payload) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-[#161B26] border border-[#262D3D] text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Invalid or Incomplete Gift Link</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            The gift link appears to be missing its security payload. Please check the original link you received and ensure the entire URL is copied.
          </p>
        </div>
        <Link href="/" className="btn-primary inline-flex items-center gap-2 text-xs">
          <span>Go to Slyz Home</span>
        </Link>
      </div>
    );
  }

  const asset = VERIFIED_STOCKS[payload.symbol] || {
    symbol: payload.symbol,
    name: payload.symbol,
    underlying: payload.symbol,
    logo: "",
    market: "public",
  };
  const isPrivate = asset.market === "private";

  const themeConfig = {
    gold: {
      accentBg: "bg-[#161B26] border-[#262D3D] text-white",
      btnGrad: "from-[#F5A623] to-[#D97706] text-[#0B0E14]",
    },
    lime: {
      accentBg: "bg-[#161B26] border-[#262D3D] text-white",
      btnGrad: "from-[#CDE06A] to-[#A8C738] text-[#0B0E14]",
    },
    purple: {
      accentBg: "bg-[#161B26] border-[#262D3D] text-white",
      btnGrad: "from-[#8D8AFF] to-[#6A66FF] text-white",
    },
  }[payload.theme || (isPrivate ? "gold" : "lime")];

  return (
    <div className="max-w-lg mx-auto py-4 sm:py-6 px-4">
      <div className="rounded-3xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-6">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] text-[10px] font-semibold uppercase tracking-wider">
            {isPrivate ? "Private Pre-IPO Equity Gift" : "Tokenized Equity Gift"}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-[#8F9CAE]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#CDE06A]" />
            <span>Non-Custodial Solana Vault</span>
          </div>
        </div>

        {/* Central Visual: Expired vs Active Gift Card */}
        {isExpired ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase font-bold text-rose-400 tracking-wider">
                Claim Window Elapsed
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                This Gift Link Has Expired
              </h2>
              <p className="text-xs text-[#8F9CAE] max-w-sm mx-auto leading-relaxed">
                The sender set an expiration time for this claim link which has now elapsed.
                Unclaimed shares remain securely in the escrow vault.
              </p>
              {payload.note && (
                <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-[#262D3D] max-w-sm mx-auto text-xs text-slate-300 italic mt-3">
                  &ldquo;{payload.note}&rdquo;
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-xs font-mono text-[#8F9CAE]">
              Original Gift: ${payload.estimatedUsd.toFixed(2)} in {asset.underlying} from {payload.senderName}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-5 py-2">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#0B0E14] border border-[#262D3D] mx-auto flex items-center justify-center">
                {asset.logo ? (
                  <Image
                    src={asset.logo}
                    alt={asset.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <span className="font-mono text-xl font-bold">{payload.symbol.slice(0, 3)}</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#CDE06A] text-[#0B0E14] flex items-center justify-center shadow-md">
                <Gift className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-[#8F9CAE] font-medium block">
                Gifted by <strong className="text-white">{payload.senderName}</strong>
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                ${payload.estimatedUsd.toFixed(2)} in {asset.underlying}
              </h2>
              <p className="text-xs font-mono text-[#CDE06A]">
                {(payload.netShareAmount ?? payload.shareAmount).toFixed(4)} {isPrivate ? "PreStocks Shares" : "xStocks Shares"}
                {payload.feeBps && payload.feeBps > 0 ? " (net after 1% issuer fee)" : ""}
              </p>

              {payload.note && (
                <div className="p-3.5 rounded-2xl bg-[#0B0E14]/70 border border-white/5 max-w-sm mx-auto text-xs text-slate-300 italic mt-3">
                  &ldquo;{payload.note}&rdquo;
                </div>
              )}
            </div>

            {/* Live Expiration Countdown Clock (Sender-Set UX Window) */}
            {payload.expiryTimestamp > 0 && (
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#F5A623] font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sender-Set Expiry Window:</span>
                </div>
                <GiftCountdownClock
                  targetTimestamp={payload.expiryTimestamp}
                  onUnlock={handleExpireEvent}
                  theme={payload.theme}
                />
                <p className="text-[11px] text-[#8F9CAE]">
                  Claim your stock before this countdown hits zero!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Notice */}
        {(errorMessage || simulationError) && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage || simulationError}</span>
          </div>
        )}

        {/* Claim Actions */}
        <div className="pt-2">
          {claimStatus === "reclaimed" ? (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-purple-400 mx-auto" />
              <div>
                <h4 className="font-bold text-white text-base">Gift Link Reclaimed & Void</h4>
                <p className="text-xs text-[#8F9CAE]">
                  The sender has already reclaimed these shares back to their wallet. This claim link is permanently inert.
                </p>
              </div>
              {claimTxSig && (
                <a
                  href={`https://solscan.io/tx/${claimTxSig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8D8AFF] hover:underline font-mono"
                >
                  <span>View On-Chain Receipt on Solscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : claimStatus === "claimed" ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div>
                <h4 className="font-bold text-white text-base">Shares Safely in Your Wallet!</h4>
                <p className="text-xs text-[#8F9CAE]">
                  You now own {(payload.netShareAmount ?? payload.shareAmount).toFixed(4)} shares of {asset.name}.
                </p>
              </div>
              {claimTxSig && (
                <a
                  href={`https://solscan.io/tx/${claimTxSig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#CDE06A] hover:underline font-mono"
                >
                  <span>View On-Chain Receipt on Solscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className="pt-2 flex gap-2">
                <Link
                  href="/portfolio"
                  className="btn-primary w-full flex items-center justify-center gap-2 text-xs"
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>View in Slyz Portfolio</span>
                </Link>
              </div>
            </div>
          ) : isExpired ? (
            <div className="text-center space-y-3">
              <button
                disabled
                className="w-full py-3 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
              >
                <Clock className="w-4 h-4 text-rose-400" />
                <span>Link Expired — Cannot Claim</span>
              </button>
              <p className="text-[11px] text-[#8F9CAE]">
                Contact {payload.senderName} if you would like them to send a new gift link.
              </p>
            </div>
          ) : !wallet.connected ? (
            <button
              type="button"
              onClick={() => setWalletModalVisible(true)}
              className="w-full btn-primary !py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Connect Solana Wallet to Claim</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              disabled={claimStatus === "claiming" || isSimulating || Boolean(simulationError)}
              className={`w-full btn-primary !py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg ${
                Boolean(simulationError) || isSimulating ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {claimStatus === "claiming" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring Shares to Wallet...</span>
                </>
              ) : isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Simulating Claim Transaction...</span>
                </>
              ) : simulationError ? (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Claim Unavailable</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  <span>Claim {(payload.netShareAmount ?? payload.shareAmount).toFixed(4)} {asset.underlying} to Wallet</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
