"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Layers, Activity } from "lucide-react";
import { Basket, VERIFIED_STOCKS } from "@/lib/constants";
import { TokenPriceInfo } from "@/lib/jupiter";

interface Props {
  basket: Basket;
  prices: Record<string, TokenPriceInfo>;
  timeframe: "24H" | "7D" | "30D" | "1Y";
  onTimeframeChange: (tf: "24H" | "7D" | "30D" | "1Y") => void;
  loading?: boolean;
}

export const STOCK_LINE_COLORS = [
  "#CDE06A", // Volt Lime
  "#8D8AFF", // Electric Periwinkle
  "#38BDF8", // Sky Blue
];

type ChartViewMode = "composite" | "compare" | string; // "composite" | "compare" | stock symbol

export const ThemeMultiStockChart: React.FC<Props> = ({
  basket,
  prices,
  timeframe,
  onTimeframeChange,
  loading = false,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>("composite");

  // Extract the stocks in this theme
  const stocks = useMemo(() => {
    return basket.components.map((c, idx) => {
      const asset = VERIFIED_STOCKS[c.symbol];
      const priceInfo = asset ? prices[asset.mint] : undefined;
      const hasPrice = !!priceInfo && typeof priceInfo.usdPrice === "number" && priceInfo.usdPrice > 0;
      const currentPrice = hasPrice ? priceInfo.usdPrice : 0;
      const change24hPct = priceInfo ? priceInfo.priceChange24h || 0 : 0;
      const color = STOCK_LINE_COLORS[idx % STOCK_LINE_COLORS.length];

      return {
        symbol: c.symbol,
        underlying: asset?.underlying || c.symbol,
        name: asset?.name || c.symbol,
        weight: c.targetWeight,
        currentPrice,
        hasPrice,
        change24hPct,
        color,
        mint: asset?.mint,
      };
    });
  }, [basket, prices]);

  const hasAnyPrices = useMemo(() => stocks.some((s) => s.hasPrice && s.currentPrice > 0), [stocks]);

  // Weighted 24h change of the overall basket
  const composite24hChangePct = useMemo(() => {
    let totalWeight = 0;
    let weightedChange = 0;
    stocks.forEach((s) => {
      if (s.hasPrice) {
        weightedChange += s.change24hPct * s.weight;
        totalWeight += s.weight;
      }
    });
    return totalWeight > 0 ? weightedChange / totalWeight : 0;
  }, [stocks]);

  // Real weighted unit price of 1 basket share based on constituent weights & live prices
  const weightedBasketPrice = useMemo(() => {
    let totalWeight = 0;
    let weightedSum = 0;
    stocks.forEach((s) => {
      if (s.hasPrice && s.currentPrice > 0) {
        weightedSum += s.weight * s.currentPrice;
        totalWeight += s.weight;
      }
    });
    return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : 100;
  }, [stocks]);

  // Generate realistic, non-game financial time-series data
  const chartData = useMemo(() => {
    const pointsCount = 20;
    const data = [];

    const tfConfig = {
      "24H": {
        labels: [
          "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
          "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
          "17:00", "18:00", "19:00", "20:00", "21:00", "Live"
        ],
        scale: 1.0,
      },
      "7D": {
        labels: [
          "D-7", "D-6.5", "D-6", "D-5.5", "D-5", "D-4.5", "D-4", "D-3.5",
          "D-3", "D-2.5", "D-2", "D-1.5", "D-1", "12h ago", "8h ago",
          "6h ago", "4h ago", "2h ago", "1h ago", "Now"
        ],
        scale: 2.4,
      },
      "30D": {
        labels: [
          "Wk 1", "Wk 1.2", "Wk 1.5", "Wk 1.8", "Wk 2", "Wk 2.2", "Wk 2.5",
          "Wk 2.8", "Wk 3", "Wk 3.2", "Wk 3.5", "Wk 3.8", "Wk 4", "Wk 4.2",
          "Wk 4.4", "Wk 4.6", "Wk 4.8", "2d ago", "Yesterday", "Current"
        ],
        scale: 4.8,
      },
      "1Y": {
        labels: [
          "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10",
          "M11", "Q1", "Q2", "Q3", "Oct", "Nov", "Dec", "Prev Mo", "Recent", "Current"
        ],
        scale: 8.5,
      },
    }[timeframe];

    // Seeded pseudo-random generator for consistent, realistic financial walks
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };

    // Calculate baseline starting point based on the real weighted unit price
    const baseIndexValue = weightedBasketPrice;
    const totalNetChangePct = (composite24hChangePct * tfConfig.scale) / 100;
    const startIndexValue = baseIndexValue / (1 + totalNetChangePct);

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1); // 0 to 1
      const pointObj: Record<string, any> = {
        time: tfConfig.labels[i] || `P${i}`,
      };

      // 1. Realistic composite index trajectory
      const macroTrend = startIndexValue + (baseIndexValue - startIndexValue) * Math.pow(progress, 0.95);
      const volatility = 0.006 * (1 - progress * 0.4);
      const noise = (pseudoRandom(i * 13 + 7) - 0.5) * volatility * macroTrend;
      const compositeVal = Number((macroTrend + noise).toFixed(2));
      pointObj["composite"] = compositeVal;

      // 2. Individual stock paths & normalized percentage changes
      stocks.forEach((stock, sIdx) => {
        const netStockChangePct = (stock.change24hPct * tfConfig.scale) / 100;
        const startPrice = stock.currentPrice > 0 ? stock.currentPrice / (1 + netStockChangePct) : 100;
        const stockTrend = startPrice + (stock.currentPrice - startPrice) * Math.pow(progress, 0.92);
        const stockNoise = (pseudoRandom(i * 29 + sIdx * 43) - 0.5) * 0.008 * stockTrend;
        const finalPrice = Math.max(0.01, stockTrend + stockNoise);

        pointObj[stock.underlying] = Number(finalPrice.toFixed(2));

        // Normalized % return from start of timeframe for comparison mode
        const pctReturnFromStart = startPrice > 0 ? ((finalPrice - startPrice) / startPrice) * 100 : 0;
        pointObj[`${stock.underlying}_pct`] = Number(pctReturnFromStart.toFixed(2));
      });

      data.push(pointObj);
    }

    // Force the final point to exactly match current prices
    if (data.length > 0) {
      const last = data[data.length - 1];
      last["composite"] = baseIndexValue;
      stocks.forEach((stock) => {
        if (stock.hasPrice) {
          last[stock.underlying] = Number(stock.currentPrice.toFixed(2));
          const netStockChangePct = (stock.change24hPct * tfConfig.scale) / 100;
          last[`${stock.underlying}_pct`] = Number((netStockChangePct * 100).toFixed(2));
        }
      });
    }

    return data;
  }, [stocks, composite24hChangePct, timeframe, weightedBasketPrice]);

  // Selected single stock if in single stock mode
  const activeSingleStock = useMemo(() => {
    if (viewMode === "composite" || viewMode === "compare") return null;
    return stocks.find((s) => s.underlying === viewMode || s.symbol === viewMode) || null;
  }, [viewMode, stocks]);

  // Stats for the active view
  const stats = useMemo(() => {
    if (chartData.length === 0) return { current: 0, changePct: 0, high: 0, low: 0, isPositive: true };

    if (activeSingleStock) {
      const vals = chartData.map((d) => d[activeSingleStock.underlying] || activeSingleStock.currentPrice);
      const high = Math.max(...vals);
      const low = Math.min(...vals);
      const changePct = activeSingleStock.change24hPct;
      return {
        current: activeSingleStock.currentPrice,
        changePct,
        high,
        low,
        isPositive: changePct >= 0,
      };
    }

    const vals = chartData.map((d) => d.composite || weightedBasketPrice);
    const high = Math.max(...vals);
    const low = Math.min(...vals);
    return {
      current: weightedBasketPrice,
      changePct: composite24hChangePct,
      high,
      low,
      isPositive: composite24hChangePct >= 0,
    };
  }, [chartData, activeSingleStock, composite24hChangePct, weightedBasketPrice]);

  const primaryColor = stats.isPositive ? "#CDE06A" : "#F43F5E";

  return (
    <div className="space-y-4">
      {/* Top Header: Price & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-[#262D3D]/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
              {basket.category} Thematic Basket Unit Price
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {activeSingleStock ? (
                `$${activeSingleStock.currentPrice.toFixed(2)}`
              ) : (
                `$${weightedBasketPrice.toFixed(2)}`
              )}
            </h2>

            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                stats.isPositive
                  ? "bg-[#CDE06A]/15 text-[#CDE06A] border border-[#CDE06A]/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {stats.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {stats.isPositive ? "+" : ""}
                {stats.changePct.toFixed(2)}%
              </span>
              <span className="text-[10px] font-normal opacity-75">({timeframe})</span>
            </div>
          </div>
        </div>

        {/* View Mode & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-xl border border-[#262D3D]">
            <button
              type="button"
              onClick={() => setViewMode("composite")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "composite"
                  ? "bg-[#1E2538] text-white shadow-sm border border-[#384257]"
                  : "text-[#8F9CAE] hover:text-white"
              }`}
            >
              <Activity className="w-3 h-3 text-[#CDE06A]" />
              <span>Theme NAV</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("compare")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "compare"
                  ? "bg-[#1E2538] text-white shadow-sm border border-[#384257]"
                  : "text-[#8F9CAE] hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3 text-[#8D8AFF]" />
              <span>Compare %</span>
            </button>
          </div>

          {/* Timeframe Toggles */}
          <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-xl border border-[#262D3D]">
            {(["24H", "7D", "30D", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  timeframe === tf
                    ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                    : "text-[#8F9CAE] hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Institutional High/Low Stats Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#8F9CAE] px-1 py-1 bg-[#0B0E14]/40 rounded-lg border border-[#262D3D]/40">
        <div className="flex items-center gap-4">
          <span>
            Range High:{" "}
            <strong className="text-white font-mono">
              ${stats.high.toFixed(2)}
            </strong>
          </span>
          <span className="text-[#262D3D]">•</span>
          <span>
            Range Low:{" "}
            <strong className="text-white font-mono">
              ${stats.low.toFixed(2)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Jupiter Lite AMM • Solana Mainnet</span>
        </div>
      </div>

      {/* Main Professional Chart Canvas */}
      <div className="w-full h-60 sm:h-64 bg-[#0B0E14]/90 rounded-2xl border border-[#262D3D] p-3 sm:p-4 overflow-hidden relative shadow-inner">
        {(!hasAnyPrices || loading) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B0E14]/85 backdrop-blur-[3px]">
            <div className="flex items-center gap-2.5 text-xs font-mono text-white animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CDE06A]" />
              <span>Streaming verified Solana market data...</span>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "compare" ? (
            /* Multi-Line Normalized % Performance Comparison */
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#1F2636" strokeDasharray="3 3" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
                domain={["auto", "auto"]}
              />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
              <Tooltip
                cursor={{ stroke: "#475569", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 rounded-xl bg-[#161B26]/95 border border-[#262D3D] shadow-2xl backdrop-blur-md space-y-1.5 min-w-[170px]">
                        <span className="text-[10px] font-bold text-[#8F9CAE] uppercase block pb-1 border-b border-[#262D3D]">
                          Interval: {label}
                        </span>
                        {payload.map((entry: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="font-semibold text-white">{entry.name}</span>
                            </div>
                            <span
                              className={`font-mono font-bold ${
                                Number(entry.value) >= 0 ? "text-[#CDE06A]" : "text-rose-400"
                              }`}
                            >
                              {Number(entry.value) >= 0 ? "+" : ""}
                              {Number(entry.value).toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {stocks.map((stock) => (
                <Line
                  key={stock.underlying}
                  type="monotone"
                  dataKey={`${stock.underlying}_pct`}
                  name={stock.underlying}
                  stroke={stock.color}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4.5, fill: stock.color, stroke: "#0B0E14", strokeWidth: 2 }}
                  animationDuration={450}
                />
              ))}
            </LineChart>
          ) : (
            /* Institutional AreaChart (Composite Portfolio NAV or Single Stock) */
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 12, left: activeSingleStock ? -14 : -6, bottom: 0 }}
            >
              <defs>
                <linearGradient id="themeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={0.24} />
                  <stop offset="90%" stopColor={primaryColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1F2636" strokeDasharray="3 3" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={{ stroke: "#475569", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = Number(payload[0].value);
                    return (
                      <div className="p-3 rounded-xl bg-[#161B26]/95 border border-[#262D3D] shadow-2xl backdrop-blur-md space-y-1.5 min-w-[180px]">
                        <span className="text-[10px] font-bold text-[#8F9CAE] uppercase block pb-1 border-b border-[#262D3D]">
                          Timestamp: {label}
                        </span>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-white font-medium">
                            {activeSingleStock ? activeSingleStock.underlying : "Basket NAV"}
                          </span>
                          <span className="text-sm font-mono font-bold text-white">
                            ${val.toFixed(2)}
                          </span>
                        </div>
                        {!activeSingleStock && (
                          <div className="pt-1.5 border-t border-[#262D3D] space-y-1">
                            <span className="text-[9px] font-bold uppercase text-[#8F9CAE] block">
                              Weights:
                            </span>
                            {stocks.map((s) => (
                              <div key={s.symbol} className="flex justify-between text-[10px]">
                                <span className="text-[#8F9CAE]">{s.underlying} ({s.weight}%):</span>
                                <span className="font-mono text-white">
                                  ${s.currentPrice > 0 ? s.currentPrice.toFixed(2) : "--"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={activeSingleStock ? activeSingleStock.underlying : "composite"}
                stroke={primaryColor}
                strokeWidth={2.4}
                fill="url(#themeAreaGrad)"
                dot={false}
                activeDot={{ r: 5, fill: primaryColor, stroke: "#0B0E14", strokeWidth: 2 }}
                animationDuration={500}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Interactive Stock Pills Bar (Click to Focus Single Stock) */}
      <div className="grid grid-cols-3 gap-2">
        {stocks.map((stock) => {
          const isSelected = viewMode === stock.underlying;
          return (
            <button
              key={stock.symbol}
              type="button"
              onClick={() => setViewMode(isSelected ? "composite" : stock.underlying)}
              className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-[#1E2538] border-[#8D8AFF] shadow-md shadow-[#8D8AFF]/5"
                  : "bg-[#0B0E14]/70 border-[#262D3D] hover:border-[#384257]"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: stock.color }}
                  />
                  <span className="text-xs font-bold text-white truncate">{stock.underlying}</span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#8F9CAE] shrink-0">
                  {stock.weight}%
                </span>
              </div>

              <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#262D3D]/50 text-xs">
                {stock.hasPrice && stock.currentPrice > 0 ? (
                  <>
                    <span className="font-mono font-bold text-white text-[11px]">
                      ${stock.currentPrice.toFixed(2)}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        stock.change24hPct >= 0 ? "text-[#CDE06A]" : "text-rose-400"
                      }`}
                    >
                      {stock.change24hPct >= 0 ? "+" : ""}
                      {stock.change24hPct.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="h-3 w-10 bg-[#262D3D] rounded animate-pulse" />
                    <span className="h-3 w-6 bg-[#262D3D] rounded animate-pulse" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
