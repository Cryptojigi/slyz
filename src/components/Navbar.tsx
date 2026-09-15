"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { PieChart, Sliders, Layers, ArrowUpRight, Activity } from "lucide-react";

// Dynamic import with SSR disabled to prevent hydration mismatch with browser wallet extensions
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-[#0B0E14]/85 backdrop-blur-md border-b border-[#262D3D]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/slyzlogo.png"
                alt="Slyz Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                SLYZ
                <span className="w-1.5 h-1.5 rounded-full bg-[#CDE06A]"></span>
              </span>
              <p className="text-[10px] uppercase font-semibold text-[#8F9CAE] tracking-widest hidden sm:block">
                Slice the Market
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 bg-[#161B26]/80 p-1 rounded-full border border-[#262D3D]">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                pathname === "/"
                  ? "bg-[#CDE06A] text-[#0B0E14]"
                  : "text-[#8F9CAE] hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Theme Pies
            </Link>
            <Link
              href="/portfolio"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                pathname === "/portfolio"
                  ? "bg-[#CDE06A] text-[#0B0E14]"
                  : "text-[#8F9CAE] hover:text-white"
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              My Portfolio
            </Link>
          </nav>
        </div>

        {/* Right Actions: Market Status & Wallet Button */}
        <div className="flex items-center gap-3">
          {/* 24/7 On-Chain Trading Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161B26] border border-[#262D3D] text-[11px] font-medium text-[#8F9CAE]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CDE06A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CDE06A]"></span>
            </span>
            <span>Solana Mainnet</span>
            <span className="text-[#262D3D]">|</span>
            <span className="text-white font-semibold flex items-center gap-1">
              24/7 xStocks
            </span>
          </div>

          {/* Wallet Connect Button */}
          <div className="slyz-wallet-btn">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  );
};
