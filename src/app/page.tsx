"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
  Sliders,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Gift,
  Check,
  Share2,
  Clock,
} from "lucide-react";
import { CURATED_BASKETS, VERIFIED_STOCKS } from "@/lib/constants";
import { Footer } from "@/components/Footer";
import { TechLogosMarquee } from "@/components/TechLogosMarquee";

const FAQ_ITEMS = [
  {
    question: "What can I invest in on Slyz?",
    answer: "Slyz offers curated baskets of verified tokenized public equities, alongside selected PreStocks for private-market exposure. You can invest through a ready-made theme or build a public-equity pie in Custom Studio. Private-market exposure is currently available through the Frontier basket.",
  },
  {
    question: "What are PreStocks and what do they represent?",
    answer: "PreStocks are on-chain tokens designed to provide economic exposure to selected private companies before an IPO. They are not company shares and do not carry equity ownership, voting rights, or corporate dividends. Slyz shows available market data alongside live token pricing so the distinction is clear before you invest.",
  },
  {
    question: "Can I tailor a pie to my own view?",
    answer: "Yes. You can adjust the weights of a curated public-market theme, or build a Custom Studio pie with two to four verified public xStocks. As you edit, Slyz updates each dollar allocation so you can see exactly how the order is divided.",
  },
  {
    question: "Can I gift tokenized stocks or pre-IPO exposure?",
    answer: "Yes. From the Gift Stocks hub, you can send eligible holdings to a Solana wallet or create an expiring claim link. The link has a live countdown, the recipient can claim into a Solana wallet with sponsored network fees, and you can reclaim an unclaimed gift after it expires.",
  },
  {
    question: "How does Slyz protect me during execution?",
    answer: "You approve every swap from your own wallet; Slyz never takes custody of your keys or balances. Basket legs execute sequentially with live quotes, and the app stops an order when price impact exceeds the configured threshold.",
  },
  {
    question: "What do I need to get started?",
    answer: "Connect a Solana wallet, keep a small SOL balance for network costs, and fund it with USDC. Public themed pies start at $10, with a $1 minimum per position. For private-market orders, Slyz shows the expected execution impact before you sign.",
  },
] as const;

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [activeScrollIndex, setActiveScrollIndex] = React.useState(0);

  const checkScroll = React.useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    const cardWidth = 360;
    const currentIndex = Math.round(scrollLeft / cardWidth);
    setActiveScrollIndex(Math.min(CURATED_BASKETS.length - 1, Math.max(0, currentIndex)));
  }, []);

  React.useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scrollByAmount = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.8;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-2 overflow-x-hidden">
      {/* 1. Hero Section */}
      <motion.section
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="slyz-liquid-hero relative isolate overflow-hidden rounded-[1.75rem] border border-[#31394b] px-5 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-28 shadow-2xl"
      >
        <div className="slyz-liquid-hero__ripple slyz-liquid-hero__ripple--top" aria-hidden="true" />
        <div className="slyz-liquid-hero__ripple slyz-liquid-hero__ripple--middle" aria-hidden="true" />
        <div className="slyz-liquid-hero__ripple slyz-liquid-hero__ripple--bottom" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#CDE06A] sm:mb-7 sm:text-xs">
              Non-Custodial Thematic Stock Baskets on Solana
            </p>

            <h1 className="max-w-4xl text-[2.65rem] font-bold tracking-[-0.06em] text-white leading-[0.96] sm:text-6xl lg:text-8xl">
              Slice the market.
              <br />
              <span className="text-[#CDE06A]">Own the theme.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#D6DCEA] sm:mt-8 sm:text-base lg:text-lg">
              Invest in curated baskets of tokenized US equities and pre-IPO venture companies on Solana, or gift fractional shares to anyone with fee-sponsored claim links.
              Non-custodial, fractional shares powered by Jupiter, xStocks Token-2022, and PreStocks.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-9">
              <Link
                href="/dashboard"
                className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-[#0B0E14] py-1.5 pl-5 pr-1.5 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(4,7,14,0.32)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CDE06A]"
              >
                <span>Explore thematic pies</span>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#CDE06A] text-[#0B0E14] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/gift"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-[#161B26]/80 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-[#CDE06A]/70 hover:bg-[#1C2230]"
              >
                <Gift className="h-4 w-4 text-[#CDE06A]" />
                <span>Gift a Stock</span>
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white"
              >
                <span>How It Works</span>
                <ChevronRight className="h-4 w-4 text-[#CDE06A]" />
              </a>
            </div>
        </div>

        {/* Sliding Tech & Infrastructure Showcase */}
        <div className="relative z-10 mx-auto mt-10 max-w-4xl sm:mt-14">
          <TechLogosMarquee />
        </div>
      </motion.section>

      {/* 2. How It Works Section */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="scroll-mt-24 rounded-2xl bg-[#161B26] border border-[#262D3D] p-8 sm:p-12 lg:p-14 shadow-2xl space-y-10 relative overflow-hidden"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            From a market view to assets in your wallet
          </h2>
          <p className="text-sm sm:text-base text-[#8F9CAE] leading-relaxed font-normal">
            Pick a thesis, decide the allocation, and approve the order from your own wallet.
            Slyz handles the routing while you stay in control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Step 1 - Dark Tile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card relative overflow-hidden group shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center font-semibold text-sm text-[#CDE06A] mb-4">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Choose a thesis</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Start with a curated pie such as <strong className="text-white">The Mag 3</strong> or <strong className="text-white">AI Frontier</strong>, or build a public-equity mix in Custom Studio.
            </p>
            <div className="mt-4 pt-4 border-t border-[#262D3D] flex items-center gap-2 text-[11px] font-semibold text-[#CDE06A]">
              <Layers className="w-3.5 h-3.5" />
              <span>Curated themes or a custom mix</span>
            </div>
          </motion.div>

          {/* Step 2 - Dark Tile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card relative overflow-hidden group shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-[#8D8AFF]/10 border border-[#8D8AFF]/20 flex items-center justify-center font-semibold text-sm text-[#8D8AFF] mb-4">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Set the allocation</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Set your USDC amount, then adjust each holding by percentage or dollar value. Slyz keeps the total in balance as you edit.
            </p>
            <div className="mt-4 pt-4 border-t border-[#262D3D] flex items-center gap-2 text-[11px] font-semibold text-[#8D8AFF]">
              <Sliders className="w-3.5 h-3.5" />
              <span>Clear allocations, before you sign</span>
            </div>
          </motion.div>

          {/* Step 3 - Dark Tile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card relative overflow-hidden group shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-semibold text-sm text-white mb-4">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Review and sign</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Review live quotes and price-impact limits, then approve the sequential Jupiter swaps. The assets settle straight into your wallet.
            </p>
            <div className="mt-4 pt-4 border-t border-[#262D3D] flex items-center gap-2 text-[11px] font-semibold text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#CDE06A]" />
              <span>Your wallet signs every step</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 3. Curated Themes Spotlight Showcase */}
      <motion.section
        id="themes"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="scroll-mt-24 space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Start with a market view
            </h2>
            <p className="text-xs sm:text-sm text-[#8F9CAE] max-w-xl">
              Explore focused baskets that turn a thesis into a considered mix of tokenized equities.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollByAmount("left")}
                disabled={!canScrollLeft}
                aria-label="Previous themes"
                className="w-9 h-9 rounded-xl bg-[#161B26] border border-[#262D3D] flex items-center justify-center text-white hover:border-[#CDE06A] hover:text-[#CDE06A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount("right")}
                disabled={!canScrollRight}
                aria-label="Next themes"
                className="w-9 h-9 rounded-xl bg-[#161B26] border border-[#262D3D] flex items-center justify-center text-white hover:border-[#CDE06A] hover:text-[#CDE06A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/dashboard"
              className="btn-secondary text-xs flex items-center gap-2 hover:border-[#CDE06A] hover:text-[#CDE06A]"
            >
              <span>Explore all themes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Horizontally Swipeable Carousel Track */}
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-5 pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth items-stretch"
        >
          {CURATED_BASKETS.map((basket, bIdx) => (
            <motion.div
              key={basket.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.45, delay: Math.min(bIdx * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
              className="w-[84vw] max-w-[340px] sm:w-[350px] shrink-0 snap-start bento-card !p-0 overflow-hidden flex flex-col justify-between group hover:border-[#8D8AFF]/50 transition-all duration-200"
            >
              <div className="flex flex-col h-full">
                {/* Thematic Banner Artwork */}
                {basket.image && (
                  <div className="relative w-full h-36 overflow-hidden bg-[#0B0E14] shrink-0">
                    <Image
                      src={basket.image}
                      alt={basket.name}
                      fill
                      sizes="(max-width: 640px) 84vw, 350px"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161B26] via-[#161B26]/30 to-transparent pointer-events-none" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14]/85 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 shadow-sm">
                        {basket.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#CDE06A] px-2.5 py-1 rounded-lg bg-[#0B0E14]/85 backdrop-blur-md border border-[#CDE06A]/30 shadow-sm">
                        <TrendingUp className="w-3 h-3" />
                        <span>{basket.market === "private" ? "Pre-IPO" : "Active Theme"}</span>
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#CDE06A] transition-colors">
                      {basket.name}
                    </h3>
                    <p className="text-xs text-[#8F9CAE] mt-1 line-clamp-2 min-h-[36px] leading-relaxed">
                      {basket.description}
                    </p>

                    {/* Holdings Preview Chips */}
                    <div className="mt-4 space-y-2">
                      {basket.components.map((c) => {
                        const asset = VERIFIED_STOCKS[c.symbol];
                        return (
                          <div
                            key={c.symbol}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D]/60 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {asset?.logo ? (
                                <Image
                                  src={asset.logo}
                                  alt={c.symbol}
                                  width={20}
                                  height={20}
                                  className="rounded-full bg-white/10 object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                                  {c.symbol.slice(0, 2)}
                                </div>
                              )}
                              <span className="font-bold text-white">{asset?.underlying || c.symbol}</span>
                              <span className="text-[10px] text-[#8F9CAE] uppercase">
                                {basket.market === "private" ? "PreStock" : "xStock"}
                              </span>
                            </div>
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#8D8AFF]/10 text-[#8D8AFF] border border-[#8D8AFF]/20">
                              {c.targetWeight}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer CTA */}
                  <div className="pt-4 mt-5 border-t border-[#262D3D]/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#8F9CAE] uppercase tracking-wider">
                      {basket.components.length}-Asset Pie
                    </span>
                    <Link
                      href={`/dashboard`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#CDE06A] text-[#0B0E14] hover:bg-[#B5C856] active:scale-95 transition-all shadow-sm"
                    >
                      <span>Slyz In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Swipe Cue & Dots Indicator */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {CURATED_BASKETS.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => {
                  if (!carouselRef.current) return;
                  const cardWidth = 360;
                  carouselRef.current.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
                }}
                aria-label={`Jump to ${b.name}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeScrollIndex
                    ? "w-6 bg-[#CDE06A]"
                    : "w-2 bg-[#262D3D] hover:bg-[#8F9CAE]"
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] font-mono text-[#8F9CAE] flex items-center gap-1">
            <span>Swipe or click arrows ({activeScrollIndex + 1}/{CURATED_BASKETS.length})</span>
          </span>
        </div>
      </motion.section>

      {/* 4. Stock Gifting */}
      <motion.section
        id="gifting"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="scroll-mt-24 relative overflow-hidden rounded-2xl border border-[#262D3D] bg-[#161B26] p-4 sm:p-8 lg:p-12 shadow-2xl space-y-8"
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#CDE06A]">
              <Gift className="h-4 w-4 text-[#CDE06A]" />
              <span>Non-Custodial Stock Gifting</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Onboard anyone to real stocks on Solana.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-[#AAB6CA]">
              Don&apos;t ask friends to configure RPCs, bridge tokens, or buy speculative meme coins. Gift them $5 of Apple or pre-IPO venture shares as a simple claim link sent over Telegram, WhatsApp, or email.
            </p>

            <div className="space-y-2.5 pt-1 text-xs text-[#D6DCEA]">
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#CDE06A] shrink-0" />
                <span>Zero recipient fees — Vault sponsors the token account setup</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#8D8AFF] shrink-0" />
                <span>Custom expiry timers — From 1 hour to 30 days</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-white shrink-0" />
                <span>Instant reclaim — Pull back unclaimed funds at any time</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/gift"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#CDE06A] text-[#0B0E14] hover:bg-[#B5C856] active:scale-95 transition-all shadow-sm"
              >
                <span>Gift stocks now</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/gift/claim"
                className="text-xs font-semibold text-[#8F9CAE] hover:text-white transition-colors px-3 py-2"
              >
                Have a claim code?
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            {/* Interactive-style Gift Preview Card */}
            <div className="rounded-2xl border border-[#262D3D] bg-[#0B0E14] p-4 sm:p-6 space-y-3.5 sm:space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#262D3D] text-[11px] font-mono text-[#8F9CAE]">
                <span className="flex items-center gap-1.5 text-[#CDE06A] font-semibold">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Slyz Ephemeral Vault</span>
                </span>
                <span>Claim Link Active</span>
              </div>

              <div className="p-4 rounded-xl bg-[#161B26] border border-[#262D3D] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                      AAPL
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Apple Inc.</h4>
                      <p className="text-[11px] text-[#8F9CAE]">xStock Token-2022</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white font-mono">$25.00</span>
                    <p className="text-[11px] text-[#8F9CAE] font-mono">0.114 shares</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B0E14]/80 border border-[#262D3D]/80 text-xs text-[#AAB6CA] italic">
                  &ldquo;Happy birthday! Starting your on-chain equity portfolio.&rdquo;
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#161B26]/60 border border-[#262D3D] space-y-1">
                  <span className="text-[#8F9CAE] block">Gas & Rent</span>
                  <span className="text-[#CDE06A] font-semibold">Sponsored ($0.00)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#161B26]/60 border border-[#262D3D] space-y-1">
                  <span className="text-[#8F9CAE] block">Expiry</span>
                  <span className="text-white font-semibold">6d 22h remaining</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="w-full py-2.5 rounded-xl bg-[#161B26] border border-[#262D3D] text-center text-xs font-semibold text-white/90">
                  Connect Wallet to Claim
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Step Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#262D3D]">
          <div className="p-4 rounded-xl bg-[#0B0E14]/50 border border-[#262D3D] space-y-1.5">
            <span className="text-xs font-mono text-[#CDE06A]">01 Select & Lock</span>
            <h4 className="text-sm font-bold text-white">Choose any stock holding</h4>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Pick public xStocks or private PreStocks, set the dollar amount, and lock into an ephemeral smart vault.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0B0E14]/50 border border-[#262D3D] space-y-1.5">
            <span className="text-xs font-mono text-[#8D8AFF]">02 Share One Link</span>
            <h4 className="text-sm font-bold text-white">Send over any messenger</h4>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Copy the claim URL and send via Telegram, WhatsApp, or email. Only the link recipient can unlock the vault.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0B0E14]/50 border border-[#262D3D] space-y-1.5">
            <span className="text-xs font-mono text-white">03 Sponsored Claim</span>
            <h4 className="text-sm font-bold text-white">Zero SOL onboarding</h4>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Your recipient connects any wallet. The vault covers account creation and gas. If unclaimed, you pull funds back.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 5. Security & Architecture Pillars */}
      <motion.section
        id="security"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="scroll-mt-24 space-y-10"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Built for the details that matter
          </h2>
          <p className="text-sm sm:text-base text-[#8F9CAE]">
            The product is designed around the mechanics of on-chain execution: precise accounting, transparent routing, and wallet-level control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center text-[#CDE06A]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Exact-unit accounting</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Swaps and liquidations are calculated in the same base units used on-chain, rather than rounded browser floats. That keeps the order math aligned with the transaction.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#8D8AFF]/10 border border-[#8D8AFF]/20 flex items-center justify-center text-[#8D8AFF]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Your wallet stays in charge</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Slyz never holds your keys, deposits, or share balances. You sign transactions in your connected wallet, and the resulting signatures are independently verifiable on Solana.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5 text-[#CDE06A]" />
            </div>
            <h3 className="text-lg font-bold text-white">Top up toward your target</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              When holdings drift from their target weights, Smart Top-Up directs new funds toward the underweight positions instead of selling what has already grown.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center text-[#CDE06A]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Execution safeguards</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              Before you sign, each leg is checked against Jupiter’s live pricing and impact estimate. Orders that exceed the configured 5% impact limit are blocked.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* 5. Frequently Asked Questions */}
      <motion.section
        id="faq"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="scroll-mt-24 space-y-6 max-w-4xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Clear answers, before you sign
          </h2>
          <p className="text-sm sm:text-base text-[#8F9CAE] leading-relaxed">
            The essentials on using USDC to access thematic public-market and private-market token exposure from your own wallet.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <motion.article
                key={item.question}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
                  isOpen
                    ? "bg-[#161B26] border-[#8D8AFF]/50 shadow-lg shadow-[#8D8AFF]/5"
                    : "bg-[#161B26] border-[#262D3D] hover:border-[#384257]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left"
                >
                  <span className="flex-1 text-sm font-bold text-white">{item.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[#8F9CAE] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#CDE06A]" : ""}`} />
                </button>

                <div
                  id={answerId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-[#262D3D] px-4 sm:px-5 pb-5 pt-4 text-xs leading-relaxed text-[#8F9CAE]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      {/* 6. Bottom Call to Action Banner */}
      <motion.section
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="slyz-closing-cta relative isolate overflow-hidden rounded-[1.75rem] border border-[#30394d] px-6 py-12 text-center text-white shadow-2xl sm:px-12 sm:py-16 lg:py-20"
      >
        <div className="slyz-closing-cta__orb slyz-closing-cta__orb--left" aria-hidden="true" />
        <div className="slyz-closing-cta__orb slyz-closing-cta__orb--right" aria-hidden="true" />
        <div className="slyz-closing-cta__grid" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#CDE06A] sm:mb-5">
            Built for self-custody
          </p>
          <h2 className="text-4xl font-bold tracking-[-0.05em] text-white sm:text-5xl">
            Put a market view to work
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#AAB6CA] sm:mt-5 sm:text-base">
            Explore curated themes, build a public-equity pie, or gift fractional shares to friends and family with sponsored claims.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
            <Link
              href="/dashboard"
              className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-[#CDE06A] py-1.5 pl-6 pr-1.5 text-sm font-bold text-[#0B0E14] shadow-[0_16px_40px_rgba(205,224,106,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D8EA7D] hover:shadow-[0_20px_45px_rgba(205,224,106,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CDE06A]"
            >
              <span>Open the dashboard</span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0B0E14] text-[#CDE06A] transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/gift"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/20 bg-[#161B26] px-6 py-2.5 text-sm font-bold text-white transition-all hover:border-[#CDE06A] hover:bg-[#1C2230]"
            >
              <Gift className="h-4 w-4 text-[#CDE06A]" />
              <span>Gift a stock</span>
            </Link>
          </div>

          <p className="mt-6 text-xs text-[#8F9CAE] sm:mt-7">
            No deposits. No custody. Your wallet signs every transaction.
          </p>
        </div>
      </motion.section>

      {/* 7. Footer - Exclusively rendered on Landing Page */}
      <Footer />
    </div>
  );
}
