"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
  Sliders,
  CheckCircle2,
  PieChart,
  Lock,
  ExternalLink,
  ChevronRight,
  Flame,
} from "lucide-react";
import { CURATED_BASKETS, VERIFIED_STOCKS } from "@/lib/constants";
import { LiveSlyzSculpture } from "@/components/LiveSlyzSculpture";
import { Footer } from "@/components/Footer";
import { TechLogosMarquee } from "@/components/TechLogosMarquee";

export default function LandingPage() {
  const previewBaskets = CURATED_BASKETS.slice(0, 3); // The Mag 3, The Index, AI Frontier

  return (
    <div className="space-y-24 pb-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-10 lg:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CDE06A]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8D8AFF]/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Headline, Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#CDE06A]">
              Non-Custodial Thematic Stock Baskets on Solana
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Slice the Market.
              <br />
              <span className="text-[#CDE06A]">Own the Theme.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#8F9CAE] leading-relaxed max-w-2xl font-normal">
              Invest in curated baskets of tokenized US equities and pre-IPO venture companies on Solana — three signatures, one theme.
              Non-custodial, fractional shares powered by Jupiter, xStocks Token-2022, and PreStocks.
            </p>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-4 pt-2">
              <Link
                href="/dashboard"
                className="btn-primary flex items-center justify-center gap-1.5 !px-3 sm:!px-6 !py-2.5 sm:!py-3 text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-xl transition-all"
              >
                <span className="sm:hidden">Explore Pies</span>
                <span className="hidden sm:inline">Explore Thematic Pies</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary flex items-center justify-center gap-1.5 !px-3 sm:!px-6 !py-2.5 sm:!py-3 text-xs sm:text-sm font-semibold hover:border-[#8D8AFF] hover:text-white text-center"
              >
                <span>How It Works</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8F9CAE] shrink-0" />
              </a>
            </div>
          </div>

          {/* Right Column: Live Slyz Logo Sculpture (slides in on reload, desktop only) */}
          <div className="hidden lg:flex lg:col-span-5 justify-center lg:justify-end">
            <LiveSlyzSculpture />
          </div>
        </div>

        {/* Sliding Tech & Infrastructure Showcase */}
        <TechLogosMarquee />
      </section>

      {/* 2. How It Works Section (White Background with Dark Tiles) */}
      <section id="how-it-works" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200 p-8 sm:p-12 lg:p-14 shadow-2xl shadow-slate-950/20 space-y-10 relative overflow-hidden">
        {/* Subtle decorative background blur for depth */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0B0E14] text-[#CDE06A] text-[10px] font-black uppercase tracking-wider shadow-sm">
            Streamlined Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B0E14] tracking-tight">
            How Slyz Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Traditional brokerages force you into fractional order queues and manual rebalancing.
            Slyz packs thematic portfolio management into three sequential Solana signatures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Step 1 - Dark Tile */}
          <div className="bento-card relative overflow-hidden group shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center font-black text-sm text-[#CDE06A] mb-4">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pick or Build a Theme</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Select an expert curated pie like <strong className="text-white">The Mag 3</strong> or <strong className="text-white">AI Frontier</strong>, or assemble 2–4 stocks in our Custom Studio.
            </p>
            <div className="mt-4 pt-4 border-t border-[#262D3D] flex items-center gap-2 text-[11px] font-semibold text-[#CDE06A]">
              <Layers className="w-3.5 h-3.5" />
              <span>5 Curated Pies or Custom 2–4 Mix</span>
            </div>
          </div>

          {/* Step 2 - Dark Tile */}
          <div className="bento-card relative overflow-hidden group shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-[#8D8AFF]/10 border border-[#8D8AFF]/20 flex items-center justify-center font-black text-sm text-[#8D8AFF] mb-4">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Customize Weights & Amount</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Enter any USDC dollar amount ($10+) and adjust individual asset percentages with auto-normalizing sliders or numeric inputs.
            </p>
            <div className="mt-4 pt-4 border-t border-[#262D3D] flex items-center gap-2 text-[11px] font-semibold text-[#8D8AFF]">
              <Sliders className="w-3.5 h-3.5" />
              <span>Exact Dollar Allocations (No Dust)</span>
            </div>
          </div>

          {/* Step 3 - Dark Tile */}
          <div className="bento-card relative overflow-hidden group shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-sm text-white mb-4">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Three Signatures, One Theme</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Approve sequential Jupiter swaps with real-time slippage bounds and price impact guards. Fractional xStocks arrive directly in your wallet.
            </p>
            <div className="mt-4 pt-4 border-t border-[#262D3D] flex items-center gap-2 text-[11px] font-semibold text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#CDE06A]" />
              <span>100% Non-Custodial & Solscan Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Curated Themes Spotlight Showcase */}
      <section id="themes" className="scroll-mt-24 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="pill-badge pill-badge-periwinkle">Thematic Strategies</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Flagship Curated Pies
            </h2>
            <p className="text-xs sm:text-sm text-[#8F9CAE] max-w-xl">
              Diversify into pre-assembled baskets built around high-conviction macroeconomic and technology theses.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto hover:border-[#CDE06A] hover:text-[#CDE06A]"
          >
            <span>View All 5 Themes in Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewBaskets.map((basket) => (
            <div
              key={basket.id}
              className="bento-card flex flex-col justify-between hover:border-[#8D8AFF]/40 transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#1D2332] text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                    {basket.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#CDE06A]">
                    <TrendingUp className="w-3 h-3" />
                    <span>Active Theme</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">{basket.name}</h3>
                  <p className="text-xs text-[#8F9CAE] mt-1 line-clamp-2 leading-relaxed">
                    {basket.description}
                  </p>
                </div>

                {/* Holdings Preview */}
                <div className="space-y-2 pt-2 border-t border-[#262D3D]">
                  {basket.components.map((c) => {
                    const asset = VERIFIED_STOCKS[c.symbol];
                    return (
                      <div
                        key={c.symbol}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <div className="flex items-center gap-2">
                          {asset?.logo ? (
                            <Image
                              src={asset.logo}
                              alt={c.symbol}
                              width={18}
                              height={18}
                              className="rounded-full bg-white/10"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white/10" />
                          )}
                          <span className="font-bold text-white">{c.symbol}</span>
                          <span className="text-[10px] text-[#8F9CAE] hidden sm:inline">
                            {asset?.underlying}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#1D2332] text-[#8D8AFF]">
                          {c.targetWeight}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#262D3D]">
                <Link
                  href="/dashboard"
                  className="btn-primary w-full flex items-center justify-center gap-2 text-xs !py-3"
                >
                  <span>Trade in Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Security & Architecture Pillars */}
      <section id="security" className="scroll-mt-24 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="pill-badge pill-badge-lime">Solana Native</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built with Institutional Rigor
          </h2>
          <p className="text-sm sm:text-base text-[#8F9CAE]">
            Slyz eliminates custodial vulnerabilities by combining Solana Token-2022 raw unit math with Jupiter routing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center text-[#CDE06A]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Dust-Free Raw Math</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Every swap and liquidation is built using exact on-chain base units (`u64` string amounts) rather than lossy IEEE-754 floating points. Zero residual dust left in your token accounts.
            </p>
          </div>

          <div className="bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#8D8AFF]/10 border border-[#8D8AFF]/20 flex items-center justify-center text-[#8D8AFF]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Non-Custodial Architecture</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Slyz never holds your keys, deposits, or share balances. Transactions are signed directly in your wallet standard adapter, with immediate Solscan verifiable signatures.
            </p>
          </div>

          <div className="bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5 text-[#CDE06A]" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated Drift Rebalancing</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              As individual assets outpace or lag behind their target weights, our Smart Top-Up engine directs fresh deposits solely to underweight legs, bringing your portfolio back into balance without taxable sales.
            </p>
          </div>

          <div className="bento-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center text-[#CDE06A]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Decimal Price Impact Guards</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Every leg is inspected against Jupiter's live fraction impact before prompting your signature. Trades exceeding 5% impact are automatically blocked to protect your capital.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section id="faq" className="scroll-mt-24 space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <span className="pill-badge pill-badge-periwinkle">Transparency</span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bento-card space-y-2">
            <h4 className="text-sm font-bold text-white">What are xStocks and how are they backed?</h4>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              xStocks are tokenized representations of US equities issued under the Solana Token-2022 standard. They trade 24/7 on decentralized liquidity pools with verified on-chain mint addresses.
            </p>
          </div>

          <div className="bento-card space-y-2">
            <h4 className="text-sm font-bold text-white">Can I customize the percentages of a theme?</h4>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Yes! In the Slyz Terminal, you can freely edit the percentage weight of any stock in a curated theme or build your own custom pie from scratch with 2 to 4 assets.
            </p>
          </div>

          <div className="bento-card space-y-2">
            <h4 className="text-sm font-bold text-white">What is the minimum investment?</h4>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              You can start investing with as little as $10 USDC. Slyz enforces a $1 minimum leg floor so you never trigger failed swaps or zero-amount errors.
            </p>
          </div>

          <div className="bento-card space-y-2">
            <h4 className="text-sm font-bold text-white">Why does Slyz require sequential signatures?</h4>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Solana transactions have strict 1232-byte packet limits (MTU). Executing multiple token swaps within a single transaction frequently exceeds this limit and fails. Slyz routes each swap sequentially with skip-and-retry safety.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Bottom Call to Action Banner (White Theme) */}
      <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 sm:p-14 text-center space-y-6 shadow-2xl shadow-slate-950/20 text-[#0B0E14]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="max-w-xl mx-auto space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0B0E14] text-[#CDE06A] text-[10px] font-black uppercase tracking-wider shadow-sm">
            Launch Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B0E14] tracking-tight">
            Ready to Slice the Market?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Launch the Slyz Dashboard Terminal to explore all 10 verified US stocks, customize thematic pies, and track on-chain performance.
          </p>
        </div>

        <div className="flex justify-center pt-2 relative z-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm px-8 py-4 font-black rounded-xl bg-[#0B0E14] hover:bg-[#161B26] text-[#CDE06A] shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>Launch Dashboard Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 7. Footer - Exclusively rendered on Landing Page */}
      <Footer />
    </div>
  );
}
