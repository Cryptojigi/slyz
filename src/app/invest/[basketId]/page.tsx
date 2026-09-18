"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  CURATED_BASKETS,
  VERIFIED_STOCKS,
  Basket,
  BasketComponent,
  MIN_SOL_BALANCE,
  isPreStock,
} from "@/lib/constants";
import { getJupiterPrices, TokenPriceInfo } from "@/lib/jupiter";
import { fetchUserBalances, UserBalances } from "@/lib/solana";
import {
  fetchPreStocksLive,
  PreStockAssetLive,
  PRESTOCKS_FALLBACK,
} from "@/lib/prestocks";
import { DonutChart, DONUT_COLORS } from "@/components/DonutChart";
import { ExecutionModal } from "@/components/ExecutionModal";

export default function InvestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const wallet = useWallet();

  const basketId = params.basketId as string;

  // Resolve whether this is a curated basket or custom basket
  const basket: Basket | null = useMemo(() => {
    if (basketId === "custom") {
      const customName = searchParams.get("name") || "Custom Slyz";
      const customCompsRaw = searchParams.get("components");
      let components: BasketComponent[] = [
        { symbol: "NVDAx", targetWeight: 50 },
        { symbol: "AAPLx", targetWeight: 30 },
        { symbol: "TSLAx", targetWeight: 20 },
      ];
      if (customCompsRaw) {
        try {
          components = JSON.parse(customCompsRaw);
        } catch (_) {}
      }
      return {
        id: "custom",
        name: customName,
        tagline: "Personalized Portfolio Pie",
        description: "Custom allocation configured in Slyz Studio.",
        category: "Custom",
        themeColor: "#8D8AFF",
        market: "public",
        components,
      };
    }
    return CURATED_BASKETS.find((b) => b.id === basketId) || null;
  }, [basketId, searchParams]);

  const isPrivateMarket = basket?.market === "private";

  // State
  const [components, setComponents] = useState<BasketComponent[]>(
    basket?.components || []
  );
  const [amountUsd, setAmountUsd] = useState<number>(isPrivateMarket ? 5 : 50);
  const [prices, setPrices] = useState<Record<string, TokenPriceInfo>>({});
  const [preStocksLive, setPreStocksLive] = useState<Record<string, PreStockAssetLive>>(PRESTOCKS_FALLBACK);
  const [balances, setBalances] = useState<UserBalances>({
    solBalance: 0,
    usdcBalance: 0,
    token2022Balances: {},
    token2022RawAmounts: {},
    hasSufficientGas: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync components and default amount if basket changes
  useEffect(() => {
    if (basket) {
      setComponents(basket.components);
      setAmountUsd(basket.market === "private" ? 5 : 50);
    }
  }, [basket]);

  // Fetch prices for both public xStocks and private PreStocks
  useEffect(() => {
    if (!basket) return;
    let isMounted = true;

    // 1. Fetch public xStocks prices from Jupiter
    const publicMints = basket.components
      .filter((c) => !isPreStock(c.symbol))
      .map((c) => VERIFIED_STOCKS[c.symbol]?.mint)
      .filter(Boolean) as string[];

    if (publicMints.length > 0) {
      getJupiterPrices(publicMints).then((p) => {
        if (isMounted) setPrices(p);
      });
    }

    // 2. Fetch live PreStocks prices if basket contains private assets
    const hasPrivateAssets = basket.components.some((c) => isPreStock(c.symbol));
    if (hasPrivateAssets) {
      fetchPreStocksLive().then((pMap) => {
        if (isMounted && pMap) setPreStocksLive(pMap);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [basket]);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      fetchUserBalances(wallet.publicKey).then(setBalances);
    }
  }, [wallet.publicKey]);

  if (!basket) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-2xl font-bold text-white">Basket Not Found</h2>
        <Link href="/" className="btn-primary">
          Back to Theme Pies
        </Link>
      </div>
    );
  }

  // Auto-renormalizing sliders to ensure components always sum to 100%
  const handleSliderChange = (idx: number, rawVal: number) => {
    const clampedVal = Math.max(5, Math.min(90, rawVal));
    const targetOthers = 100 - clampedVal;
    const otherIndices = components.map((_, i) => i).filter((i) => i !== idx);
    const sumOtherCurrent = otherIndices.reduce((sum, i) => sum + components[i].targetWeight, 0);

    const updated = [...components];
    updated[idx] = { ...updated[idx], targetWeight: clampedVal };

    if (sumOtherCurrent > 0) {
      let allocatedOther = 0;
      otherIndices.forEach((otherIdx, pos) => {
        if (pos === otherIndices.length - 1) {
          updated[otherIdx] = {
            ...updated[otherIdx],
            targetWeight: Math.max(5, targetOthers - allocatedOther),
          };
        } else {
          const prop = components[otherIdx].targetWeight / sumOtherCurrent;
          const assigned = Math.max(5, Math.round(prop * targetOthers));
          allocatedOther += assigned;
          updated[otherIdx] = { ...updated[otherIdx], targetWeight: assigned };
        }
      });
    } else {
      const split = Math.floor(targetOthers / otherIndices.length);
      otherIndices.forEach((otherIdx, pos) => {
        updated[otherIdx] = {
          ...updated[otherIdx],
          targetWeight:
            pos === otherIndices.length - 1
              ? targetOthers - split * (otherIndices.length - 1)
              : split,
        };
      });
    }

    setComponents(updated);
  };

  const equalizeWeights = () => {
    if (!components.length) return;
    const count = components.length;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    setComponents(
      components.map((c, i) => ({
        ...c,
        targetWeight: i === 0 ? base + remainder : base,
      }))
    );
  };

  const totalWeight = components.reduce((acc, c) => acc + c.targetWeight, 0);

  // Donut chart slices
  const donutData = components.map((c, i) => {
    const dollarSlice = (c.targetWeight / 100) * amountUsd;
    return {
      name: VERIFIED_STOCKS[c.symbol]?.underlying || c.symbol,
      value: c.targetWeight,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      usdAmount: dollarSlice,
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F9CAE] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill-badge pill-badge-lime">{basket.category}</span>
              <span className="text-xs text-[#8F9CAE] font-mono">
                {components.length} Asset Pie
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              {basket.name}
            </h1>
            <p className="text-xs text-[#8F9CAE] mt-0.5">{basket.description}</p>
          </div>

          {/* Quick Wallet Balance Pill */}
          {wallet.connected && (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#161B26] border border-[#262D3D] text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#8F9CAE] uppercase block">USDC Available</span>
                <span className="font-extrabold text-white">
                  ${balances.usdcBalance.toFixed(2)}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#262D3D]"></div>
              <div>
                <span className="text-[10px] text-[#8F9CAE] uppercase block">SOL Gas</span>
                <span
                  className={`font-bold ${
                    balances.hasSufficientGas ? "text-[#CDE06A]" : "text-amber-400"
                  }`}
                >
                  {balances.solBalance.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Donut + Investment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Donut & Visual Allocation */}
        <div className="lg:col-span-5 bento-card flex flex-col items-center">
          <span className="pill-badge bg-[#0B0E14] text-[#8F9CAE] border border-[#262D3D] mb-2">
            Target Allocation
          </span>
          <DonutChart
            data={donutData}
            centerLabel={`$${amountUsd}`}
            centerSublabel="Total Investment"
            height={280}
          />

          {/* Detailed Component Breakdown */}
          <div className="w-full mt-6 space-y-2 border-t border-[#262D3D]/60 pt-4">
            {components.map((c, i) => {
              const asset = VERIFIED_STOCKS[c.symbol];
              const isPrivate = isPreStock(c.symbol);
              const preData = isPrivate
                ? preStocksLive[c.symbol] || PRESTOCKS_FALLBACK[c.symbol]
                : null;
              const livePrice = isPrivate
                ? preData?.tokenPrice || 0
                : prices[asset?.mint || ""]?.usdPrice || 0;

              const dollarSlice = (c.targetWeight / 100) * amountUsd;
              const estimatedUnits = livePrice > 0 ? dollarSlice / livePrice : 0;

              return (
                <div
                  key={c.symbol}
                  className="p-2.5 rounded-xl bg-[#0B0E14]/40 border border-[#262D3D]/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      ></span>
                      <span className="font-bold text-white">
                        {asset?.underlying || c.symbol}
                      </span>
                      {isPrivate ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#8D8AFF]/20 text-[#8D8AFF] border border-[#8D8AFF]/30">
                          Pre-IPO (9 dec)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#CDE06A]/20 text-[#CDE06A] border border-[#CDE06A]/30">
                          xStock (8 dec)
                        </span>
                      )}
                    </div>

                    <span className="font-mono font-bold text-white">
                      ${dollarSlice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8F9CAE]">
                    <div className="flex items-center gap-2">
                      <span>Token: ${livePrice > 0 ? livePrice.toFixed(2) : "---"}</span>
                      {isPrivate && preData && (
                        <span>
                          • Mark: ${preData.markPrice.toFixed(2)}
                          <span
                            className={
                              preData.premiumPct >= 0
                                ? " text-emerald-400 font-bold ml-1"
                                : " text-rose-400 font-bold ml-1"
                            }
                          >
                            ({preData.premiumPct >= 0 ? "+" : ""}
                            {preData.premiumPct.toFixed(1)}%)
                          </span>
                        </span>
                      )}
                    </div>

                    <span className="text-[#8F9CAE]">
                      ~{estimatedUnits.toFixed(4)} {isPrivate ? "tokens" : "shares"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Amount Configuration & Sliders */}
        <div className="lg:col-span-7 space-y-6">
          {/* Amount Input Box */}
          <div className="bento-card space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase text-[#8F9CAE] tracking-wider">
                Investment Amount (USDC)
              </label>
              <span className="text-xs text-[#8F9CAE]">
                Min: $5 USDC • Powered by Jupiter
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-[#CDE06A]" />
              </div>
              <input
                type="number"
                min={5}
                step="1"
                value={amountUsd}
                onChange={(e) => setAmountUsd(Math.max(1, Number(e.target.value)))}
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#0B0E14] border border-[#262D3D] text-2xl font-extrabold font-mono text-white focus:outline-none focus:border-[#CDE06A] transition-colors"
                placeholder={isPrivateMarket ? "5.00" : "50.00"}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {(isPrivateMarket ? [5, 10, 25, 50, 100] : [25, 50, 100, 250, 500]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountUsd(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    amountUsd === preset
                      ? "bg-[#CDE06A] text-[#0B0E14]"
                      : "bg-[#161B26] border border-[#262D3D] text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  ${preset}
                </button>
              ))}
              {balances.usdcBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountUsd(Math.floor(balances.usdcBalance))}
                  className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-[#161B26] border border-[#8D8AFF] text-[#8D8AFF] hover:bg-[#8D8AFF] hover:text-[#0B0E14] transition-all"
                >
                  Max (${Math.floor(balances.usdcBalance)})
                </button>
              )}
            </div>
          </div>

          {/* Allocation Sliders */}
          <div className="bento-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase text-[#8F9CAE] tracking-wider">
                  Fine-Tune Weights
                </span>
                <button
                  type="button"
                  onClick={equalizeWeights}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#161B26] border border-[#262D3D] text-[#8D8AFF] hover:text-white transition-colors"
                >
                  Equalize
                </button>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  totalWeight === 100 ? "text-[#CDE06A]" : "text-rose-400"
                }`}
              >
                {totalWeight}% / 100%
              </span>
            </div>

            <div className="space-y-4">
              {components.map((comp, idx) => {
                const asset = VERIFIED_STOCKS[comp.symbol];
                return (
                  <div key={comp.symbol} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {asset?.underlying || comp.symbol} ({asset?.name})
                      </span>
                      <div className="flex items-center gap-1 bg-[#161B26] border border-[#262D3D] px-2 py-0.5 rounded-lg">
                        <input
                          type="number"
                          min={5}
                          max={90}
                          value={comp.targetWeight}
                          onChange={(e) => handleSliderChange(idx, Number(e.target.value) || 5)}
                          className="w-8 bg-transparent text-right font-mono font-bold text-xs text-white focus:outline-none"
                        />
                        <span className="text-[10px] text-[#8F9CAE] font-bold">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={90}
                      step="5"
                      value={comp.targetWeight}
                      onChange={(e) => handleSliderChange(idx, Number(e.target.value))}
                      className="w-full h-1.5 bg-[#0B0E14] rounded-lg appearance-none cursor-pointer accent-[#CDE06A]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fee & Protocol Summary */}
          <div className="p-4 rounded-xl bg-[#161B26] border border-[#262D3D] text-xs space-y-2 text-[#8F9CAE]">
            <div className="flex items-center justify-between font-mono">
              <span>Jupiter Route Slippage:</span>
              <span className="text-white">1.0% max slippage</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>Estimated Solana Network Gas:</span>
              <span className="text-white">~0.003 SOL ($0.45)</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>Asset Standard:</span>
              <span className="text-[#CDE06A]">
                {isPrivateMarket ? "Token-2022 • 9 Decimals (PreStocks)" : "Token-2022 • 8 Decimals (xStocks)"}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>Liquidity Safeguard:</span>
              <span className="text-[#8D8AFF]">
                {isPrivateMarket ? "< 5% Impact Protection on AMM" : "Multi-DEX Deep Routing"}
              </span>
            </div>
          </div>

          {/* PreStocks Regulatory & Jurisdiction Disclaimer Box */}
          {isPrivateMarket && (
            <div className="p-4 rounded-xl bg-[#8D8AFF]/10 border border-[#8D8AFF]/30 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Info className="w-4 h-4 text-[#8D8AFF]" />
                <span>Pre-IPO Tokenized Economic Exposure</span>
              </div>
              <p className="text-[#8F9CAE] leading-relaxed text-[11px]">
                PreStocks provide economic exposure only. Not equity, voting rights, or corporate dividends.
                Issuer terms restrict some jurisdictions (including US persons). Always verify contract addresses
                on Solana Explorer before transacting.
              </p>
            </div>
          )}

          {/* Action CTA Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!wallet.connected || totalWeight !== 100 || amountUsd < 5}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 shadow-lg"
          >
            {!wallet.connected ? (
              <span>Connect Wallet to Invest</span>
            ) : totalWeight !== 100 ? (
              <span>Adjust Weights to Equal 100%</span>
            ) : (
              <>
                <span>Slyz In: Invest ${amountUsd} in {basket.name}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Execution Stepper Modal */}
      <ExecutionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        basketId={basket.id}
        basketName={basket.name}
        totalUsdAmount={amountUsd}
        legs={components.map((c) => ({
          symbol: c.symbol,
          amountUsd: (c.targetWeight / 100) * amountUsd,
        }))}
        solBalance={balances.solBalance}
        usdcBalance={balances.usdcBalance}
      />
    </div>
  );
}
