"use client";

import React from "react";

interface TechLogo {
  id: string;
  name: string;
  category: string;
  renderLogo: () => React.ReactNode;
}

const TECH_LOGOS: TechLogo[] = [
  {
    id: "solana",
    name: "SOLANA",
    category: "L1 Network",
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 32 26" fill="none" className="h-6 w-auto">
          <defs>
            <linearGradient id="sol-g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient id="sol-g2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient id="sol-g3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
          <path
            d="M5 21.5h21.8c.8 0 1.5-.4 2-1l2.8-3.2c.5-.6.1-1.6-.7-1.6H9.1c-.8 0-1.5.4-2 1L4.3 19.9c-.5.6-.1 1.6.7 1.6z"
            fill="url(#sol-g1)"
          />
          <path
            d="M5 7h21.8c.8 0 1.5-.4 2-1L31.6 2.8C32.1 2.2 31.7 1.2 30.9 1.2H9.1c-.8 0-1.5.4-2 1L4.3 5.4c-.5.6-.1 1.6.7 1.6z"
            fill="url(#sol-g2)"
          />
          <path
            d="M27 14.2H5.2c-.8 0-1.5.4-2 1L.4 18.4c-.5.6-.1 1.6.7 1.6h21.8c.8 0 1.5-.4 2-1l2.8-3.2c.5-.6.1-1.6-.7-1.6z"
            fill="url(#sol-g3)"
          />
        </svg>
        <span className="font-extrabold text-base tracking-[0.18em] text-white font-mono">
          SOLANA
        </span>
      </div>
    ),
  },
  {
    id: "jupiter",
    name: "JUPITER",
    category: "Liquidity & Routing",
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 32 32" fill="none" className="h-6 w-auto">
          <defs>
            <linearGradient id="jup-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA800" />
              <stop offset="50%" stopColor="#36FB8F" />
              <stop offset="100%" stopColor="#00BEFA" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="8.5" fill="url(#jup-grad)" />
          <ellipse
            cx="16"
            cy="16"
            rx="14"
            ry="4.5"
            stroke="url(#jup-grad)"
            strokeWidth="1.8"
            transform="rotate(-28 16 16)"
          />
        </svg>
        <span className="font-black text-base tracking-wider text-white">
          JUPITER
        </span>
      </div>
    ),
  },
  {
    id: "circle",
    name: "CIRCLE",
    category: "USDC Settlement",
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 32 32" fill="none" className="h-6 w-auto">
          <circle cx="16" cy="16" r="13" stroke="#2775CA" strokeWidth="2.5" />
          <path
            d="M16 6a10 10 0 0 1 7.07 17.07l-2.12-2.12A7 7 0 0 0 16 9v-3z"
            fill="#00D2FF"
          />
          <circle cx="16" cy="16" r="4.5" fill="#2775CA" />
        </svg>
        <span className="font-extrabold text-base tracking-widest text-white">
          CIRCLE
        </span>
      </div>
    ),
  },
  {
    id: "xstocks",
    name: "xSTOCKS",
    category: "Backed.fi Equities",
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-[#CDE06A] flex items-center justify-center font-black text-xs text-[#0B0E14] shadow-sm">
          xS
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-wider text-white leading-tight">
            xSTOCKS
          </span>
          <span className="text-[9px] font-semibold text-[#8F9CAE] uppercase tracking-wider">
            Backed.fi
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "prestocks",
    name: "PRESTOCKS",
    category: "Pre-IPO SPVs",
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-[#8D8AFF] flex items-center justify-center font-black text-xs text-[#0B0E14] shadow-sm">
          PS
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-wider text-white leading-tight">
            PRESTOCKS
          </span>
          <span className="text-[9px] font-semibold text-[#8F9CAE] uppercase tracking-wider">
            Pre-IPO Markets
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "token2022",
    name: "TOKEN-2022",
    category: "Solana Extensions",
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg border border-[#CDE06A]/50 bg-[#CDE06A]/10 flex items-center justify-center text-[#CDE06A]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="font-extrabold text-sm tracking-wider text-white font-mono">
          TOKEN-2022
        </span>
      </div>
    ),
  },
  {
    id: "phantom",
    name: "PHANTOM",
    category: "Solana Ecosystem",
    renderLogo: () => (
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#AB9FF2] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#0B0E14" className="w-3.5 h-3.5">
            <path d="M12 2C7.58 2 4 5.58 4 10c0 3.31 2.01 6.16 4.9 7.35V20c0 .55.45 1 1 1h4.2c.55 0 1-.45 1-1v-2.65c2.89-1.19 4.9-4.04 4.9-7.35 0-4.42-3.58-8-8-8zm-2 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
          </svg>
        </div>
        <span className="font-extrabold text-sm tracking-widest text-white">
          PHANTOM
        </span>
      </div>
    ),
  },
  {
    id: "nextjs",
    name: "NEXT.JS",
    category: "Modern Web Stack",
    renderLogo: () => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#0B0E14] font-black text-xs">
          N
        </div>
        <span className="font-extrabold text-sm tracking-wider text-white">
          NEXT.JS
        </span>
      </div>
    ),
  },
];

export const TechLogosMarquee: React.FC = () => {
  // Duplicate list twice to create a seamless infinite ticker loop
  const duplicatedLogos = [...TECH_LOGOS, ...TECH_LOGOS];

  return (
    <div className="relative z-10 mt-10 pt-6 border-t border-[#262D3D]/60 overflow-hidden select-none">
      {/* Kicker label */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-[10px] sm:text-xs uppercase font-extrabold text-[#8F9CAE] tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CDE06A] animate-pulse" />
          Powered by Core Protocols & Infrastructure
        </span>
        <span className="text-[10px] text-[#8F9CAE]/70 hidden sm:inline-block">
          Hover to pause ticker
        </span>
      </div>

      {/* Marquee Wrapper with left/right fade masks */}
      <div
        className="marquee-wrapper relative overflow-hidden py-2 cursor-pointer group"
        title="Hover to pause sliding showcase"
      >
        {/* Left Gradient Fade Mask */}
        <div className="absolute left-0 inset-y-0 w-16 sm:w-28 bg-gradient-to-r from-[#161B26] via-[#161B26]/80 to-transparent z-10 pointer-events-none" />

        {/* Right Gradient Fade Mask */}
        <div className="absolute right-0 inset-y-0 w-16 sm:w-28 bg-gradient-to-l from-[#161B26] via-[#161B26]/80 to-transparent z-10 pointer-events-none" />

        {/* Continuous Animated Track */}
        <div className="animate-marquee-track flex items-center gap-12 sm:gap-16">
          {duplicatedLogos.map((tech, index) => (
            <div
              key={`${tech.id}-${index}`}
              className="flex items-center gap-3 shrink-0 opacity-85 hover:opacity-100 transition-all duration-200 transform hover:scale-105"
            >
              {tech.renderLogo()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
