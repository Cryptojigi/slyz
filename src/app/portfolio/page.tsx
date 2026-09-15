"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  PieChart as PieIcon,
  TrendingUp,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import {
  VERIFIED_STOCKS,
  CURATED_BASKETS,
  BasketComponent,
} from "@/lib/constants";
import { getJupiterPrices, TokenPriceInfo } from "@/lib/jupiter";
import { fetchUserBalances, UserBalances } from "@/lib/solana";
import {
  getStoredBaskets,
  StoredBasket,
  calculatePortfolioPositions,
  calculateSmartTopUp,
  PortfolioPosition,
} from "@/lib/portfolio";
import { DonutChart, DONUT_COLORS } from "@/components/DonutChart";
import { ExecutionModal } from "@/components/ExecutionModal";

export default function PortfolioPage() {
  const wallet = useWallet();

  const [storedBaskets, setStoredBaskets] = useState<StoredBasket[]>([]);
  const [selectedBasketIndex, setSelectedBasketIndex] = useState<number>(0);
  const [balances, setBalances] = useState<UserBalances>({
    solBalance: 0,
    usdcBalance: 0,
    token2022Balances: {},
    hasSufficientGas: false,
  });
  const [prices, setPrices] = useState<Record<string, TokenPriceInfo>>({});
  const [loading, setLoading] = useState(true);

  // Smart Top-Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmountUsd, setTopUpAmountUsd] = useState(50);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

  // Load stored baskets from localStorage
  useEffect(() => {
    const loaded = getStoredBaskets();
    setStoredBaskets(loaded);
  }, []);

  // Fetch on-chain balances and live prices
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const allMints = Object.values(VERIFIED_STOCKS).map((s) => s.mint);
        const priceMap = await getJupiterPrices(allMints);
        setPrices(priceMap);

        if (wallet.publicKey) {
          const userBal = await fetchUserBalances(wallet.publicKey);
          setBalances(userBal);
        }
      } catch (e) {
        console.error("Error loading portfolio data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 25000);
    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  // Determine active target components (either from stored basket, or default to Mag 3 demo)
  const activeBasket = storedBaskets[selectedBasketIndex] || {
    id: "mag-3",
    name: "The Mag 3",
    investedAt: Date.now(),
    components: CURATED_BASKETS[0].components,
    initialDepositUsd: 100,
    txSignatures: [],
  };

  // Calculate positions and drift
  const { positions, totalValueUsd, maxDriftPct } = calculatePortfolioPositions(
    activeBasket.components,
    balances.token2022Balances,
    prices
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

  // Build target components for Top-Up execution
  const topUpComponents: BasketComponent[] = topUpPlan.map((p) => ({
    symbol: p.symbol,
    targetWeight: Math.round((p.allocationUsd / topUpAmountUsd) * 100),
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="pill-badge pill-badge-lime mb-2">Non-Custodial</span>
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
            disabled={!wallet.connected}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Smart Top-Up</span>
          </button>
          <Link href="/" className="btn-secondary flex items-center gap-1.5 text-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Pie</span>
          </Link>
        </div>
      </div>

      {/* Disconnected Notice */}
      {!wallet.connected && (
        <div className="p-6 rounded-2xl bg-[#161B26] border border-[#262D3D] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1D2332] text-[#CDE06A] mx-auto flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Connect Your Solana Wallet</h3>
          <p className="text-xs text-[#8F9CAE] max-w-md mx-auto">
            Connect Phantom or Solflare to view your active tokenized equity balances, track
            portfolio drift, and execute rebalancing.
          </p>
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
            <span>Multipliers Applied (Token-2022)</span>
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
          <p className="text-xs text-[#8F9CAE] text-center mt-4">
            Target vs. Current Weight based on live Jupiter v1 oracle pricing.
          </p>
        </div>

        {/* Right: Detailed Table with Multipliers and Drift */}
        <div className="lg:col-span-7 bento-card overflow-hidden p-0">
          <div className="p-4 border-b border-[#262D3D] flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white">Component Holdings</h3>
            <span className="text-xs text-[#8F9CAE] font-mono">
              {positions.length} Positions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0E14]/70 text-[#8F9CAE] uppercase font-semibold font-mono border-b border-[#262D3D]">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Shares (Scaled)</th>
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
                            <span className="font-bold text-white block">{pos.underlying}</span>
                            <span className="text-[10px] text-[#8F9CAE] font-sans">
                              ${pos.usdPrice > 0 ? pos.usdPrice.toFixed(2) : "---"}
                            </span>
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
                          mult: {pos.multiplier.toFixed(4)}
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
                className="w-8 h-8 rounded-full bg-[#0B0E14] text-[#8F9CAE] hover:text-white flex items-center justify-center"
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
                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold ${
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
                  setIsTopUpOpen(false);
                  setIsExecutionModalOpen(true);
                }}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <span>Execute Top-Up (${topUpAmountUsd} USDC)</span>
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
      {isExecutionModalOpen && (
        <ExecutionModal
          isOpen={isExecutionModalOpen}
          onClose={() => setIsExecutionModalOpen(false)}
          basketId={`${activeBasket.id}-topup`}
          basketName={`${activeBasket.name} (Top-Up)`}
          totalUsdAmount={topUpAmountUsd}
          components={topUpComponents}
          solBalance={balances.solBalance}
          usdcBalance={balances.usdcBalance}
        />
      )}
    </div>
  );
}
