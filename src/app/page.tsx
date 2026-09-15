"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  Sliders,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Plus,
  Trash2,
  PieChart as PieIcon,
} from "lucide-react";
import { CURATED_BASKETS, VERIFIED_STOCKS, Basket, BasketComponent } from "@/lib/constants";
import { getJupiterPrices, TokenPriceInfo } from "@/lib/jupiter";
import { BasketCard } from "@/components/BasketCard";
import { DonutChart, DONUT_COLORS } from "@/components/DonutChart";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"curated" | "custom">("curated");
  const [prices, setPrices] = useState<Record<string, TokenPriceInfo>>({});
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Custom Slyz Builder State
  const [customName, setCustomName] = useState("My Tech Core");
  const [customComponents, setCustomComponents] = useState<BasketComponent[]>([
    { symbol: "NVDAx", targetWeight: 50 },
    { symbol: "AAPLx", targetWeight: 30 },
    { symbol: "TSLAx", targetWeight: 20 },
  ]);

  // Fetch prices for all verified tokens on load
  useEffect(() => {
    const fetchAllPrices = async () => {
      try {
        const allMints = Object.values(VERIFIED_STOCKS).map((s) => s.mint);
        const priceMap = await getJupiterPrices(allMints);
        setPrices(priceMap);
      } catch (e) {
        console.error("Error fetching market prices:", e);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchAllPrices();
    const interval = setInterval(fetchAllPrices, 20000); // 20s live refresh
    return () => clearInterval(interval);
  }, []);

  // Normalization helper for custom sliders
  const handleWeightChange = (index: number, newWeight: number) => {
    const updated = [...customComponents];
    updated[index].targetWeight = newWeight;
    setCustomComponents(updated);
  };

  const addCustomStock = (symbol: string) => {
    if (customComponents.length >= 4) return;
    if (customComponents.some((c) => c.symbol === symbol)) return;
    setCustomComponents([...customComponents, { symbol, targetWeight: 20 }]);
  };

  const removeCustomStock = (symbol: string) => {
    if (customComponents.length <= 2) return;
    setCustomComponents(customComponents.filter((c) => c.symbol !== symbol));
  };

  const totalCustomWeight = customComponents.reduce((acc, c) => acc + c.targetWeight, 0);

  // Data for custom donut preview
  const customDonutData = customComponents.map((c, idx) => ({
    name: VERIFIED_STOCKS[c.symbol]?.underlying || c.symbol,
    value: c.targetWeight,
    color: DONUT_COLORS[idx % DONUT_COLORS.length],
  }));

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#161B26] border border-[#262D3D] p-8 sm:p-12 lg:p-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CDE06A]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8D8AFF]/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D2332] border border-[#262D3D] text-xs font-semibold text-[#8F9CAE]">
            <Sparkles className="w-3.5 h-3.5 text-[#CDE06A]" />
            <span>M1 Finance & Robinhood Pies — On-Chain via xStocks</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
            Slice the Market.
            <br />
            <span className="text-[#CDE06A]">Own the Theme.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#8F9CAE] leading-relaxed max-w-2xl font-normal">
            Invest in curated baskets of tokenized US equities on Solana with a single click.
            Non-custodial, fractional shares powered by Jupiter and xStocks Token-2022.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab("curated")}
              className={`btn-primary flex items-center gap-2 ${
                activeTab === "curated" ? "ring-2 ring-[#CDE06A]/40" : ""
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Explore Thematic Pies</span>
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`btn-secondary flex items-center gap-2 ${
                activeTab === "custom" ? "border-[#8D8AFF] text-white" : ""
              }`}
            >
              <Sliders className="w-4 h-4 text-[#8D8AFF]" />
              <span>Build Custom Slyz</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 mt-12 pt-8 border-t border-[#262D3D]/60 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <span className="text-xs text-[#8F9CAE] font-medium block">Trade Speed</span>
            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
              ~3.2s Swaps
            </span>
          </div>
          <div>
            <span className="text-xs text-[#8F9CAE] font-medium block">Market Access</span>
            <span className="text-base font-extrabold text-[#CDE06A] font-mono mt-0.5 block">
              24/7 On-Chain
            </span>
          </div>
          <div>
            <span className="text-xs text-[#8F9CAE] font-medium block">Execution Mode</span>
            <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
              Sequential MTU-Safe
            </span>
          </div>
          <div>
            <span className="text-xs text-[#8F9CAE] font-medium block">Smart Rebalance</span>
            <span className="text-base font-extrabold text-[#8D8AFF] font-mono mt-0.5 block">
              Zero Sell Slippage
            </span>
          </div>
        </div>
      </section>

      {/* Tabs Selector */}
      <div className="flex items-center justify-between border-b border-[#262D3D] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("curated")}
            className={`pb-2 text-sm font-bold transition-all relative ${
              activeTab === "curated"
                ? "text-white"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <span>Curated Theme Pies ({CURATED_BASKETS.length})</span>
            {activeTab === "curated" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CDE06A]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`pb-2 text-sm font-bold transition-all relative ${
              activeTab === "custom"
                ? "text-white"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <span>Custom Slyz Studio</span>
            {activeTab === "custom" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8D8AFF]"></span>
            )}
          </button>
        </div>

        <span className="text-xs text-[#8F9CAE] hidden sm:flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-[#CDE06A] animate-pulse"></span>
          Live Jupiter v1 Feeds
        </span>
      </div>

      {/* TAB 1: CURATED BASKETS */}
      {activeTab === "curated" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CURATED_BASKETS.map((basket) => (
            <BasketCard key={basket.id} basket={basket} prices={prices} />
          ))}

          {/* Quick Custom Builder Callout Card */}
          <div
            onClick={() => setActiveTab("custom")}
            className="bento-card border-dashed border-[#262D3D] hover:border-[#8D8AFF] flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-all hover:scale-[1.01] group min-h-[320px]"
          >
            <div className="w-12 h-12 rounded-full bg-[#1D2332] border border-[#262D3D] flex items-center justify-center text-[#8D8AFF] group-hover:scale-110 transition-transform mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-extrabold text-white">Create a Custom Pie</h4>
            <p className="text-xs text-[#8F9CAE] max-w-xs mt-1.5 leading-relaxed">
              Mix and match any 2 to 4 tokenized equities with your own customized percentages.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8D8AFF] mt-4">
              <span>Open Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM SLYZ STUDIO */}
      {activeTab === "custom" && (
        <div className="bento-card space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#262D3D]">
            <div>
              <span className="pill-badge pill-badge-periwinkle mb-2">Custom Studio</span>
              <h3 className="text-2xl font-extrabold text-white">
                Assemble Your Personal Basket
              </h3>
              <p className="text-xs text-[#8F9CAE] mt-1">
                Select between 2 and 4 stocks and adjust your allocation targets. Total must equal 100%.
              </p>
            </div>

            {/* Custom Basket Name Input */}
            <div className="w-full sm:w-64">
              <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block mb-1">
                Basket Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-sm text-white font-bold focus:outline-none focus:border-[#8D8AFF]"
                placeholder="e.g. My AI & Chip Fund"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Donut Chart Preview */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#0B0E14]/40 rounded-2xl border border-[#262D3D]">
              <DonutChart
                data={customDonutData}
                centerLabel={`${totalCustomWeight}%`}
                centerSublabel={totalCustomWeight === 100 ? "Balanced" : "Adjustment Needed"}
                height={260}
              />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {customComponents.map((c, i) => (
                  <span
                    key={c.symbol}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8F9CAE]"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    ></span>
                    <strong className="text-white">
                      {VERIFIED_STOCKS[c.symbol]?.underlying || c.symbol}:
                    </strong>
                    {c.targetWeight}%
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Sliders and Asset Management */}
            <div className="lg:col-span-7 space-y-6">
              {/* Sliders for each component */}
              <div className="space-y-4">
                {customComponents.map((comp, idx) => {
                  const asset = VERIFIED_STOCKS[comp.symbol];
                  return (
                    <div
                      key={comp.symbol}
                      className="p-4 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">
                            {asset?.underlying || comp.symbol}
                          </span>
                          <span className="text-xs text-[#8F9CAE]">{asset?.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-sm text-[#8D8AFF]">
                            {comp.targetWeight}%
                          </span>
                          {customComponents.length > 2 && (
                            <button
                              onClick={() => removeCustomStock(comp.symbol)}
                              className="text-[#8F9CAE] hover:text-rose-400 p-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        type="range"
                        min="5"
                        max="80"
                        step="5"
                        value={comp.targetWeight}
                        onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
                        className="w-full h-1.5 bg-[#161B26] rounded-lg appearance-none cursor-pointer accent-[#8D8AFF]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add Asset Picker (if < 4 stocks) */}
              {customComponents.length < 4 && (
                <div>
                  <span className="text-xs text-[#8F9CAE] font-medium block mb-2">
                    Add another stock to your custom basket (max 4):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(VERIFIED_STOCKS)
                      .filter((s) => !customComponents.some((c) => c.symbol === s.symbol))
                      .map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => addCustomStock(stock.symbol)}
                          className="px-3 py-1.5 rounded-lg bg-[#161B26] border border-[#262D3D] hover:border-[#8D8AFF] text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3 h-3 text-[#8D8AFF]" />
                          <span>{stock.underlying}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Total Allocation Validation & Proceed Button */}
              <div className="pt-4 border-t border-[#262D3D] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#8F9CAE] block">Total Allocation:</span>
                  <span
                    className={`font-mono text-lg font-extrabold ${
                      totalCustomWeight === 100 ? "text-[#CDE06A]" : "text-rose-400"
                    }`}
                  >
                    {totalCustomWeight}% / 100%
                  </span>
                </div>

                <Link
                  href={`/invest/custom?name=${encodeURIComponent(customName)}&components=${encodeURIComponent(
                    JSON.stringify(customComponents)
                  )}`}
                  className={`btn-primary flex items-center gap-2 ${
                    totalCustomWeight !== 100 ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <span>Invest in {customName}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
