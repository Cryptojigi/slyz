"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { Basket, VERIFIED_STOCKS } from "@/lib/constants";
import { TokenPriceInfo } from "@/lib/jupiter";

interface Props {
  basket: Basket;
  prices: Record<string, TokenPriceInfo>;
}

export const BasketCard: React.FC<Props> = ({ basket, prices }) => {
  // Calculate 24h weighted performance of the basket
  let weighted24h = 0;
  let totalWeight = 0;

  for (const comp of basket.components) {
    const asset = VERIFIED_STOCKS[comp.symbol];
    const priceInfo = asset ? prices[asset.mint] : null;
    const change = priceInfo ? priceInfo.priceChange24h : 0;
    weighted24h += change * (comp.targetWeight / 100);
    totalWeight += comp.targetWeight;
  }

  const isPositive = weighted24h >= 0;

  return (
    <div className="bento-card group flex flex-col justify-between hover:scale-[1.01] hover:border-[#8D8AFF]/50 transition-all duration-200">
      <div>
        {/* Top Header: Category Tag & 24h Weighted Performance Pill */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="pill-badge bg-[#1D2332] text-[#8F9CAE] border border-[#262D3D]">
            {basket.category}
          </span>
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
              isPositive
                ? "bg-[#CDE06A]/15 text-[#CDE06A] border border-[#CDE06A]/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {weighted24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Basket Title & Tagline */}
        <h3 className="text-xl font-extrabold text-white tracking-tight group-hover:text-[#CDE06A] transition-colors">
          {basket.name}
        </h3>
        <p className="text-xs text-[#8F9CAE] mt-1 line-clamp-2 leading-relaxed">
          {basket.description}
        </p>

        {/* Component Stocks Chips */}
        <div className="mt-5 space-y-2">
          {basket.components.map((comp) => {
            const asset = VERIFIED_STOCKS[comp.symbol];
            const priceInfo = asset ? prices[asset.mint] : null;
            const livePrice = priceInfo?.usdPrice || 0;

            return (
              <div
                key={comp.symbol}
                className="flex items-center justify-between p-2 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D]/60 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#161B26] flex items-center justify-center border border-[#262D3D]">
                    {asset?.logo ? (
                      <Image
                        src={asset.logo}
                        alt={comp.symbol}
                        width={24}
                        height={24}
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[9px] font-bold">{comp.symbol.slice(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white mr-1.5">{asset?.underlying || comp.symbol}</span>
                    <span className="text-[10px] text-[#8F9CAE] uppercase">xStock</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#8F9CAE]">
                    ${livePrice > 0 ? livePrice.toFixed(2) : "---"}
                  </span>
                  <span className="font-mono font-bold text-xs text-[#8D8AFF] bg-[#8D8AFF]/10 px-2 py-0.5 rounded-md">
                    {comp.targetWeight}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[#262D3D]/80 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#8F9CAE] uppercase tracking-wider">
          3-Asset Theme
        </span>
        <Link
          href={`/invest/${basket.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#CDE06A] text-[#0B0E14] hover:bg-[#B5C856] active:scale-95 transition-all shadow-sm"
        >
          <span>Slyz In</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
