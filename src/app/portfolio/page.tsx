"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  PieChart as PieIcon,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
  ExternalLink,
  PlusCircle,
  ArrowDownLeft,
  Layers,
  Sliders,
} from "lucide-react";
import {
  VERIFIED_STOCKS,
  CURATED_BASKETS,
  BasketComponent,
} from "@/lib/constants";
import { getJupiterPrices, TokenPriceInfo } from "@/lib/jupiter";
import { fetchUserBalances, UserBalances } from "@/lib/solana";
import {
  fetchPreStocksLive,
  PreStockAssetLive,
  PRESTOCKS_FALLBACK,
} from "@/lib/prestocks";
import {
  getStoredBaskets,
  StoredBasket,
  calculatePortfolioPositions,
  calculateSmartTopUp,
  PortfolioPosition,
} from "@/lib/portfolio";
import { DonutChart, DONUT_COLORS } from "@/components/DonutChart";
import { ExecutionModal } from "@/components/ExecutionModal";
import { LiquidationModal } from "@/components/LiquidationModal";

export default function PortfolioPage() {
  const wallet = useWallet();

  const [storedBaskets, setStoredBaskets] = useState<StoredBasket[]>([]);
  const [selectedBasketIndex, setSelectedBasketIndex] = useState<number>(0);
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

  // Smart Top-Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmountUsd, setTopUpAmountUsd] = useState(50);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

  // Liquidation / Exit Modal State
  const [isLiquidationOpen, setIsLiquidationOpen] = useState(false);

  // Load stored baskets from localStorage
  useEffect(() => {
    const loaded = getStoredBaskets();
    setStoredBaskets(loaded);
  }, []);

  // Fetch on-chain balances and live prices
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
      console.error("Error loading portfolio data:", e);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 25000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Check if wallet holds any on-chain xStock balances
  const onChainHoldingsCount = Object.values(balances.token2022Balances).filter(
    (b) => b > 0.0001
  ).length;

  const hasInvestedBaskets = storedBaskets.length > 0;
  const hasOnChainPositions = onChainHoldingsCount > 0;

  // Active target components:
  // 1. From user's saved baskets in localStorage
  // 2. OR detected directly on-chain if user holds xStocks
  // 3. Fallback placeholder (only used if actively viewing a demo)
  let activeBasket: StoredBasket;

  if (hasInvestedBaskets) {
    activeBasket = storedBaskets[selectedBasketIndex] || storedBaskets[0];
  } else if (hasOnChainPositions) {
    const detectedComponents: BasketComponent[] = Object.entries(balances.token2022Balances)
      .filter(([, bal]) => bal > 0.0001)
      .map(([mint]) => {
        const found = Object.values(VERIFIED_STOCKS).find((s) => s.mint === mint);
        return {
          symbol: found ? found.symbol : "NVDAx",
          targetWeight: Math.round(100 / Math.max(1, onChainHoldingsCount)),
        };
      });

    activeBasket = {
      id: "onchain-detected",
      name: "On-Chain Active Holdings",
      investedAt: Date.now(),
      components: detectedComponents,
      initialDepositUsd: 0,
      txSignatures: [],
    };
  } else {
    activeBasket = {
      id: "empty",
      name: "Empty Portfolio",
      investedAt: Date.now(),
      components: CURATED_BASKETS[0].components,
      initialDepositUsd: 0,
      txSignatures: [],
    };
  }

  // Calculate positions and drift
  const { positions, totalValueUsd, maxDriftPct } = calculatePortfolioPositions(
    activeBasket.components,
    balances.token2022Balances,
    prices,
    balances.token2022RawAmounts,
    preStocksLive
  );

  // Donut chart slices for current holdings
  const donutData = positions.map((p, idx) => ({
    name: p.underlying,
    value: p.currentWeightPct > 0 ? p.currentWeightPct : p.targetWeightPct,
    color: DONUT_COLORS[idx % DONUT_COLORS.length],
    usdAmount: p.currentValueUsd,
  }));

  // Calculate Smart Top-Up suggestions
  const topUpPlan = calculateSmartTopUp(positions, topUpAmountUsd);

  // Build exact dollar legs for Top-Up execution (filter dust < $1, push residual cents into largest leg)
  const rawTopUpLegs = topUpPlan
    .filter((p) => p.allocationUsd >= 1)
    .map((p) => ({ symbol: p.symbol, amountUsd: p.allocationUsd }));

  const topUpLegs = [...rawTopUpLegs];
  const totalAllocated = topUpLegs.reduce((acc, l) => acc + l.amountUsd, 0);
  const residual = Math.round((topUpAmountUsd - totalAllocated) * 100) / 100;
  if (residual > 0 && topUpLegs.length > 0) {
    const largest = topUpLegs.reduce((a, b) => (b.amountUsd > a.amountUsd ? b : a));
    largest.amountUsd = Math.round((largest.amountUsd + residual) * 100) / 100;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#CDE06A] mb-2">
            Non-Custodial
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Portfolio & Drift Tracker
          </h1>
          <p className="text-xs text-[#8F9CAE] mt-0.5">
            Real-time on-chain Token-2022 share balances and automated rebalancing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTopUpOpen(true)}
            disabled={!wallet.connected || totalValueUsd <= 0}
            className="btn-primary flex items-center gap-2 text-xs disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Smart Top-Up</span>
          </button>

          <button
            onClick={() => setIsLiquidationOpen(true)}
            disabled={!wallet.connected || totalValueUsd <= 0.05}
            className="btn-secondary flex items-center gap-2 text-xs border-rose-500/30 text-rose-300 hover:bg-rose-950/40 hover:border-rose-500 disabled:opacity-50"
            title="Liquidate all positions in this pie back to USDC"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Liquidate to USDC</span>
          </button>

          <Link href="/dashboard" className="btn-secondary flex items-center gap-1.5 text-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Pie</span>
          </Link>
        </div>
      </div>

      {/* RPC Error Alert */}
      {balances.rpcError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Could not reach Solana RPC. Please check your network or RPC configuration.</span>
          </div>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Disconnected Notice */}
      {!wallet.connected && (
        <div className="p-8 rounded-xl bg-[#161B26] border border-[#262D3D] text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-[#1D2332] text-[#CDE06A] mx-auto flex items-center justify-center">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Connect Your Solana Wallet</h3>
            <p className="text-xs text-[#8F9CAE] max-w-md mx-auto leading-relaxed">
              Connect Phantom or Solflare to view your active tokenized equity balances, track
              portfolio drift, and execute automated rebalancing.
            </p>
          </div>
        </div>
      )}

      {/* Connected but Empty Wallet (Zero holdings and no saved baskets) */}
      {wallet.connected && !loading && !hasInvestedBaskets && !hasOnChainPositions && (
        <div className="bento-card text-center py-16 px-8 max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-xl bg-[#161B26] border border-[#262D3D] text-[#8D8AFF] mx-auto flex items-center justify-center">
            <PieIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="pill-badge pill-badge-lime">Clean Slate</span>
            <h3 className="text-2xl font-extrabold text-white">No Active Theme Pies Yet</h3>
            <p className="text-sm text-[#8F9CAE] max-w-md mx-auto leading-relaxed">
              This wallet doesn&apos;t hold any tokenized stock positions yet. Choose a curated theme or design your own custom basket with fractional shares from just $10 USDC.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/dashboard" className="btn-primary flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Explore Curated Pies</span>
            </Link>
            <Link href="/dashboard" className="btn-secondary flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#8D8AFF]" />
              <span>Build Custom Slyz</span>
            </Link>
          </div>
        </div>
      )}

      {/* Active Holdings View */}
      {(hasInvestedBaskets || hasOnChainPositions || totalValueUsd > 0) && (
        <>
          {/* Multiple Baskets Switcher Tabs */}
          {storedBaskets.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#262D3D]">
              <span className="text-xs font-bold uppercase text-[#8F9CAE] mr-2">Your Pies:</span>
              {storedBaskets.map((basket, idx) => (
                <button
                  key={basket.id}
                  onClick={() => setSelectedBasketIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedBasketIndex === idx
                      ? "bg-[#CDE06A] text-[#0B0E14] shadow-lg shadow-[#CDE06A]/10"
                      : "bg-[#161B26] border border-[#262D3D] text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  {basket.name}
                </button>
              ))}
            </div>
          )}

          {/* Overview Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Total Stock Value */}
            <div className="bento-card">
              <span className="text-xs font-semibold text-[#8F9CAE] uppercase block mb-1">
                Total xStocks Holdings
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  ${totalValueUsd.toFixed(2)}
                </span>
                <span className="text-xs text-[#8F9CAE] font-mono">USD</span>
              </div>
              <span className="text-[11px] text-[#CDE06A] font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Token-2022 Scaled UI Shares</span>
              </span>
            </div>

            {/* Card 2: Maximum Drift */}
            <div className="bento-card">
              <span className="text-xs font-semibold text-[#8F9CAE] uppercase block mb-1">
                Portfolio Allocation Drift
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    maxDriftPct > 5 ? "text-amber-400" : "text-[#CDE06A]"
                  }`}
                >
                  {maxDriftPct.toFixed(1)}%
                </span>
                <span className="text-xs text-[#8F9CAE]">max deviation</span>
              </div>
              <p className="text-[11px] text-[#8F9CAE] mt-2">
                {maxDriftPct > 5
                  ? "Rebalance recommended via Smart Top-Up"
                  : "Well aligned with target weights"}
              </p>
            </div>

            {/* Card 3: Wallet Liquidity */}
            <div className="bento-card">
              <span className="text-xs font-semibold text-[#8F9CAE] uppercase block mb-1">
                Available Wallet Capital
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  ${balances.usdcBalance.toFixed(2)}
                </span>
                <span className="text-xs text-[#8F9CAE] font-mono">USDC</span>
              </div>
              <span className="text-[11px] text-[#8F9CAE] mt-2 block font-mono">
                Gas: {balances.solBalance.toFixed(3)} SOL{" "}
                {balances.hasSufficientGas ? "✓" : "(Low Gas)"}
              </span>
            </div>
          </div>

          {/* Main Breakdown: Donut Chart + Holdings Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Donut Chart Allocation */}
            <div className="lg:col-span-5 bento-card flex flex-col items-center">
              <span className="pill-badge pill-badge-lime mb-2">
                {activeBasket.name}
              </span>
              <DonutChart
                data={donutData}
                centerLabel={`$${totalValueUsd.toFixed(0)}`}
                centerSublabel="xStocks Value"
                height={260}
              />
              <p className="text-xs text-[#8F9CAE] text-center mt-4 leading-relaxed">
                Target vs. Current Weight based on live Jupiter v1 oracle pricing.
              </p>
            </div>

            {/* Right: Detailed Table with Multipliers and Drift */}
            <div className="lg:col-span-7 bento-card overflow-hidden p-0">
              <div className="p-4 border-b border-[#262D3D] flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white">Component Holdings</h3>
                  <p className="text-[10px] text-[#8F9CAE]">
                    Reflects wallet-wide on-chain Token-2022 balances
                  </p>
                </div>
                <span className="text-xs text-[#8F9CAE] font-mono">
                  {positions.length} Positions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0E14]/70 text-[#8F9CAE] uppercase font-semibold font-mono border-b border-[#262D3D]">
                    <tr>
                      <th className="py-3 px-4">Asset</th>
                      <th className="py-3 px-4">Shares</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Weight</th>
                      <th className="py-3 px-4 text-right">Drift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262D3D]/50 font-mono">
                    {positions.map((pos) => {
                      const isDriftPositive = pos.driftPct > 0;
                      return (
                        <tr key={pos.symbol} className="hover:bg-[#1D2332]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#0B0E14] border border-[#262D3D] flex items-center justify-center">
                                {pos.logo ? (
                                  <Image
                                    src={pos.logo}
                                    alt={pos.symbol}
                                    width={24}
                                    height={24}
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <span>{pos.symbol.slice(0, 2)}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white block">{pos.underlying}</span>
                                  {pos.market === "private" ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8D8AFF]/20 text-[#8D8AFF] border border-[#8D8AFF]/30">
                                      Pre-IPO
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#CDE06A]/20 text-[#CDE06A] border border-[#CDE06A]/30">
                                      xStock
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#8F9CAE] font-sans flex items-center gap-1.5">
                                  <span>${pos.usdPrice > 0 ? pos.usdPrice.toFixed(2) : "---"}</span>
                                  {pos.market === "private" && pos.markPrice !== undefined && (
                                    <span className="text-[#8F9CAE]">
                                      • Mark: ${pos.markPrice.toFixed(2)}
                                      {pos.premiumPct !== undefined && (
                                        <span className={pos.premiumPct >= 0 ? " text-emerald-400 font-semibold" : " text-rose-400 font-semibold"}>
                                          {" "}({pos.premiumPct >= 0 ? "+" : ""}{pos.premiumPct.toFixed(1)}%)
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-white font-bold block">
                              {pos.shareEquivalents > 0
                                ? pos.shareEquivalents.toFixed(4)
                                : "0.0000"}
                            </span>
                            <span className="text-[10px] text-[#8F9CAE]">
                              {pos.symbol}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-white">
                            ${pos.currentValueUsd.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-bold">
                                {pos.currentWeightPct.toFixed(1)}%
                              </span>
                              <span className="text-[#8F9CAE] text-[10px]">
                                (tgt {pos.targetWeightPct}%)
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                Math.abs(pos.driftPct) < 1
                                  ? "text-[#8F9CAE] bg-[#161B26]"
                                  : isDriftPositive
                                  ? "text-[#CDE06A] bg-[#CDE06A]/10"
                                  : "text-rose-400 bg-rose-500/10"
                              }`}
                            >
                              {isDriftPositive ? "+" : ""}
                              {pos.driftPct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SMART TOP-UP MODAL */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161B26] border border-[#262D3D] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#262D3D] pb-4">
              <div>
                <span className="pill-badge pill-badge-lime mb-1">Smart Rebalancing</span>
                <h3 className="text-lg font-extrabold text-white">
                  Smart Top-Up Rebalance
                </h3>
                <p className="text-xs text-[#8F9CAE]">
                  Routes 100% of new capital to underweight assets. Zero sell slippage.
                </p>
              </div>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#0B0E14] text-[#8F9CAE] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Deposit Input */}
            <div>
              <label className="text-xs font-semibold text-[#8F9CAE] uppercase block mb-1">
                Deposit Amount (USDC)
              </label>
              <div className="flex gap-2">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmountUsd(amt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                      topUpAmountUsd === amt
                        ? "bg-[#CDE06A] text-[#0B0E14]"
                        : "bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE]"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Allocation Preview */}
            <div className="space-y-2 p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D]">
              <span className="text-[11px] font-semibold text-[#8F9CAE] uppercase block">
                Calculated Rebalance Inflow:
              </span>
              {topUpPlan.map((plan) => {
                const asset = VERIFIED_STOCKS[plan.symbol];
                return (
                  <div
                    key={plan.symbol}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-bold text-white">
                      {asset?.underlying || plan.symbol}
                    </span>
                    <span className="text-[#CDE06A] font-bold">
                      +${plan.allocationUsd.toFixed(2)} USDC
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (topUpLegs.length === 0) return;
                  setIsTopUpOpen(false);
                  setIsExecutionModalOpen(true);
                }}
                disabled={topUpLegs.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>
                  {topUpLegs.length === 0
                    ? "Portfolio Already Balanced"
                    : `Execute Top-Up (${topUpLegs.length} legs • $${topUpAmountUsd} USDC)`}
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top-Up Execution Stepper Modal */}
      {isExecutionModalOpen && topUpLegs.length > 0 && (
        <ExecutionModal
          isOpen={isExecutionModalOpen}
          onClose={() => setIsExecutionModalOpen(false)}
          basketId={`${activeBasket.id}-topup`}
          basketName={`${activeBasket.name} (Top-Up)`}
          totalUsdAmount={topUpAmountUsd}
          legs={topUpLegs}
          solBalance={balances.solBalance}
          usdcBalance={balances.usdcBalance}
        />
      )}

      {/* Liquidation / Exit Modal */}
      {isLiquidationOpen && (
        <LiquidationModal
          isOpen={isLiquidationOpen}
          onClose={() => setIsLiquidationOpen(false)}
          positions={positions}
          solBalance={balances.solBalance}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
