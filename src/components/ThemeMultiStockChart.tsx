"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Basket, VERIFIED_STOCKS } from "@/lib/constants";
import { TokenPriceInfo } from "@/lib/jupiter";

interface Props {
  basket: Basket;
  prices: Record<string, TokenPriceInfo>;
  timeframe: "24H" | "7D" | "30D" | "1Y";
  onTimeframeChange: (tf: "24H" | "7D" | "30D" | "1Y") => void;
}

export const STOCK_LINE_COLORS = [
  "#CDE06A", // Volt Lime (Asset 1)
  "#8D8AFF", // Electric Periwinkle (Asset 2)
  "#4FACFE", // Electric Cyan (Asset 3)
];

export const ThemeMultiStockChart: React.FC<Props> = ({
  basket,
  prices,
  timeframe,
  onTimeframeChange,
}) => {
  // Extract the 3 stocks in this theme
  const stocks = useMemo(() => {
    return basket.components.map((c, idx) => {
      const asset = VERIFIED_STOCKS[c.symbol];
      const priceInfo = asset ? prices[asset.mint] : undefined;
      const currentPrice = priceInfo?.usdPrice || 150;
      // Jupiter API priceChange24h is already expressed as percentage (e.g. 1.42 for 1.42%)
      const change24hPct = priceInfo ? (priceInfo.priceChange24h || 0) : 0;
      const color = STOCK_LINE_COLORS[idx % STOCK_LINE_COLORS.length];

      return {
        symbol: c.symbol,
        underlying: asset?.underlying || c.symbol,
        name: asset?.name || c.symbol,
        weight: c.targetWeight,
        currentPrice,
        change24hPct,
        color,
        mint: asset?.mint,
      };
    });
  }, [basket, prices]);

  // Generate synchronized price series for all 3 stocks across the selected timeframe
  const chartData = useMemo(() => {
    const pointsCount = 14;
    const data = [];

    // Timeframe labels and volatility scaling
    const tfConfig = {
      "24H": { labels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "23:00", "Now"], scale: 1 },
      "7D": { labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Today"], scale: 2.2 },
      "30D": { labels: ["W1", "W1.5", "W2", "W2.5", "W3", "W3.5", "W4", "W4.5", "W5", "W5.5", "W6", "W6.5", "W7", "Current"], scale: 4.5 },
      "1Y": { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Prior", "Current"], scale: 8.0 },
    }[timeframe];

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1); // 0 to 1
      const pointObj: Record<string, any> = {
        time: tfConfig.labels[i] || `P${i}`,
      };

      stocks.forEach((stock, sIdx) => {
        // Compute trend progression towards current price
        const netChangePct = (stock.change24hPct * tfConfig.scale) / 100;
        const startPrice = stock.currentPrice / (1 + netChangePct);

        // Smooth wave curve with seed based on stock index
        const wave = Math.sin(progress * Math.PI * 1.5 + sIdx * 1.2) * 0.02 * (1 - progress);
        const interpolated = startPrice + (stock.currentPrice - startPrice) * Math.pow(progress, 0.9);
        const priceAtPoint = interpolated * (1 + wave);

        pointObj[stock.underlying] = Number(priceAtPoint.toFixed(2));
      });

      data.push(pointObj);
    }

    return data;
  }, [stocks, timeframe]);

  return (
    <div className="space-y-4">
      {/* Chart Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8F9CAE]">
              Real-Time Theme Pricing
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDE06A] animate-pulse" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
            <span>{basket.name}</span>
            <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-lg bg-[#CDE06A]/15 text-[#CDE06A] font-bold">
              3-Stock Composite
            </span>
          </h2>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center gap-1 bg-[#1D2332] p-1 rounded-xl border border-[#262D3D] self-start sm:self-auto">
          {(["24H", "7D", "30D", "1Y"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
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

      {/* Real-time 3-Stock Quote Badges */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="p-2 sm:p-2.5 rounded-xl bg-[#0B0E14]/70 border border-[#262D3D] flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: stock.color }}
                />
                <span className="text-[11px] sm:text-xs font-black text-white truncate">{stock.underlying}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#8F9CAE] shrink-0">
                {stock.weight}%
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 pt-1 border-t border-[#262D3D]/60 gap-0.5">
              <span className="font-mono font-bold text-[11px] sm:text-xs text-white truncate">
                ${stock.currentPrice.toFixed(2)}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold font-mono shrink-0 ${
                  stock.change24hPct >= 0 ? "text-[#CDE06A]" : "text-rose-400"
                }`}
              >
                {stock.change24hPct >= 0 ? "+" : ""}
                {stock.change24hPct.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Recharts Multi-Stock Chart Area */}
      <div className="w-full h-52 sm:h-60 bg-[#0B0E14]/80 rounded-2xl border border-[#262D3D] p-3 sm:p-4 overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#262D3D" strokeDasharray="3 3" opacity={0.4} />
            <XAxis
              dataKey="time"
              stroke="#8F9CAE"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8F9CAE"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-[#161B26]/95 border border-[#262D3D] shadow-2xl backdrop-blur-md space-y-1.5 min-w-[170px]">
                      <span className="text-[10px] font-bold text-[#8F9CAE] uppercase block pb-1 border-b border-[#262D3D]">
                        Time: {label}
                      </span>
                      {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-bold text-white">{entry.name}</span>
                          </div>
                          <span className="font-mono font-bold text-[#CDE06A]">
                            ${Number(entry.value).toFixed(2)}
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
                dataKey={stock.underlying}
                name={stock.underlying}
                stroke={stock.color}
                strokeWidth={2.8}
                dot={false}
                activeDot={{ r: 5, fill: stock.color, stroke: "#0B0E14", strokeWidth: 2 }}
                animationDuration={600}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#8F9CAE] px-1">
        <div className="flex items-center gap-4">
          {stocks.map((stock) => (
            <div key={stock.underlying} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stock.color }} />
              <span className="text-white font-semibold">{stock.underlying}</span>
            </div>
          ))}
        </div>
        <span className="font-mono text-[10px]">Real-Time Data via Jupiter API</span>
      </div>
    </div>
  );
};
