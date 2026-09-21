"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Layers,
  Zap,
  ShieldCheck,
  Coins,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  PieChart,
  ArrowLeft,
  Scale,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Info,
  Flame,
  Search,
} from "lucide-react";
import { VERIFIED_STOCKS, CURATED_BASKETS, USDC_MINT } from "@/lib/constants";
import { PRESTOCKS_FALLBACK } from "@/lib/prestocks";

type DocTab = "getting-started" | "architecture" | "mechanics" | "baskets" | "directory" | "safety";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocTab>("getting-started");
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const copyToClipboard = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const allVerifiedStocks = Object.values(VERIFIED_STOCKS);
  const filteredStocks = allVerifiedStocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 pt-4 px-2 sm:px-0">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#8F9CAE]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Slyz Home</span>
        </Link>
        <span className="text-[11px] font-mono bg-[#161B26] px-2.5 py-1 rounded-md border border-[#262D3D]">
          Solana Mainnet-Beta • Token-2022
        </span>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CDE06A]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 text-[#CDE06A] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Protocol Documentation & Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Slyz Documentation
          </h1>
          <p className="text-sm sm:text-base text-[#8F9CAE] leading-relaxed">
            Everything you need to understand thematic stock baskets on Solana: Dual-Sleeve Token-2022 standards,
            sequential swap orchestration, smart top-up rebalancing, and verified contract addresses.
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Horizontal scroll on mobile) */}
      <div className="border-b border-[#262D3D] pb-2 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-2 min-w-max">
          {[
            { id: "getting-started", label: "Getting Started", icon: Zap },
            { id: "architecture", label: "Dual-Sleeve Architecture", icon: Layers },
            { id: "mechanics", label: "Protocol Mechanics", icon: RefreshCw },
            { id: "baskets", label: "Curated Thematic Baskets", icon: PieChart },
            { id: "directory", label: "Verified Token Directory", icon: Coins },
            { id: "safety", label: "Anti-Phishing & Safety", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DocTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#CDE06A] text-[#0B0E14] shadow-md shadow-[#CDE06A]/20"
                    : "bg-[#161B26] text-[#8F9CAE] hover:text-white hover:bg-[#1D2332] border border-[#262D3D]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. GETTING STARTED */}
      {activeTab === "getting-started" && (
        <div className="space-y-8 animate-fade-in text-sm text-[#8F9CAE]">
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#CDE06A]" />
              <span>What is Slyz?</span>
            </h2>
            <p className="leading-relaxed">
              <strong>Slyz</strong> is a non-custodial thematic investment protocol engineered for Solana. Instead of
              manually researching individual tickers, calculating dollar distributions, and submitting dozens of isolated
              swap transactions across decentralized liquidity pools, Slyz allows you to pick an investment theme
              (e.g., Artificial Intelligence, Mega-Cap Tech, or Private Pre-IPO Frontier) and fund the entire basket in a
              single dollar amount with USDC.
            </p>
            <p className="leading-relaxed">
              All tokens purchased through Slyz reside directly in your own Solana wallet as standard Token-2022
              accounts. You retain 100% custody, complete transferability, and the ability to exit into USDC at any moment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-[#161B26] border border-[#262D3D] p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#CDE06A]/10 text-[#CDE06A] font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-white">Connect a Solana Wallet</h3>
              <p className="text-xs leading-relaxed">
                Connect using Phantom, Solflare, Backpack, or any Wallet Standard browser extension. On mobile phones, connect
                via the Mobile Wallet Adapter or QR-code relay powered by Reown Cloud.
              </p>
            </div>

            <div className="rounded-xl bg-[#161B26] border border-[#262D3D] p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#8D8AFF]/10 text-[#8D8AFF] font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-white">Fund USDC & SOL</h3>
              <p className="text-xs leading-relaxed">
                Ensure your wallet has <strong className="text-white">USDC</strong> (the base quote currency for all swaps)
                and at least <strong className="text-white">0.015 SOL</strong> to pay for Solana transaction fees and rent-exempt
                Token-2022 account allocations.
              </p>
            </div>

            <div className="rounded-xl bg-[#161B26] border border-[#262D3D] p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-white">Select a Pie & Invest</h3>
              <p className="text-xs leading-relaxed">
                Choose an expert-curated basket on the Dashboard or assemble 2–4 stocks in the Custom Studio. Review the
                target weights, click Invest, and approve the sequential multi-leg signatures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. DUAL-SLEEVE ARCHITECTURE */}
      {activeTab === "architecture" && (
        <div className="space-y-8 animate-fade-in text-sm text-[#8F9CAE]">
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#CDE06A]" />
              <span>Dual-Sleeve Token-2022 Architecture</span>
            </h2>
            <p className="leading-relaxed">
              Slyz is architected around two complementary tokenized asset shelves, each engineered with distinct decimal
              precision and regulatory structures on Solana:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Sleeve A */}
              <div className="rounded-xl bg-[#0B0E14] border border-[#262D3D] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#CDE06A] uppercase tracking-wider">
                    Sleeve A: Public Equities (xStocks)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#CDE06A]">
                    8 Decimals
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Backed Finance tokenized certificates tracking US equities (NVDA, AAPL, MSFT, TSLA, AMZN, META, GOOGL,
                  SPY, QQQ, COIN).
                </p>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-[#8F9CAE]">
                  <li>Issued under Swiss DLT act with collateral held in custody.</li>
                  <li>Deep on-chain liquidity routed across Raydium and Orca.</li>
                  <li>24/7 continuous trading on Solana Mainnet.</li>
                </ul>
              </div>

              {/* Sleeve B */}
              <div className="rounded-xl bg-[#0B0E14] border border-[#262D3D] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Sleeve B: Private Pre-IPO (PreStocks)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    9 Decimals
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Decentralized economic tracking tokens for high-valuation private technology companies (OpenAI, Anthropic,
                  SpaceX).
                </p>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-[#8F9CAE]">
                  <li>Raw base-unit string accounting to prevent decimal dust.</li>
                  <li>Pre-set investments capped at $25 to avoid market impact.</li>
                  <li>Automated &lt; 5% price impact safety blocks on execution.</li>
                  <li>Provides economic exposure only; not corporate equity or voting stock.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upstream Proxy Architecture */}
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#8D8AFF]" />
              <span>Same-Origin Server Proxy & 3-Tier Offline Resilience</span>
            </h3>
            <p className="text-xs leading-relaxed">
              Because the upstream PreStocks API does not provide browser CORS headers, Slyz deploys a dedicated server-side
              proxy at <code className="text-white bg-[#0B0E14] px-1.5 py-0.5 rounded">/api/prestocks</code> with 60-second
              ISR caching.
            </p>
            <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4" />
                <span>Tier 1: Live Server Proxy</span>
              </div>
              <p className="text-[11px] text-[#8F9CAE]">
                Client polls <code className="text-slate-300">/api/prestocks</code> every 30 seconds for live token price,
                mark valuation, and implied market cap.
              </p>

              <div className="flex items-center gap-2 text-[#8D8AFF] font-bold pt-1">
                <Check className="w-4 h-4" />
                <span>Tier 2: LocalStorage Snapshot</span>
              </div>
              <p className="text-[11px] text-[#8F9CAE]">
                Every successful payload is cached in browser storage (<code className="text-slate-300">slyz_prestocks_last_payload</code>)
                so brief network dropouts never cause empty displays.
              </p>

              <div className="flex items-center gap-2 text-[#CDE06A] font-bold pt-1">
                <Check className="w-4 h-4" />
                <span>Tier 3: Authentic Baseline</span>
              </div>
              <p className="text-[11px] text-[#8F9CAE]">
                Offline first-time visitors automatically load verified official contract baseline records without artificial
                numbers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROTOCOL MECHANICS */}
      {activeTab === "mechanics" && (
        <div className="space-y-8 animate-fade-in text-sm text-[#8F9CAE]">
          {/* Sequential Swap Engine */}
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#CDE06A]" />
                <span>Sequential Swap Execution Engine</span>
              </h2>
              <span className="text-[10px] font-mono font-bold text-[#CDE06A]">
                MTU Optimization
              </span>
            </div>
            <p className="leading-relaxed">
              Standard Solana transactions have a strict Maximum Transmission Unit (MTU) packet limit of 1,232 bytes.
              Attempting to bundle 3 to 4 complex multi-DEX swap routes into a single transaction causes execution failures,
              oversized compute budget violations, and instruction drops.
            </p>
            <p className="leading-relaxed">
              Slyz solves this by deploying a sequential transaction queue. Each leg of your basket is quoted, simulated,
              signed, and confirmed in sequence through Jupiter Unified Lite API. If any leg fails or experiences unexpected
              slippage, previous legs remain safe and successful in your wallet, and you can retry the isolated leg with a
              single click.
            </p>
          </div>

          {/* Smart Top-Up Rebalancing */}
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#8D8AFF]" />
              <span>Smart Top-Up Rebalancing (Water-Filling Algorithm)</span>
            </h2>
            <p className="leading-relaxed">
              Traditional index rebalancing forces you to sell overweight assets to purchase underweight ones. This triggers
              unfavorable capital gains tax events, incurs double trading fees, and wastes capital on slippage.
            </p>
            <p className="leading-relaxed">
              Slyz introduces an innovative <strong>Smart Top-Up Rebalancer</strong> based on a water-filling allocation
              algorithm:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
                <span className="text-xs font-bold text-white block">0% Sell Fees</span>
                <p className="text-[11px]">
                  You never sell existing tokens. 100% of new deposits are directed into underweight assets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
                <span className="text-xs font-bold text-white block">Zero Tax Events</span>
                <p className="text-[11px]">
                  Because no profitable positions are liquidated, rebalancing does not trigger taxable dispositions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
                <span className="text-xs font-bold text-white block">Automated Drift Repair</span>
                <p className="text-[11px]">
                  The algorithm calculates exactly how much capital each underweight leg requires to return to target
                  equilibrium.
                </p>
              </div>
            </div>
          </div>

          {/* Liquidation Engine */}
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <span>Exit to USDC Liquidation</span>
            </h2>
            <p className="leading-relaxed">
              Slyz ensures frictionless liquidity. On your Portfolio page, each basket includes an <strong>Exit to USDC</strong> action.
              Selecting this triggers reverse sequential swaps, selling 100% (or partial portions) of your held tokenized
              shares directly back into USDC in your wallet.
            </p>
          </div>
        </div>
      )}

      {/* 4. THEMATIC BASKETS */}
      {activeTab === "baskets" && (
        <div className="space-y-6 animate-fade-in text-sm text-[#8F9CAE]">
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#CDE06A]" />
              <span>Curated Thematic Baskets</span>
            </h2>
            <p className="text-xs text-slate-300">
              Each basket is programmatically constructed around verified macro themes and algorithmic weights:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CURATED_BASKETS.map((basket) => (
              <div
                key={basket.id}
                className="rounded-xl bg-[#161B26] border border-[#262D3D] p-5 space-y-3 hover:border-[#8D8AFF]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: `${basket.themeColor}15`, color: basket.themeColor }}
                    >
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{basket.name}</h3>
                      <span className="text-[10px] text-[#CDE06A] uppercase font-bold tracking-wider">
                        {basket.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE]">
                    {basket.market === "private" ? "PreStocks Shelf" : "xStocks Shelf"}
                  </span>
                </div>

                <p className="text-xs text-[#8F9CAE] leading-relaxed">
                  {basket.description}
                </p>

                <div className="pt-2 border-t border-[#262D3D]/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block">
                    Basket Composition:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {basket.components.map((c) => (
                      <span
                        key={c.symbol}
                        className="px-2 py-1 rounded bg-[#0B0E14] border border-[#262D3D] text-[11px] font-mono font-semibold text-slate-300"
                      >
                        {c.symbol} <strong className="text-[#CDE06A]">{c.targetWeight}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. VERIFIED TOKEN DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-6 animate-fade-in text-sm text-[#8F9CAE]">
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#CDE06A]" />
                  <span>Verified On-Chain Contract Registry</span>
                </h2>
                <p className="text-xs text-slate-300 pt-1">
                  All official SPL Token-2022 mint addresses on Solana Mainnet-Beta. Never trade unverified token contracts.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F9CAE]" />
                <input
                  type="text"
                  placeholder="Filter by symbol or mint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-xs text-white placeholder-[#8F9CAE] focus:outline-none focus:border-[#CDE06A]"
                />
              </div>
            </div>

            {/* Base Currency Reference */}
            <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Base Input Currency:</span>
                <span className="text-[#CDE06A] font-mono">Native USDC (6 Decimals)</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-[#8F9CAE] hidden sm:inline">
                  {USDC_MINT}
                </code>
                <button
                  onClick={() => copyToClipboard(USDC_MINT)}
                  className="p-1 rounded bg-[#161B26] hover:text-white border border-[#262D3D] text-[11px] flex items-center gap-1"
                >
                  {copiedMint === USDC_MINT ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Token Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#262D3D] rounded-xl overflow-hidden">
                <thead className="bg-[#0B0E14] text-white uppercase text-[10px] font-bold border-b border-[#262D3D]">
                  <tr>
                    <th className="p-3">Asset</th>
                    <th className="p-3">Shelf</th>
                    <th className="p-3">Decimals</th>
                    <th className="p-3">Mint Address</th>
                    <th className="p-3 text-right">Explorer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262D3D] text-slate-300">
                  {filteredStocks.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-[#1D2332]/50 transition-colors">
                      <td className="p-3 flex items-center gap-2">
                        <img
                          src={stock.logo}
                          alt={stock.symbol}
                          className="w-5 h-5 rounded-full object-contain bg-white/5"
                        />
                        <div>
                          <span className="font-bold text-white block">{stock.symbol}</span>
                          <span className="text-[10px] text-[#8F9CAE]">{stock.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            stock.issuer === "xstocks"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {stock.issuer === "xstocks" ? "Public Equities" : "PreStocks"}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{stock.decimals}</td>
                      <td className="p-3 font-mono text-[11px] text-[#8F9CAE]">
                        <div className="flex items-center gap-2">
                          <span>
                            {stock.mint.slice(0, 6)}...{stock.mint.slice(-6)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(stock.mint)}
                            className="p-1 rounded hover:bg-[#262D3D] transition-colors"
                            title="Copy full mint address"
                          >
                            {copiedMint === stock.mint ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={`https://solscan.io/token/${stock.mint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#8D8AFF] hover:underline"
                        >
                          <span>Solscan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. ANTI-PHISHING & SAFETY */}
      {activeTab === "safety" && (
        <div className="space-y-6 animate-fade-in text-sm text-[#8F9CAE]">
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Anti-Phishing & Wallet Safety Protocol</span>
            </h2>
            <p className="leading-relaxed">
              In decentralized finance, security is an active partnership between protocol design and personal custody
              hygiene. Please adhere to these strict verification standards:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#0B0E14] border border-rose-500/20 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  What Slyz Will NEVER Do
                </span>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-300">
                  <li>Never request your private keys or seed phrase under any circumstance.</li>
                  <li>Never ask you to transfer funds to a “support” or “deposit” address.</li>
                  <li>Never direct-message (DM) you first on Discord, Telegram, or Twitter.</li>
                  <li>Never prompt for arbitrary token approval or permit signatures unrelated to Jupiter swaps.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0E14] border border-emerald-500/20 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Best Security Practices
                </span>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-300">
                  <li>Always verify the URL in your browser address bar: <strong className="text-white">useslyz.vercel.app</strong>.</li>
                  <li>Bookmark the official link and never click unverified search ads.</li>
                  <li>Cross-reference token mint addresses against our Verified Contract Directory.</li>
                  <li>Review transaction simulation outputs in Phantom or Solflare before approving.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
