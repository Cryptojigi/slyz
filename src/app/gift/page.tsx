"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Gift,
  Clock,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  TrendingUp,
  KeyRound,
  ArrowRight,
  Wallet,
  Layers,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  VERIFIED_STOCKS,
  CURATED_BASKETS,
  BasketComponent,
} from "@/lib/constants";
import { getJupiterPrices, TokenPriceInfo, getCachedJupiterPrices } from "@/lib/jupiter";
import { fetchUserBalances, UserBalances } from "@/lib/solana";
import {
  fetchPreStocksLive,
  PreStockAssetLive,
  PRESTOCKS_FALLBACK,
} from "@/lib/prestocks";
import {
  getStoredBaskets,
  calculatePortfolioPositions,
  PortfolioPosition,
} from "@/lib/portfolio";
import { GiftStockModal } from "@/components/GiftStockModal";
import { getStoredSentGifts, SentGiftRecord } from "@/lib/gifting";
import { getOrSignWalletAuth } from "@/lib/walletAuthClient";
import { GiftCountdownClock } from "@/components/GiftCountdownClock";

export default function GiftHubPage() {
  const wallet = useWallet();
  const [balances, setBalances] = useState<UserBalances>({
    solBalance: 0,
    usdcBalance: 0,
    token2022Balances: {},
    token2022RawAmounts: {},
    hasSufficientGas: false,
  });
  const [prices, setPrices] = useState<Record<string, TokenPriceInfo>>({});
  const [preStocksLive, setPreStocksLive] = useState<Record<string, PreStockAssetLive>>(PRESTOCKS_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Gifting state
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);
  const [sentGifts, setSentGifts] = useState<SentGiftRecord[]>([]);
  const [copiedGiftId, setCopiedGiftId] = useState<string | null>(null);
  const [vaultFilter, setVaultFilter] = useState<"all" | "active" | "claimed" | "expired" | "drafts">("all");
  const [loadingGifts, setLoadingGifts] = useState(false);

  // Load cached prices and sent gifts on mount
  useEffect(() => {
    setMounted(true);
    const cachedPrices = getCachedJupiterPrices();
    if (Object.keys(cachedPrices).length > 0) {
      setPrices(cachedPrices);
    }
    setSentGifts(getStoredSentGifts());
  }, []);

  // Fetch balances and prices
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allMints = Object.values(VERIFIED_STOCKS).map((s) => s.mint);
      const [priceMap, preStocksMap] = await Promise.all([
        getJupiterPrices(allMints),
        fetchPreStocksLive(),
      ]);
      setPrices(priceMap);
      if (preStocksMap) setPreStocksLive(preStocksMap);

      if (wallet.publicKey) {
        const userBal = await fetchUserBalances(wallet.publicKey);
        setBalances(userBal);
      }
    } catch (e) {
      console.error("Error loading gifting hub data:", e);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey]);

  // Load Sent Gifts from Supabase with wallet authentication
  const loadSentGifts = useCallback(async () => {
    if (!wallet.publicKey) {
      setSentGifts([]);
      return;
    }
    setLoadingGifts(true);
    try {
      const authHeaders = await getOrSignWalletAuth(wallet);
      if (!authHeaders) return;

      const res = await fetch(`/api/gifts?sender=${wallet.publicKey.toBase58()}`, {
        headers: authHeaders,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.gifts) {
          const mapped: SentGiftRecord[] = data.gifts.map((g: any) => ({
            id: g.id,
            symbol: g.symbol,
            shareAmount: g.rawAmount ? Number(g.rawAmount) / 1e8 : 0,
            rawAmountString: g.rawAmount,
            estimatedUsd: g.estimatedUsd,
            senderName: "You",
            senderPublicKey: g.sender,
            deliveryType: "link",
            claimUrl: g.claimUrl,
            vaultPublicKey: g.vault,
            secretKeyBase58: g.secretKeyBase58,
            txSignature: g.signature || "",
            createdAt: new Date(g.createdAt).getTime(),
            unlockTimestamp: g.unlockAt ? Math.floor(new Date(g.unlockAt).getTime() / 1000) : 0,
            expiryTimestamp: g.expiresAt ? Math.floor(new Date(g.expiresAt).getTime() / 1000) : 0,
            status: g.status,
            theme: "gold",
            note: g.note || "",
          }));
          setSentGifts(mapped);
          try {
            localStorage.setItem("slyz_sent_gifts", JSON.stringify(mapped));
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Failed to retrieve remote gift records:", err);
      setSentGifts(getStoredSentGifts());
    } finally {
      setLoadingGifts(false);
    }
  }, [wallet.publicKey, wallet.signMessage]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 25000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadSentGifts();
    }
  }, [wallet.connected, wallet.publicKey, loadSentGifts]);

  // Discard draft awaiting signature
  const handleDiscardDraft = async (id: string) => {
    try {
      const authHeaders = await getOrSignWalletAuth(wallet);
      if (!authHeaders) return;
      const res = await fetch(`/api/gifts?id=${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setSentGifts((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (err) {
      console.error("Failed to discard draft:", err);
    }
  };

  // Derive user positions
  const storedBaskets = mounted ? getStoredBaskets() : [];
  const targetComponents: BasketComponent[] =
    storedBaskets.length > 0
      ? storedBaskets[0].components
      : CURATED_BASKETS[0].components;

  const { positions } = calculatePortfolioPositions(
    targetComponents,
    balances.token2022Balances,
    prices,
    balances.token2022RawAmounts,
    preStocksLive
  );

  const userHoldingsWithBalance = positions.filter((p) => p.rawBalance > 0.000001);

  // Copy link handler
  const handleCopyLink = (giftId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedGiftId(giftId);
    setTimeout(() => setCopiedGiftId(null), 2500);
  };

  // Filtered sent gifts based on expiration & status
  const nowSec = Math.floor(Date.now() / 1000);
  const filteredGifts = sentGifts.filter((g) => {
    const isExpired = g.expiryTimestamp > 0 && g.expiryTimestamp <= nowSec && g.status !== "claimed";
    const isActive = (g.status === "funded" || g.status === "submitted") && (g.expiryTimestamp === 0 || g.expiryTimestamp > nowSec);
    const isDraft = g.status === "awaiting_signature";

    if (vaultFilter === "active") return isActive;
    if (vaultFilter === "claimed") return g.status === "claimed";
    if (vaultFilter === "expired") return isExpired;
    if (vaultFilter === "drafts") return isDraft;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-4">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161B26] via-[#10141D] to-[#0B0E14] border border-[#262D3D] p-6 sm:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#CDE06A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-[#8D8AFF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Gift Tokenized Stocks <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CDE06A] to-[#8D8AFF]">
                With Expiring Claim Links
              </span>
            </h1>
            <p className="text-sm text-[#8F9CAE] leading-relaxed">
              Surprise friends or family with fractional shares of Apple, Tesla, or Nvidia.
              Generate a non-custodial claim link with custom expiration and sponsored zero-fee claiming.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setSelectedStockSymbol(null);
                setIsGiftModalOpen(true);
              }}
              className="btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold shadow-lg shadow-[#CDE06A]/10 cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>Create a Stock Gift</span>
            </button>
            <Link
              href="/dashboard"
              className="btn-secondary flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-[#8F9CAE] hover:text-white"
            >
              <Layers className="w-4 h-4" />
              <span>Browse Stocks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Disconnected State Hint */}
      {!wallet.connected && (
        <div className="p-6 rounded-2xl bg-[#161B26] border border-[#262D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1D2332] text-[#CDE06A] flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Connect Wallet to Gift Your Stock Positions</h4>
              <p className="text-xs text-[#8F9CAE]">
                Connect Phantom, Solflare, or Backpack to send any of your tokenized stock holdings as an instant claimable link.
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="btn-primary text-xs font-bold whitespace-nowrap self-center sm:self-auto">
            Go to Terminal
          </Link>
        </div>
      )}

      {/* User's Available Stock Holdings to Gift */}
      {wallet.connected && userHoldingsWithBalance.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#CDE06A]" />
              <h2 className="text-lg font-bold text-white">Your Available Stock Holdings</h2>
            </div>
            <span className="text-xs text-[#8F9CAE]">
              {userHoldingsWithBalance.length} Giftable Asset{userHoldingsWithBalance.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {userHoldingsWithBalance.map((pos) => {
              const stock = VERIFIED_STOCKS[pos.symbol];
              return (
                <div
                  key={pos.symbol}
                  className="p-4 rounded-2xl bg-[#161B26] border border-[#262D3D] hover:border-[#CDE06A]/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0B0E14] border border-[#262D3D] flex items-center justify-center shrink-0 overflow-hidden">
                      {stock?.logo ? (
                        <Image
                          src={stock.logo}
                          alt={pos.symbol}
                          width={32}
                          height={32}
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#8D8AFF]">{pos.symbol.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{pos.underlying || pos.symbol}</h4>
                      <p className="text-xs text-[#8F9CAE] font-mono">
                        {pos.shareEquivalents.toFixed(4)} shares • ${pos.currentValueUsd.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedStockSymbol(pos.symbol);
                      setIsGiftModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#CDE06A]/10 hover:bg-[#CDE06A]/20 border border-[#CDE06A]/30 hover:border-[#CDE06A] text-[#CDE06A] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Gift</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sent Gifts Vaults Tracker */}
      <div className="bento-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262D3D] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F5A623]" />
              <h2 className="font-bold text-base text-white">Sent Gift Vaults & Status</h2>
              {wallet.connected && (
                <button
                  onClick={loadSentGifts}
                  disabled={loadingGifts}
                  title="Refresh Gift Records"
                  className="p-1 rounded-lg text-[#8F9CAE] hover:text-white transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingGifts ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
            <p className="text-xs text-[#8F9CAE] mt-0.5">
              Track live countdowns, copy claim links, or monitor on-chain settlement status.
            </p>
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-1.5 bg-[#0B0E14] p-1 rounded-xl border border-[#262D3D] flex-wrap">
            {(["all", "active", "claimed", "expired", "drafts"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setVaultFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  vaultFilter === filter
                    ? "bg-[#CDE06A] text-[#0B0E14]"
                    : "text-[#8F9CAE] hover:text-white"
                }`}
              >
                {filter === "active" ? "Active Links" : filter === "drafts" ? "Drafts" : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Empty Vault State */}
        {filteredGifts.length === 0 && (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161B26] border border-[#262D3D] text-[#8F9CAE] mx-auto flex items-center justify-center">
              <Gift className="w-6 h-6 text-[#CDE06A]" />
            </div>
            <h3 className="font-bold text-white text-base">No Gift Vaults Found</h3>
            <p className="text-xs text-[#8F9CAE] max-w-sm mx-auto">
              {sentGifts.length === 0
                ? "You haven't created any stock gifts yet. Surprise someone with fractional shares and an expiring claim link!"
                : "No gifts match the selected filter."}
            </p>
            {sentGifts.length === 0 && wallet.connected && (
              <button
                onClick={() => {
                  setSelectedStockSymbol(null);
                  setIsGiftModalOpen(true);
                }}
                className="btn-primary text-xs py-2 px-4 font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Your First Gift</span>
              </button>
            )}
          </div>
        )}

        {/* Gifts Grid */}
        {filteredGifts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredGifts.map((gift) => {
              const asset = VERIFIED_STOCKS[gift.symbol];
              const isExpired = gift.expiryTimestamp > 0 && gift.expiryTimestamp <= nowSec && gift.status !== "claimed";
              const isActive = (gift.status === "funded" || gift.status === "submitted") && (gift.expiryTimestamp === 0 || gift.expiryTimestamp > nowSec);
              const isDraft = gift.status === "awaiting_signature";
              const isUnknown = gift.status === "unknown";

              return (
                <div
                  key={gift.id}
                  className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262D3D] space-y-3 hover:border-[#262D3D]/80 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#161B26] border border-[#262D3D] flex items-center justify-center overflow-hidden shrink-0">
                        {asset?.logo ? (
                          <Image
                            src={asset.logo}
                            alt={gift.symbol}
                            width={36}
                            height={36}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs font-bold text-[#CDE06A]">{gift.symbol.slice(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            ${gift.estimatedUsd.toFixed(2)} in {asset?.underlying || gift.symbol}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8F9CAE] font-mono block">
                          {gift.note ? `"${gift.note}"` : "Claim Link Escrow"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${
                        gift.status === "claimed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : gift.status === "reclaimed"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                          : isDraft
                          ? "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                          : isUnknown
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : isExpired
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-[#CDE06A]/10 text-[#CDE06A] border border-[#CDE06A]/30"
                      }`}
                    >
                      {gift.status === "claimed"
                        ? "Claimed"
                        : gift.status === "reclaimed"
                        ? "Reclaimed"
                        : isDraft
                        ? "Not Sent"
                        : isUnknown
                        ? "Pending Confirm"
                        : isExpired
                        ? "Expired"
                        : "Active Link"}
                    </span>
                  </div>

                  {/* Countdown preview if active */}
                  {isActive && gift.expiryTimestamp > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#161B26]/60 border border-[#262D3D]/50 flex items-center justify-between text-xs">
                      <span className="text-[#8F9CAE] text-[11px] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span>Expires in:</span>
                      </span>
                      <GiftCountdownClock
                        targetTimestamp={gift.expiryTimestamp}
                        theme="gold"
                      />
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#262D3D]/50 text-xs">
                    {isDraft ? (
                      <button
                        type="button"
                        onClick={() => handleDiscardDraft(gift.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard Draft</span>
                      </button>
                    ) : gift.status === "claimed" ? (
                      <span className="text-xs text-[#8F9CAE] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Settled & Void</span>
                      </span>
                    ) : gift.status === "reclaimed" ? (
                      <span className="text-xs text-[#8F9CAE] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Reclaimed & Destroyed</span>
                      </span>
                    ) : gift.claimUrl ? (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(gift.id, gift.claimUrl!)}
                        className="text-xs text-[#CDE06A] hover:underline flex items-center gap-1.5 font-semibold cursor-pointer"
                      >
                        {copiedGiftId === gift.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Claim Link</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-[#8F9CAE]">Link Unavailable</span>
                    )}

                    {gift.txSignature && (
                      <a
                        href={`https://solscan.io/tx/${gift.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#8F9CAE] hover:text-white flex items-center gap-1"
                      >
                        <span>Solscan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gift Stock Modal */}
      {isGiftModalOpen && (
        <GiftStockModal
          isOpen={isGiftModalOpen}
          onClose={() => {
            setIsGiftModalOpen(false);
            setSelectedStockSymbol(null);
          }}
          initialSymbol={selectedStockSymbol}
          positions={positions}
          solBalance={balances.solBalance}
          onSuccess={() => {
            loadData();
            loadSentGifts();
          }}
        />
      )}
    </div>
  );
}
