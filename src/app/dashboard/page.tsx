"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Layers,
  Sliders,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Plus,
  Trash2,
  PieChart as PieIcon,
  Search,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  DollarSign,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import {
  CURATED_BASKETS,
  VERIFIED_STOCKS,
  Basket,
  BasketComponent,
  MIN_SOL_BALANCE,
} from "@/lib/constants";
import { getJupiterPrices, TokenPriceInfo } from "@/lib/jupiter";
import { fetchUserBalances, UserBalances } from "@/lib/solana";
import { DonutChart, DONUT_COLORS } from "@/components/DonutChart";
import { ExecutionModal } from "@/components/ExecutionModal";
import { ThemeMultiStockChart } from "@/components/ThemeMultiStockChart";

export default function DashboardPage() {
  const wallet = useWallet();

  // Active Tab: 'curated' | 'catalog' | 'custom'
  const [activeTab, setActiveTab] = useState<"curated" | "catalog" | "custom">("curated");

  // Selected Theme for Real-Time 3-Stock Chart & Featured Spotlight
  const [selectedThemeId, setSelectedThemeId] = useState<string>("mag-3");
  const selectedTheme =
    CURATED_BASKETS.find((b) => b.id === selectedThemeId) || CURATED_BASKETS[0];

  // Custom Investment Amounts & Clear Validation Errors (No fixed $100)
  const [featuredAmount, setFeaturedAmount] = useState<number>(50);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  const [cardAmounts, setCardAmounts] = useState<Record<string, number>>({
    "mag-3": 50,
    "the-index": 50,
    "ai-frontier": 50,
    "high-beta": 50,
    "big-commerce": 50,
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string | null>>({});

  // Prices & Balances
  const [prices, setPrices] = useState<Record<string, TokenPriceInfo>>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [balances, setBalances] = useState<UserBalances>({
    solBalance: 0,
    usdcBalance: 0,
    token2022Balances: {},
    token2022RawAmounts: {},
    hasSufficientGas: false,
  });

  // Search filter for stocks & themes
  const [searchQuery, setSearchQuery] = useState("");

  // Performance Chart Timeframe
  const [chartTimeframe, setChartTimeframe] = useState<"24H" | "7D" | "30D" | "1Y">("30D");

  // Investment Modal State
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [modalBasket, setModalBasket] = useState<{
    id: string;
    name: string;
    totalAmountUsd: number;
    legs: { symbol: string; amountUsd: number }[];
  } | null>(null);

  // Weight Customization Modal State (for any Curated Theme or Custom Basket)
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<{
    id: string;
    name: string;
    components: BasketComponent[];
    depositUsd: number;
  } | null>(null);

  // Custom Studio State
  const [customName, setCustomName] = useState("My Tech Core");
  const [customComponents, setCustomComponents] = useState<BasketComponent[]>([
    { symbol: "NVDAx", targetWeight: 40 },
    { symbol: "AAPLx", targetWeight: 30 },
    { symbol: "MSFTx", targetWeight: 30 },
  ]);
  const [customDepositUsd, setCustomDepositUsd] = useState<number>(100);

  // Copy notification state
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  // Load live Jupiter prices
  useEffect(() => {
    let isMounted = true;
    const loadPrices = async () => {
      try {
        const p = await getJupiterPrices();
        if (isMounted) {
          setPrices(p);
          setLoadingPrices(false);
        }
      } catch (err) {
        console.error("Failed to load Jupiter prices:", err);
        if (isMounted) setLoadingPrices(false);
      }
    };
    loadPrices();
    const interval = setInterval(loadPrices, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch balances when wallet connects
  useEffect(() => {
    let isMounted = true;
    if (wallet.connected && wallet.publicKey) {
      fetchUserBalances(wallet.publicKey).then((b) => {
        if (isMounted) setBalances(b);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [wallet.connected, wallet.publicKey]);

  // Copy mint address helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMint(text);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  // Auto-rebalance weights proportionally for an arbitrary component array
  const handleWeightChange = (
    componentsList: BasketComponent[],
    index: number,
    newWeight: number,
    setter: (comps: BasketComponent[]) => void
  ) => {
    const clampedWeight = Math.max(5, Math.min(90, newWeight));
    const targetOthers = 100 - clampedWeight;
    const otherIndices = componentsList.map((_, i) => i).filter((i) => i !== index);

    if (otherIndices.length === 0) return;

    const currentOthersSum = otherIndices.reduce(
      (sum, i) => sum + componentsList[i].targetWeight,
      0
    );

    const updated = [...componentsList];
    updated[index] = { ...updated[index], targetWeight: clampedWeight };

    if (currentOthersSum > 0) {
      let allocated = 0;
      otherIndices.forEach((otherIdx, pos) => {
        if (pos === otherIndices.length - 1) {
          updated[otherIdx] = {
            ...updated[otherIdx],
            targetWeight: Math.max(5, targetOthers - allocated),
          };
        } else {
          const prop = Math.round(
            (componentsList[otherIdx].targetWeight / currentOthersSum) * targetOthers
          );
          const weight = Math.max(5, prop);
          allocated += weight;
          updated[otherIdx] = { ...updated[otherIdx], targetWeight: weight };
        }
      });
    } else {
      const split = Math.floor(targetOthers / otherIndices.length);
      otherIndices.forEach((otherIdx, pos) => {
        updated[otherIdx] = {
          ...updated[otherIdx],
          targetWeight:
            pos === otherIndices.length - 1
              ? targetOthers - split * (otherIndices.length - 1)
              : split,
        };
      });
    }

    setter(updated);
  };

  // Equalize weights evenly across components
  const equalizeWeights = (
    componentsList: BasketComponent[],
    setter: (comps: BasketComponent[]) => void
  ) => {
    if (!componentsList.length) return;
    const count = componentsList.length;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    setter(
      componentsList.map((c, i) => ({
        ...c,
        targetWeight: i === 0 ? base + remainder : base,
      }))
    );
  };

  // Launch validated investment for a curated theme
  const handleInvestWithValidation = (basket: Basket, amount: number, isFeatured: boolean = false) => {
    const setError = (msg: string | null) => {
      if (isFeatured) {
        setFeaturedError(msg);
      } else {
        setCardErrors((prev) => ({ ...prev, [basket.id]: msg }));
      }
    };

    setError(null);

    // 1. Check wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your Solana wallet first.");
      return;
    }

    // 2. Validate amount number
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter an investment amount greater than $0.");
      return;
    }

    // 3. Minimum amount constraint
    if (amount < 5) {
      setError("Minimum investment is $5 USDC ($1 minimum per stock leg for Jupiter routing).");
      return;
    }

    // 4. USDC wallet balance check
    if (amount > balances.usdcBalance) {
      setError(
        `Insufficient USDC. You entered $${amount.toFixed(2)} but your wallet has $${balances.usdcBalance.toFixed(2)} USDC available.`
      );
      return;
    }

    // 5. SOL gas balance check
    if (balances.solBalance < MIN_SOL_BALANCE) {
      setError(
        `Low SOL balance for fees. You have ${balances.solBalance.toFixed(4)} SOL (at least ${MIN_SOL_BALANCE} SOL is required for network gas & Token-2022 account rent).`
      );
      return;
    }

    // 6. Build execution legs
    const legs = basket.components
      .map((c) => ({
        symbol: c.symbol,
        amountUsd: Math.round(((c.targetWeight / 100) * amount) * 100) / 100,
      }))
      .filter((l) => l.amountUsd >= 1);

    if (legs.length === 0) {
      setError("Allocation resulted in legs under $1. Please increase your deposit amount.");
      return;
    }

    setModalBasket({
      id: basket.id,
      name: basket.name,
      totalAmountUsd: amount,
      legs,
    });
    setIsExecutionModalOpen(true);
  };

  // Open weight customizer for a curated theme
  const openWeightCustomizer = (basket: Basket) => {
    setEditingTheme({
      id: basket.id,
      name: basket.name,
      components: [...basket.components],
      depositUsd: 100,
    });
    setIsWeightModalOpen(true);
  };

  // Execute customized theme investment
  const handleExecuteCustomizedTheme = () => {
    if (!editingTheme) return;
    const legs = editingTheme.components
      .map((c) => ({
        symbol: c.symbol,
        amountUsd: Math.round(((c.targetWeight / 100) * editingTheme.depositUsd) * 100) / 100,
      }))
      .filter((l) => l.amountUsd >= 1);

    setModalBasket({
      id: `${editingTheme.id}-customized`,
      name: `${editingTheme.name} (Custom)`,
      totalAmountUsd: editingTheme.depositUsd,
      legs,
    });
    setIsWeightModalOpen(false);
    setIsExecutionModalOpen(true);
  };

  // Add stock from catalog to custom studio
  const addStockToCustomStudio = (symbol: string) => {
    if (customComponents.length >= 4) return;
    if (customComponents.some((c) => c.symbol === symbol)) return;
    const nextList = [...customComponents, { symbol, targetWeight: 20 }];
    equalizeWeights(nextList, setCustomComponents);
    setActiveTab("custom");
  };

  // Filter stocks and curated pies
  const verifiedStocksList = Object.values(VERIFIED_STOCKS).filter((stock) => {
    const q = searchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(q) ||
      stock.underlying.toLowerCase().includes(q) ||
      stock.category.toLowerCase().includes(q)
    );
  });

  const curatedBasketsList = CURATED_BASKETS.filter((basket) => {
    const q = searchQuery.toLowerCase();
    return (
      basket.name.toLowerCase().includes(q) ||
      basket.description.toLowerCase().includes(q) ||
      basket.components.some((c) => c.symbol.toLowerCase().includes(q))
    );
  });

  // Donut data for custom studio
  const customDonutData = customComponents.map((c, idx) => ({
    name: VERIFIED_STOCKS[c.symbol]?.underlying || c.symbol,
    value: c.targetWeight,
    color: DONUT_COLORS[idx % DONUT_COLORS.length],
    usdAmount: (c.targetWeight / 100) * customDepositUsd,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Terminal Investor Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#262D3D]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="pill-badge pill-badge-lime">Terminal v1.0</span>
            <span className="text-xs text-[#8F9CAE] font-medium">Solana Mainnet</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {wallet.connected && wallet.publicKey
              ? `Welcome back, ${wallet.publicKey.toBase58().slice(0, 4)}..${wallet.publicKey.toBase58().slice(-4)}`
              : "Welcome to Slyz Terminal"}
          </h1>
          <p className="text-xs text-[#8F9CAE]">
            Curated equity baskets, on-chain fractional shares, and dynamic weight customization.
          </p>
        </div>

        {/* Quick Stat Metric Badges (Resq.io Style) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-[#161B26] border border-[#262D3D] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-[#CDE06A]/10 border border-[#CDE06A]/20 flex items-center justify-center text-[#CDE06A] font-black text-xs">
              10
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8F9CAE] block">Verified Equities</span>
              <span className="text-xs font-black text-white font-mono block">24/7 xStocks</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#161B26] border border-[#262D3D] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-[#8D8AFF]/10 border border-[#8D8AFF]/20 flex items-center justify-center text-[#8D8AFF] font-black text-xs">
              5
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8F9CAE] block">Curated Themes</span>
              <span className="text-xs font-black text-white font-mono block">Multi-Asset Pies</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#161B26] border border-[#262D3D] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xs">
              ~3.2s
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8F9CAE] block">Jupiter Speed</span>
              <span className="text-xs font-black text-[#CDE06A] font-mono block">Sequential Fills</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Bento Row: Real-Time 3-Stock Curve & Selected Theme Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Real-Time 3-Stock Trend Curve */}
        <div className="lg:col-span-8 bento-card">
          <ThemeMultiStockChart
            basket={selectedTheme}
            prices={prices}
            timeframe={chartTimeframe}
            onTimeframeChange={setChartTimeframe}
          />
        </div>

        {/* Right: Featured Theme Spotlight Card (Synced with Selected Theme) */}
        <div className="lg:col-span-4 rounded-[22px] bg-gradient-to-br from-[#1E2536] via-[#161B26] to-[#0F131D] border border-[#262D3D] p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#CDE06A]/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-[#CDE06A]/15 text-[#CDE06A] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Featured Theme
              </span>
              <div className="w-7 h-7 rounded-full bg-[#262D3D] flex items-center justify-center text-white">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-white">{selectedTheme.name}</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              {selectedTheme.description}
            </p>

            {/* Asset distribution preview */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {selectedTheme.components.map((c) => {
                const asset = VERIFIED_STOCKS[c.symbol];
                const priceInfo = asset ? prices[asset.mint] : undefined;
                return (
                  <div
                    key={c.symbol}
                    className="p-2 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] text-center"
                  >
                    <span className="text-[10px] text-[#8F9CAE] block font-bold">
                      {asset?.underlying || c.symbol}
                    </span>
                    <span className="text-xs font-black text-white block">{c.targetWeight}%</span>
                    <span className="text-[10px] font-mono text-[#CDE06A] block mt-0.5">
                      {priceInfo ? `$${priceInfo.usdPrice.toFixed(2)}` : "..."}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 space-y-3 relative z-10">
            {/* Wallet-driven amount input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[11px] font-semibold text-[#8F9CAE]">Investment Amount</label>
                <span className="text-[11px] font-mono text-[#8F9CAE]">
                  Wallet: ${balances.usdcBalance.toFixed(2)} USDC
                </span>
              </div>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-[#8F9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={5}
                  placeholder="50"
                  value={featuredAmount || ""}
                  onChange={(e) => {
                    setFeaturedAmount(Number(e.target.value));
                    if (featuredError) setFeaturedError(null);
                  }}
                  className="w-full pl-8 pr-14 py-2.5 bg-[#0B0E14] border border-[#262D3D] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#CDE06A]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFeaturedAmount(Math.floor(balances.usdcBalance));
                    if (featuredError) setFeaturedError(null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#CDE06A] px-2 py-0.5 rounded bg-[#CDE06A]/10 hover:bg-[#CDE06A]/20"
                >
                  MAX
                </button>
              </div>

              {featuredError && (
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{featuredError}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleInvestWithValidation(selectedTheme, featuredAmount, true)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-xs !py-3 shadow-lg"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Invest in {selectedTheme.name}</span>
            </button>
            <button
              onClick={() => openWeightCustomizer(selectedTheme)}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-xs !py-2.5 text-[#8F9CAE] hover:text-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8D8AFF]" />
              <span>Customize Asset Percentages</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Segmented Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        {/* Navigation Tabs */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#161B26] border border-[#262D3D] self-start">
          <button
            onClick={() => setActiveTab("curated")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "curated"
                ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Theme Pies ({CURATED_BASKETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "catalog"
                ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>All Verified Stocks (10)</span>
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "custom"
                ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Slyz Studio</span>
          </button>
        </div>

        {/* Search Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#8F9CAE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks or themes..."
            className="w-full pl-10 pr-4 py-2 bg-[#161B26] border border-[#262D3D] rounded-xl text-xs text-white placeholder-[#8F9CAE] focus:outline-none focus:border-[#CDE06A] transition-colors"
          />
        </div>
      </div>

      {/* 4. Tab 1: Curated Theme Pies */}
      {activeTab === "curated" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curatedBasketsList.map((basket) => {
              const isSelected = basket.id === selectedThemeId;
              const cardAmt = cardAmounts[basket.id] ?? 50;
              const cardErr = cardErrors[basket.id];

              return (
                <div
                  key={basket.id}
                  onClick={() => setSelectedThemeId(basket.id)}
                  className={`bento-card flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#CDE06A] ring-1 ring-[#CDE06A]/40 shadow-xl shadow-[#CDE06A]/5"
                      : "hover:border-[#8D8AFF]/40"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-[#1D2332] text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                        {basket.category}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#CDE06A]/20 text-[#CDE06A]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active in Chart</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#8F9CAE] group-hover:text-white transition-colors">
                          <TrendingUp className="w-3 h-3 text-[#CDE06A]" />
                          <span>Click to View in Chart</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">{basket.name}</h3>
                      <p className="text-xs text-[#8F9CAE] mt-1 line-clamp-2 leading-relaxed">
                        {basket.description}
                      </p>
                    </div>

                    {/* Components breakdown with live prices */}
                    <div className="space-y-2 pt-2 border-t border-[#262D3D]">
                      {basket.components.map((c) => {
                        const asset = VERIFIED_STOCKS[c.symbol];
                        const priceInfo = asset ? prices[asset.mint] : undefined;
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
                              <span className="font-bold text-white">{asset?.underlying || c.symbol}</span>
                              <span className="text-[10px] text-[#8F9CAE]">
                                {priceInfo ? `$${priceInfo.usdPrice.toFixed(2)}` : "..."}
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

                  <div className="pt-4 mt-4 border-t border-[#262D3D] space-y-3" onClick={(e) => e.stopPropagation()}>
                    {/* Wallet-driven custom amount input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8F9CAE]">USDC Amount</span>
                        <span className="font-mono text-[#8F9CAE]">
                          Wallet: ${balances.usdcBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-[#8F9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min={5}
                          placeholder="50"
                          value={cardAmt || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCardAmounts((prev) => ({ ...prev, [basket.id]: val }));
                            if (cardErrors[basket.id]) {
                              setCardErrors((prev) => ({ ...prev, [basket.id]: null }));
                            }
                          }}
                          className="w-full pl-8 pr-14 py-2 bg-[#0B0E14] border border-[#262D3D] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#CDE06A]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCardAmounts((prev) => ({
                              ...prev,
                              [basket.id]: Math.floor(balances.usdcBalance),
                            }));
                            if (cardErrors[basket.id]) {
                              setCardErrors((prev) => ({ ...prev, [basket.id]: null }));
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#CDE06A] px-2 py-0.5 rounded bg-[#CDE06A]/10 hover:bg-[#CDE06A]/20"
                        >
                          MAX
                        </button>
                      </div>

                      {cardErr && (
                        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{cardErr}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleInvestWithValidation(basket, cardAmt, false)}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-xs !py-3"
                    >
                      <span>Invest in {basket.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openWeightCustomizer(basket)}
                      className="btn-secondary w-full flex items-center justify-center gap-2 text-xs !py-2 text-[#8F9CAE] hover:text-white"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#8D8AFF]" />
                      <span>Customize Weights</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Available Stocks Catalog (All 10 Verified xStocks) */}
      {activeTab === "catalog" && (
        <div className="bento-card overflow-hidden !p-0">
          <div className="p-6 border-b border-[#262D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">All Verified xStock Equities</h2>
              <p className="text-xs text-[#8F9CAE] mt-0.5">
                Token-2022 US equities trading 24/7 on Solana with Jupiter routing.
              </p>
            </div>
            <span className="pill-badge pill-badge-lime self-start sm:self-auto">
              10 Verified Mints
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1D2332]/60 text-[#8F9CAE] uppercase font-bold text-[10px] tracking-wider border-b border-[#262D3D]">
                <tr>
                  <th className="px-6 py-3.5">Asset</th>
                  <th className="px-6 py-3.5">Underlying</th>
                  <th className="px-6 py-3.5">Live Price</th>
                  <th className="px-6 py-3.5">Mint Address</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262D3D] text-white font-medium">
                {verifiedStocksList.map((stock) => {
                  const price = prices[stock.mint]?.usdPrice;
                  return (
                    <tr key={stock.symbol} className="hover:bg-[#1D2332]/40 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <Image
                          src={stock.logo}
                          alt={stock.symbol}
                          width={28}
                          height={28}
                          className="rounded-full bg-white/10"
                        />
                        <div>
                          <span className="font-extrabold text-sm block">{stock.symbol}</span>
                          <span className="text-[10px] text-[#8F9CAE] block">xStock Token-2022</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#8F9CAE] font-semibold">{stock.underlying}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-[#CDE06A]">
                        {price ? `$${price.toFixed(2)}` : "Loading..."}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-[#8F9CAE]">
                        <div className="flex items-center gap-2">
                          <span>
                            {stock.mint.slice(0, 4)}..{stock.mint.slice(-4)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(stock.mint)}
                            className="p-1 rounded hover:bg-[#262D3D] transition-colors"
                            title="Copy Mint"
                          >
                            {copiedMint === stock.mint ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#CDE06A]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-[#8F9CAE]" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => addStockToCustomStudio(stock.symbol)}
                          className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 ml-auto hover:border-[#CDE06A] hover:text-[#CDE06A]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Custom Pie</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Custom Slyz Studio */}
      {activeTab === "custom" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Custom Sliders & Numeric Inputs */}
          <div className="lg:col-span-7 bento-card space-y-6">
            <div className="flex items-center justify-between border-b border-[#262D3D] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Custom Pie Builder</h3>
                <p className="text-xs text-[#8F9CAE]">
                  Select 2 to 4 verified stocks and customize your exact percentage allocation.
                </p>
              </div>
              <button
                onClick={() => equalizeWeights(customComponents, setCustomComponents)}
                className="btn-secondary text-xs !py-1.5 !px-3 text-[#8D8AFF] border-[#8D8AFF]/40 hover:bg-[#8D8AFF]/10"
              >
                Equalize Weights
              </button>
            </div>

            {/* Component Sliders with Direct Numeric Inputs */}
            <div className="space-y-4">
              {customComponents.map((c, index) => {
                const asset = VERIFIED_STOCKS[c.symbol];
                const price = asset ? prices[asset.mint]?.usdPrice : undefined;
                const legDollar = (c.targetWeight / 100) * customDepositUsd;
                return (
                  <div
                    key={c.symbol}
                    className="p-4 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {asset?.logo && (
                          <Image
                            src={asset.logo}
                            alt={c.symbol}
                            width={24}
                            height={24}
                            className="rounded-full bg-white/10"
                          />
                        )}
                        <div>
                          <span className="font-bold text-sm text-white block">{asset?.underlying || c.symbol}</span>
                          <span className="text-[10px] text-[#8F9CAE] block">
                            {price ? `$${price.toFixed(2)}` : "..."} • ${legDollar.toFixed(2)} USDC
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Direct Numeric Input */}
                        <div className="flex items-center gap-1 bg-[#1D2332] px-2.5 py-1 rounded-lg border border-[#262D3D]">
                          <input
                            type="number"
                            min={5}
                            max={90}
                            value={c.targetWeight}
                            onChange={(e) =>
                              handleWeightChange(
                                customComponents,
                                index,
                                Number(e.target.value) || 5,
                                setCustomComponents
                              )
                            }
                            className="w-10 bg-transparent text-right font-mono font-bold text-sm text-white focus:outline-none"
                          />
                          <span className="text-xs text-[#8F9CAE] font-bold">%</span>
                        </div>

                        {/* Remove Button */}
                        {customComponents.length > 2 && (
                          <button
                            onClick={() => {
                              const nextList = customComponents.filter((_, i) => i !== index);
                              equalizeWeights(nextList, setCustomComponents);
                            }}
                            className="p-1.5 rounded-lg text-[#8F9CAE] hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Proportional Range Slider */}
                    <input
                      type="range"
                      min={5}
                      max={90}
                      value={c.targetWeight}
                      onChange={(e) =>
                        handleWeightChange(
                          customComponents,
                          index,
                          Number(e.target.value),
                          setCustomComponents
                        )
                      }
                      className="w-full accent-[#CDE06A] cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Add Asset Selector (if < 4) */}
            {customComponents.length < 4 && (
              <div className="pt-2">
                <span className="text-xs text-[#8F9CAE] font-semibold block mb-2">
                  Add Stock to Basket:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(VERIFIED_STOCKS)
                    .filter((sym) => !customComponents.some((c) => c.symbol === sym))
                    .map((sym) => (
                      <button
                        key={sym}
                        onClick={() => addStockToCustomStudio(sym)}
                        className="px-3 py-1.5 rounded-xl bg-[#1D2332] border border-[#262D3D] text-xs font-bold text-[#8F9CAE] hover:text-white hover:border-[#CDE06A] transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-[#CDE06A]" />
                        <span>{sym}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Allocation Donut & Launch Trigger */}
          <div className="lg:col-span-5 bento-card space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-[#262D3D] pb-3">
              Target Allocation Preview
            </h3>

            <div className="flex justify-center py-4">
              <DonutChart
                data={customDonutData}
                height={240}
                centerLabel={`$${customDepositUsd}`}
                centerSublabel="Total USDC"
              />
            </div>

            {/* Deposit Amount Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-[#8F9CAE] block">
                Total USDC Investment Amount
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#8F9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={10}
                  value={customDepositUsd}
                  onChange={(e) => setCustomDepositUsd(Math.max(10, Number(e.target.value)))}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0B0E14] border border-[#262D3D] rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-[#CDE06A]"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const legs = customComponents
                  .map((c) => ({
                    symbol: c.symbol,
                    amountUsd:
                      Math.round(((c.targetWeight / 100) * customDepositUsd) * 100) / 100,
                  }))
                  .filter((l) => l.amountUsd >= 1);

                setModalBasket({
                  id: "custom-slyz",
                  name: customName,
                  totalAmountUsd: customDepositUsd,
                  legs,
                });
                setIsExecutionModalOpen(true);
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-xs !py-3.5 shadow-xl"
            >
              <Zap className="w-4 h-4" />
              <span>Invest in Custom Pie (${customDepositUsd} USDC)</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Bottom Bento Row: Terminal Quick Assistant (Resq.io Style) */}
      <div className="rounded-[24px] bg-[#161B26] border border-[#262D3D] p-6 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262D3D] pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Slyz Quick Actions & Assistant</span>
              <span className="w-2 h-2 rounded-full bg-[#CDE06A]" />
            </h3>
            <p className="text-xs text-[#8F9CAE]">
              One-click portfolio balancing, smart top-up rebalancing, and instant liquidation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <Link
            href="/portfolio"
            className="p-4 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] hover:border-[#CDE06A] transition-all group"
          >
            <Zap className="w-5 h-5 text-[#CDE06A] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white">Smart Top-Up</h4>
            <p className="text-[11px] text-[#8F9CAE] mt-1">
              Add capital directed strictly to underweight assets with zero taxable sales.
            </p>
          </Link>

          <Link
            href="/portfolio"
            className="p-4 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] hover:border-[#8D8AFF] transition-all group"
          >
            <PieIcon className="w-5 h-5 text-[#8D8AFF] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white">Portfolio Drift Tracker</h4>
            <p className="text-[11px] text-[#8F9CAE] mt-1">
              Inspect real-time on-chain Token-2022 holdings and target vs current weights.
            </p>
          </Link>

          <button
            onClick={() => setActiveTab("custom")}
            className="p-4 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] hover:border-white transition-all text-left group"
          >
            <Sliders className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white">Build Custom Pie</h4>
            <p className="text-[11px] text-[#8F9CAE] mt-1">
              Combine any 2 to 4 verified stocks with auto-balancing sliders.
            </p>
          </button>

          <Link
            href="/portfolio"
            className="p-4 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] hover:border-rose-400 transition-all group"
          >
            <Briefcase className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white">Liquidate to USDC</h4>
            <p className="text-[11px] text-[#8F9CAE] mt-1">
              Exit all or any position back to USDC with dust-free raw amount precision.
            </p>
          </Link>
        </div>
      </div>

      {/* 8. Dynamic Weight Customization Modal for any Curated Theme */}
      {isWeightModalOpen && editingTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#161B26] border border-[#262D3D] rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262D3D] pb-4">
              <div>
                <span className="pill-badge pill-badge-lime mb-1">Custom Weights</span>
                <h3 className="text-xl font-bold text-white">
                  Customize {editingTheme.name}
                </h3>
              </div>
              <button
                onClick={() =>
                  equalizeWeights(editingTheme.components, (updated) =>
                    setEditingTheme({ ...editingTheme, components: updated })
                  )
                }
                className="btn-secondary text-xs !py-1 !px-2.5 text-[#8D8AFF]"
              >
                Equalize
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {editingTheme.components.map((c, index) => {
                const asset = VERIFIED_STOCKS[c.symbol];
                const price = asset ? prices[asset.mint]?.usdPrice : undefined;
                const legDollar = (c.targetWeight / 100) * editingTheme.depositUsd;
                return (
                  <div
                    key={c.symbol}
                    className="p-3.5 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {asset?.logo && (
                          <Image
                            src={asset.logo}
                            alt={c.symbol}
                            width={20}
                            height={20}
                            className="rounded-full bg-white/10"
                          />
                        )}
                        <div>
                          <span className="font-bold text-xs text-white block">{asset?.underlying || c.symbol}</span>
                          <span className="text-[10px] text-[#8F9CAE]">
                            {price ? `$${price.toFixed(2)}` : "..."} • ${legDollar.toFixed(2)} USDC
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-[#1D2332] px-2 py-0.5 rounded-lg border border-[#262D3D]">
                        <input
                          type="number"
                          min={5}
                          max={90}
                          value={c.targetWeight}
                          onChange={(e) =>
                            handleWeightChange(
                              editingTheme.components,
                              index,
                              Number(e.target.value) || 5,
                              (updated) =>
                                setEditingTheme({ ...editingTheme, components: updated })
                            )
                          }
                          className="w-9 bg-transparent text-right font-mono font-bold text-xs text-white focus:outline-none"
                        />
                        <span className="text-[10px] text-[#8F9CAE] font-bold">%</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={5}
                      max={90}
                      value={c.targetWeight}
                      onChange={(e) =>
                        handleWeightChange(
                          editingTheme.components,
                          index,
                          Number(e.target.value),
                          (updated) =>
                            setEditingTheme({ ...editingTheme, components: updated })
                        )
                      }
                      className="w-full accent-[#CDE06A] cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Deposit Amount Input */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-[#8F9CAE]">
                USDC Dollar Amount
              </label>
              <input
                type="number"
                min={10}
                value={editingTheme.depositUsd}
                onChange={(e) =>
                  setEditingTheme({
                    ...editingTheme,
                    depositUsd: Math.max(10, Number(e.target.value)),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#0B0E14] border border-[#262D3D] rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-[#CDE06A]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleExecuteCustomizedTheme}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs !py-3"
              >
                <span>Invest in Customized Theme</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="btn-secondary text-xs !py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Sequential Execution Stepper Modal */}
      {isExecutionModalOpen && modalBasket && (
        <ExecutionModal
          isOpen={isExecutionModalOpen}
          onClose={() => {
            setIsExecutionModalOpen(false);
            setModalBasket(null);
          }}
          basketId={modalBasket.id}
          basketName={modalBasket.name}
          totalUsdAmount={modalBasket.totalAmountUsd}
          legs={modalBasket.legs}
          solBalance={balances.solBalance}
          usdcBalance={balances.usdcBalance}
        />
      )}
    </div>
  );
}
