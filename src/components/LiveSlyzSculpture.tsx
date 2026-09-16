"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Sparkles, TrendingUp, ShieldCheck, Zap, Layers, ArrowUpRight } from "lucide-react";

interface Props {
  className?: string;
}

export const LiveSlyzSculpture: React.FC<Props> = ({ className = "" }) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger smooth staggered slide-in animation on every page reload
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Interactive 3D tilt tracking mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const tiltStyle = {
    transform: `perspective(1000px) rotateY(${mousePos.x * 14}deg) rotateX(${-mousePos.y * 14}deg)`,
    transition: "transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)",
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-[480px] h-[370px] select-none flex items-center justify-center ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Background Ambient Glow Orbs matching logo colors */}
      <div
        className={`absolute top-0 right-4 w-56 h-56 rounded-full bg-[#6366F1]/30 blur-3xl transition-opacity duration-1000 pointer-events-none ${
          hasMounted ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute bottom-2 left-4 w-56 h-56 rounded-full bg-[#CDE06A]/25 blur-3xl transition-opacity duration-1000 pointer-events-none ${
          hasMounted ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Floating Micro-Card Top-Left: Live Token-2022 Status */}
      <div
        className={`absolute top-4 left-2 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#161B26]/90 border border-[#262D3D] shadow-2xl backdrop-blur-md transition-all duration-700 delay-300 ${
          hasMounted
            ? "opacity-100 translate-y-0 translate-x-0 scale-100"
            : "opacity-0 -translate-y-6 translate-x-12 scale-90"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CDE06A] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#CDE06A]" />
        </span>
        <div className="leading-tight">
          <span className="text-[11px] font-bold text-white block">
            Token-2022 xStocks
          </span>
          <span className="text-[9px] font-semibold text-[#8F9CAE] block">
            24/7 Solana Equities
          </span>
        </div>
      </div>

      {/* Floating Micro-Card Bottom-Right: 3 Signatures Guarantee */}
      <div
        className={`absolute bottom-4 right-2 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#161B26]/90 border border-[#262D3D] shadow-2xl backdrop-blur-md transition-all duration-700 delay-500 ${
          hasMounted
            ? "opacity-100 translate-y-0 translate-x-0 scale-100"
            : "opacity-0 translate-y-6 translate-x-12 scale-90"
        }`}
      >
        <div className="w-6 h-6 rounded-lg bg-[#8D8AFF]/20 flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8D8AFF]" />
        </div>
        <div className="leading-tight">
          <span className="text-[11px] font-bold text-white block">
            Non-Custodial
          </span>
          <span className="text-[9px] font-semibold text-[#8F9CAE] block">
            Three Signatures, One Theme
          </span>
        </div>
      </div>

      {/* 3D Container for Logo Slices */}
      <div
        style={tiltStyle}
        className="relative w-[380px] h-[260px] flex items-center justify-center"
      >
        {/* ========================================================= */}
        {/* SLICE 1 (TOP): INDIGO / PERIWINKLE SLASH                  */}
        {/* Exact parallel diagonal angle (-28deg) matching slyzlogo  */}
        {/* ========================================================= */}
        <div
          className={`absolute top-4 right-6 w-[310px] h-[70px] rounded-full bg-gradient-to-r from-[#5357F6] via-[#686DF7] to-[#868BFF] shadow-[0_12px_40px_rgba(99,102,241,0.4)] border-t border-white/40 border-b border-indigo-900/30 overflow-hidden cursor-pointer group transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            hasMounted
              ? "opacity-100 translate-x-0 rotate-[-27deg]"
              : "opacity-0 translate-x-48 rotate-[-27deg]"
          }`}
          style={{
            transformOrigin: "center center",
          }}
        >
          {/* Continuous Specular Sweep Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full animate-[sheen_4.5s_infinite]" />

          {/* Internal Stock Badges */}
          <div className="relative z-10 w-full h-full px-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm font-extrabold text-[11px] tracking-wider border border-white/15 shadow-sm">
                NVDA
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm font-extrabold text-[11px] tracking-wider border border-white/15 shadow-sm">
                AAPL
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm font-extrabold text-[11px] tracking-wider border border-white/15 shadow-sm">
                MSFT
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-extrabold bg-white/20 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
              <TrendingUp className="w-3 h-3 text-[#CDE06A]" />
              <span>+18.4%</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SLICE 2 (BOTTOM): NEON LIME SLASH                         */}
        {/* Exact parallel diagonal angle (-28deg) matching slyzlogo  */}
        {/* ========================================================= */}
        <div
          className={`absolute bottom-6 left-6 w-[310px] h-[70px] rounded-full bg-gradient-to-r from-[#B4DD3D] via-[#CDE06A] to-[#DCF078] shadow-[0_12px_40px_rgba(205,224,106,0.4)] border-t border-white/50 border-b border-lime-800/20 overflow-hidden cursor-pointer group transition-all duration-800 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            hasMounted
              ? "opacity-100 translate-x-0 rotate-[-27deg]"
              : "opacity-0 translate-x-48 rotate-[-27deg]"
          }`}
          style={{
            transformOrigin: "center center",
          }}
        >
          {/* Continuous Specular Sweep Shimmer (offset timing) */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent -translate-x-full animate-[sheen_4.5s_infinite_1.8s]" />

          {/* Internal Content */}
          <div className="relative z-10 w-full h-full px-6 flex items-center justify-between text-[#0B0E14]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-black/15 flex items-center justify-center font-black text-xs">
                ⚡
              </div>
              <div className="leading-tight">
                <span className="text-xs font-black tracking-wider uppercase block">
                  ONE-THEME PIES
                </span>
                <span className="text-[10px] font-extrabold opacity-80 block">
                  Fractional Equities on Solana
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-black bg-black/15 px-3 py-1 rounded-full">
              <Zap className="w-3 h-3 fill-current" />
              <span>~3.2s</span>
            </div>
          </div>
        </div>

        {/* Diagonal Center Kinetic Slash Guide Line */}
        <div
          className={`absolute w-[320px] h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-[-27deg] pointer-events-none transition-opacity duration-1000 delay-500 ${
            hasMounted ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
};
