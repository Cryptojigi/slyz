"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  PieChart,
  Layers,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Zap,
} from "lucide-react";

// Dynamic import with SSR disabled to prevent hydration mismatch with browser wallet extensions
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

import { MobileWalletLink } from "./MobileWalletLink";

export const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLandingPage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#262D3D]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/slyzlogo.png"
                alt="Slyz Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Slyz
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          {isLandingPage ? (
            <nav className="hidden md:flex items-center gap-6 ml-6 text-xs font-semibold text-[#8F9CAE]">
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#themes" className="hover:text-white transition-colors">
                Curated Themes
              </a>
              <a href="#security" className="hover:text-white transition-colors">
                Security
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-1 ml-4 bg-[#161B26]/80 p-1 rounded-xl border border-[#262D3D]">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-[#CDE06A] text-[#0B0E14]"
                    : "text-[#8F9CAE] hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <Link
                href="/portfolio"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === "/portfolio"
                    ? "bg-[#CDE06A] text-[#0B0E14]"
                    : "text-[#8F9CAE] hover:text-white"
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                My Portfolio
              </Link>
            </nav>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Market Status (App Viewports) */}
          {!isLandingPage && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161B26] border border-[#262D3D] text-[11px] font-medium text-[#8F9CAE]">
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
          )}

          {/* Conditional Action: Landing Page shows 'Launch App', Dashboard shows Wallet Button */}
          {isLandingPage ? (
            <Link
              href="/dashboard"
              className="btn-primary !py-2.5 !px-5 text-xs flex items-center gap-1.5 font-extrabold shadow-md"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="slyz-wallet-btn">
              <WalletMultiButton />
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#161B26] border border-[#262D3D] text-[#8F9CAE] hover:text-white transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-[#262D3D] bg-[#0B0E14]/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {isLandingPage ? (
            <div className="flex flex-col space-y-2 text-sm font-semibold text-[#8F9CAE]">
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#161B26] hover:text-white"
              >
                How It Works
              </a>
              <a
                href="#themes"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#161B26] hover:text-white"
              >
                Curated Themes
              </a>
              <a
                href="#security"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#161B26] hover:text-white"
              >
                Security
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#161B26] hover:text-white"
              >
                FAQ
              </a>
              <Link
                href="/dashboard"
                className="btn-primary flex items-center justify-center gap-2 text-xs py-3 mt-2"
              >
                <span>Launch App</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  pathname === "/dashboard"
                    ? "bg-[#CDE06A] text-[#0B0E14]"
                    : "bg-[#161B26] text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Terminal
              </Link>
              <Link
                href="/portfolio"
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  pathname === "/portfolio"
                    ? "bg-[#CDE06A] text-[#0B0E14]"
                    : "bg-[#161B26] text-white"
                }`}
              >
                <PieChart className="w-4 h-4" />
                My Portfolio & Drift
              </Link>
              <div className="pt-2">
                <div className="slyz-wallet-btn w-full">
                  <WalletMultiButton />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile-only deep-link fallback: shows only when no wallet is available
          in a phone browser (Safari/Chrome). Renders nothing on desktop. */}
      <MobileWalletLink />
    </header>
  );
};
