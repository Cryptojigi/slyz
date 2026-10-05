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
  ChevronLeft,
  LayoutGrid,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  DollarSign,
  Briefcase,
  AlertCircle,
  Globe,
  Lock,
  Info,
  ArrowUpDown,
} from "lucide-react";
import { useWalletBalances } from "@/context/WalletBalanceContext";
import {
  CURATED_BASKETS,
  VERIFIED_STOCKS,
  PUBLIC_XSTOCK_COUNT,
  Basket,
  BasketComponent,
  MIN_SOL_BALANCE,
  MarketKind,
  isPreStock,
  EXECUTABLE_PRIVATE_SYMBOLS,
} from "@/lib/constants";
import { getJupiterPrices, TokenPriceInfo, getCachedJupiterPrices } from "@/lib/jupiter";
import { fetchUserBalances, UserBalances } from "@/lib/solana";
import {
  fetchPreStocksLive,
  PreStockAssetLive,
  PRESTOCKS_FALLBACK,
} from "@/lib/prestocks";
import { DonutChart, DONUT_COLORS } from "@/components/DonutChart";
import { ExecutionModal } from "@/components/ExecutionModal";
import { ThemeMultiStockChart } from "@/components/ThemeMultiStockChart";

export default function DashboardPage() {
  const wallet = useWallet();
  const { openQuickSwap } = useWalletBalances();

  // Active Tab: 'curated' | 'catalog' | 'custom'
  const [activeTab, setActiveTab] = useState<"curated" | "catalog" | "custom">("curated");

  // Market Filter: 'public' (xStocks) | 'private' (PreStocks)
  const [marketFilter, setMarketFilter] = useState<MarketKind>("public");
  const [preStocksLive, setPreStocksLive] = useState<Record<string, PreStockAssetLive>>(PRESTOCKS_FALLBACK);

  // Selected Theme for Real-Time 3-Stock Chart & Featured Spotlight
  const [selectedThemeId, setSelectedThemeId] = useState<string>("mag-3");
  const selectedTheme =
    CURATED_BASKETS.find((b) => b.id === selectedThemeId) || CURATED_BASKETS[0];

  // Custom Investment Amounts & Clear Validation Errors (Input-driven, no pre-filled numbers)
  const [featuredAmount, setFeaturedAmount] = useState<number | string>("");
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  const [cardAmounts, setCardAmounts] = useState<Record<string, number | string>>({});
  const [cardErrors, setCardErrors] = useState<Record<string, string | null>>({});

  // Prices & Balances: Initialize with synchronous cached snapshot to eliminate cold-start empty state
  const [prices, setPrices] = useState<Record<string, TokenPriceInfo>>(() => getCachedJupiterPrices());
  const [loadingPrices, setLoadingPrices] = useState(() => Object.keys(getCachedJupiterPrices()).length === 0);
  const [balances, setBalances] = useState<UserBalances>({
    solBalance: 0,
    usdcBalance: 0,
    token2022Balances: {},
    token2022RawAmounts: {},
    hasSufficientGas: false,
  });

  // Track whether wallet adapter is actively re-establishing a saved connection from localStorage
  const [isReconnecting, setIsReconnecting] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("slyz_last_connected_wallet");
  });

  useEffect(() => {
    if (wallet.connected) {
      setIsReconnecting(false);
    } else {
      const saved = typeof window !== "undefined" ? localStorage.getItem("slyz_last_connected_wallet") : null;
      if (saved) {
        setIsReconnecting(true);
        const timer = setTimeout(() => setIsReconnecting(false), 1200);
        return () => clearTimeout(timer);
      } else {
        setIsReconnecting(false);
      }
    }
  }, [wallet.connected]);

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

  // Curated Themes Horizontal Carousel / Grid Layout State
  const curatedCarouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollCuratedLeft, setCanScrollCuratedLeft] = useState(false);
  const [canScrollCuratedRight, setCanScrollCuratedRight] = useState(true);
  const [curatedScrollIdx, setCuratedScrollIdx] = useState(0);
  const [curatedLayout, setCuratedLayout] = useState<"carousel" | "grid">("carousel");

  const checkCuratedScroll = React.useCallback(() => {
    if (!curatedCarouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = curatedCarouselRef.current;
    setCanScrollCuratedLeft(scrollLeft > 10);
    setCanScrollCuratedRight(scrollLeft < scrollWidth - clientWidth - 10);
    const cardWidth = 360;
    const idx = Math.round(scrollLeft / cardWidth);
    setCuratedScrollIdx(Math.max(0, idx));
  }, []);

  useEffect(() => {
    const el = curatedCarouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkCuratedScroll, { passive: true });
    checkCuratedScroll();
    window.addEventListener("resize", checkCuratedScroll);
    return () => {
      el.removeEventListener("scroll", checkCuratedScroll);
      window.removeEventListener("resize", checkCuratedScroll);
    };
  }, [checkCuratedScroll, activeTab, curatedLayout]);

  const scrollCurated = (direction: "left" | "right") => {
    if (!curatedCarouselRef.current) return;
    const amount = curatedCarouselRef.current.clientWidth * 0.8;
    curatedCarouselRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

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

  // Load live PreStocks data
  useEffect(() => {
    let isMounted = true;
    const loadPreStocks = async () => {
      try {
        const data = await fetchPreStocksLive();
        if (isMounted && data) {
          setPreStocksLive(data);
        }
      } catch (err) {
        console.warn("Failed to load PreStocks:", err);
      }
    };
    loadPreStocks();
    const interval = setInterval(loadPreStocks, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Switch between Public Equities (xStocks) and Private Pre-IPO (PreStocks)
  const handleSwitchMarket = (market: MarketKind) => {
    setMarketFilter(market);
    if (market === "private") {
      setSelectedThemeId("frontier");
      setFeaturedAmount("");
    } else {
      setSelectedThemeId("mag-3");
      setFeaturedAmount("");
    }
  };

  // Helper to resolve live price for either public or private asset
  const getAssetPrice = (symbol: string): number | undefined => {
    if (isPreStock(symbol)) {
      return preStocksLive[symbol]?.tokenPrice ?? PRESTOCKS_FALLBACK[symbol]?.tokenPrice;
    }
    const asset = VERIFIED_STOCKS[symbol];
    return asset ? prices[asset.mint]?.usdPrice : undefined;
  };

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
  const handleInvestWithValidation = (basket: Basket, rawAmount: number | string, isFeatured: boolean = false) => {
    const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;
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
    if (!rawAmount || isNaN(amount) || amount <= 0) {
      setError("Please enter the amount you wish to invest.");
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

    // 5. SOL balance check
    if (balances.solBalance < MIN_SOL_BALANCE) {
      setError(
        `Low SOL balance for fees. You have ${balances.solBalance.toFixed(4)} SOL (at least ${MIN_SOL_BALANCE} SOL is required for network fees & Token-2022 account rent).`
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
      depositUsd: basket.market === "private" ? 25 : 100,
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
    if (marketFilter === "public" && stock.market === "private") return false;
    if (marketFilter === "private" && stock.market !== "private") return false;
    const q = searchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(q) ||
      stock.underlying.toLowerCase().includes(q) ||
      stock.category.toLowerCase().includes(q)
    );
  });

  const curatedBasketsList = CURATED_BASKETS.filter((basket) => {
    if ((basket.market || "public") !== marketFilter) return false;
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Terminal Investor Header */}
      <div className="pb-4 sm:pb-6 border-b border-[#262D3D]">
        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight break-words">
          {wallet.connected && wallet.publicKey ? (
            `Welcome back, ${wallet.publicKey.toBase58().slice(0, 4)}..${wallet.publicKey.toBase58().slice(-4)}`
          ) : isReconnecting ? (
            <span className="inline-block h-7 sm:h-9 w-60 bg-[#161B26] border border-[#262D3D] rounded-xl animate-pulse align-middle" />
          ) : (
            "Welcome to Slyz Terminal"
          )}
        </h1>
        <p className="text-sm sm:text-xs text-[#8F9CAE] mt-2">
          <span className="hidden sm:inline">Curated equity baskets, on-chain fractional shares, and dynamic weight customization.</span>
          <span className="sm:hidden">Invest in curated stock pies with fractional shares on Solana.</span>
        </p>
      </div>

      {/* 2. Public vs Private Shelf Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-1.5 sm:p-2 rounded-xl bg-[#161B26] border border-[#262D3D]">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => handleSwitchMarket("public")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
              marketFilter === "public"
                ? "bg-[#CDE06A] text-[#0B0E14] shadow-md shadow-[#CDE06A]/20"
                : "text-[#8F9CAE] hover:text-white hover:bg-[#1D2332]"
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Public (xStocks)</span>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/20">
              {CURATED_BASKETS.filter((b) => b.market === "public").length} Themes • {PUBLIC_XSTOCK_COUNT} Assets
            </span>
          </button>

          <button
            onClick={() => handleSwitchMarket("private")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
              marketFilter === "private"
                ? "bg-gradient-to-r from-[#8D8AFF] to-[#B48AFF] text-white shadow-md shadow-[#8D8AFF]/20"
                : "text-[#8F9CAE] hover:text-white hover:bg-[#1D2332]"
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Private (PreStocks)</span>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/20">
              Frontier • 8 Assets
            </span>
          </button>
        </div>

        <div className="text-[11px] sm:text-xs text-[#8F9CAE] px-2 sm:px-3 font-mono flex items-center gap-2">
          {marketFilter === "public" ? (
            <span>24/7 xStocks • Jupiter Routing</span>
          ) : (
            <span className="text-[#8D8AFF] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8D8AFF] shrink-0" />
              PreStocks Pipeline • 9 Decimals
            </span>
          )}
        </div>
      </div>

      {/* 3. Top Bento Row: Chart (Public) OR Valuation Radar (Private) & Featured Theme Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {marketFilter === "public" ? (
          /* Left: Dynamic Real-Time 3-Stock Trend Curve for Public xStocks */
          <div className="lg:col-span-8 bento-card">
            <ThemeMultiStockChart
              basket={selectedTheme}
              prices={prices}
              timeframe={chartTimeframe}
              onTimeframeChange={setChartTimeframe}
              loading={loadingPrices}
            />
          </div>
        ) : (
          /* Left: PreStocks Private Market Valuation Radar Deck */
          <div className="lg:col-span-8 bento-card relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262D3D]">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-[#8D8AFF]/15 border border-[#8D8AFF]/30 text-[#8D8AFF] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    PreStocks™ Verified Pipeline
                  </span>
                  <span className="text-xs text-[#8F9CAE] font-mono">
                    Source: prestocks.com/api/prestocks
                  </span>
                </div>
                <span className="pill-badge pill-badge-purple text-[10px]">
                  9 Decimals • Token-2022
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Private Venture Pre-IPO Valuation Radar
                </h2>
                <p className="text-xs text-[#8F9CAE] mt-1 leading-relaxed">
                  Direct on-chain economic exposure to tier-one venture companies. Verified PreStocks mints with 9 decimals and automated Jupiter AMM routing.
                </p>
              </div>

              {/* Live 3-Asset Cards for Executable Frontier Basket */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {EXECUTABLE_PRIVATE_SYMBOLS.map((sym) => {
                  const live = preStocksLive[sym] || PRESTOCKS_FALLBACK[sym];
                  const stock = VERIFIED_STOCKS[sym];
                  const isPremiumPositive = (live?.premiumPct ?? 0) >= 0;

                  return (
                    <div
                      key={sym}
                      className="p-4 rounded-xl bg-[#0B0E14]/80 border border-[#262D3D] hover:border-[#8D8AFF]/40 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {stock?.logo && (
                            <Image
                              src={stock.logo}
                              alt={sym}
                              width={28}
                              height={28}
                              className="rounded-full bg-white/10"
                              unoptimized
                            />
                          )}
                          <div>
                            <span className="font-semibold text-white text-sm block">{sym}</span>
                            <span className="text-[10px] text-[#8F9CAE] block">
                              {stock?.underlying || sym}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isPremiumPositive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isPremiumPositive ? "+" : ""}
                          {live?.premiumPct.toFixed(1)}% vs mark
                        </span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-[#262D3D]/60 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#8F9CAE] text-[11px]">Live Token Price:</span>
                          <span className="font-mono font-semibold text-white text-sm">
                            ${live?.tokenPrice.toFixed(2) || "---"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8F9CAE] text-[11px]">Official Mark Price:</span>
                          <span className="font-mono text-[#8F9CAE] text-xs">
                            ${live?.markPrice.toFixed(2) || "---"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#262D3D]/60 flex items-center justify-end text-[10px] font-mono text-[#8F9CAE]">
                        <button
                          onClick={() => copyToClipboard(stock?.mint || "")}
                          className="hover:text-white flex items-center gap-1 transition-colors"
                          title="Copy Mint"
                        >
                          <span>{stock?.mint.slice(0, 4)}..{stock?.mint.slice(-4)}</span>
                          {copiedMint === stock?.mint ? (
                            <CheckCircle2 className="w-3 h-3 text-[#CDE06A]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Protocol Trust Badges */}
            <div className="pt-4 mt-4 border-t border-[#262D3D] grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
              <div className="p-2.5 rounded-xl bg-[#0B0E14]/40 border border-[#262D3D] flex items-center gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#8D8AFF] shrink-0" />
                <div>
                  <span className="font-bold text-white block text-[11px]">PreStocks API Verified</span>
                  <span className="text-[10px] text-[#8F9CAE] block">Zero spoofed or unverified mints</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0E14]/40 border border-[#262D3D] flex items-center gap-2.5 text-xs">
                <Zap className="w-4 h-4 text-[#CDE06A] shrink-0" />
                <div>
                  <span className="font-bold text-white block text-[11px]">Jupiter Lite AMM Swaps</span>
                  <span className="text-[10px] text-[#8F9CAE] block">Raw 9-decimal precision routing</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0E14]/40 border border-[#262D3D] flex items-center gap-2.5 text-xs">
                <Info className="w-4 h-4 text-white/80 shrink-0" />
                <div>
                  <span className="font-bold text-white block text-[11px]">Economic Exposure Only</span>
                  <span className="text-[10px] text-[#8F9CAE] block">Not equity, voting, or dividends</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right: Featured Theme Spotlight Card (Synced with Selected Theme) */}
        <div className="lg:col-span-4 bento-card flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                  marketFilter === "private"
                    ? "bg-[#8D8AFF]/20 text-[#8D8AFF] border border-[#8D8AFF]/30"
                    : "bg-[#CDE06A]/15 text-[#CDE06A]"
                }`}
              >
                {marketFilter === "private" ? "Featured Pre-IPO Pie" : "Featured Theme"}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#262D3D] flex items-center justify-center text-white">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white">{selectedTheme.name}</h3>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              {selectedTheme.description}
            </p>

            {/* Asset distribution preview */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {selectedTheme.components.map((c) => {
                const asset = VERIFIED_STOCKS[c.symbol];
                const isPrivate = isPreStock(c.symbol);
                const livePrice = getAssetPrice(c.symbol);
                const preData = isPrivate
                  ? preStocksLive[c.symbol] || PRESTOCKS_FALLBACK[c.symbol]
                  : null;
                return (
                  <div
                    key={c.symbol}
                    className="p-2 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] text-center"
                  >
                    <span className="text-[10px] text-[#8F9CAE] block font-bold">
                      {asset?.underlying || c.symbol}
                    </span>
                    <span className="text-xs font-semibold text-white block">{c.targetWeight}%</span>
                    <span className="text-[10px] font-mono text-[#CDE06A] block mt-0.5 min-h-[14px]">
                      {livePrice ? `$${livePrice.toFixed(2)}` : <span className="h-2.5 w-8 bg-[#262D3D] rounded animate-pulse inline-block" />}
                    </span>
                    {isPrivate && preData && (
                      <span className="text-[9px] font-mono text-[#8D8AFF] block">
                        Mark: ${preData.markPrice.toFixed(0)}
                      </span>
                    )}
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
                <span className="text-[11px] font-mono text-[#8F9CAE] flex items-center gap-1.5">
                  <Image
                    src="/usdc-logo.svg"
                    alt="USDC"
                    width={13}
                    height={13}
                    className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                  />
                  {wallet.connected ? (
                    <span>Wallet: ${balances.usdcBalance.toFixed(2)} USDC</span>
                  ) : isReconnecting ? (
                    <span className="h-3 w-16 bg-[#262D3D] rounded animate-pulse inline-block" />
                  ) : (
                    <span>Wallet: $0.00 USDC</span>
                  )}
                </span>
              </div>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-[#8F9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={5}
                  step="any"
                  placeholder="0.00"
                  value={featuredAmount}
                  onChange={(e) => {
                    setFeaturedAmount(e.target.value);
                    if (featuredError) setFeaturedError(null);
                  }}
                  className="w-full pl-8 pr-14 py-2.5 bg-[#0B0E14] border border-[#262D3D] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#CDE06A]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const maxVal = selectedTheme.market === "private"
                      ? Math.min(25, Math.floor(balances.usdcBalance))
                      : Math.floor(balances.usdcBalance);
                    setFeaturedAmount(maxVal > 0 ? maxVal.toString() : "");
                    if (featuredError) setFeaturedError(null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#CDE06A] px-2 py-0.5 rounded bg-[#CDE06A]/10 hover:bg-[#CDE06A]/20"
                >
                  MAX
                </button>
              </div>

              {selectedTheme.market === "private" && Number(featuredAmount) > 25 && (
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Your estimated price impact is shown in the execution preview before you confirm.</span>
                </div>
              )}

              {featuredError && (
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{featuredError}</span>
                </div>
              )}

              {featuredAmount !== "" && Number(featuredAmount) > 0 && balances.usdcBalance < Number(featuredAmount) && balances.solBalance >= 0.02 && (
                <button
                  type="button"
                  onClick={() => openQuickSwap("SOL_TO_USDC", Math.ceil(Number(featuredAmount) - balances.usdcBalance))}
                  className="w-full p-2 rounded-xl bg-[#CDE06A]/10 hover:bg-[#CDE06A]/20 border border-[#CDE06A]/30 text-[11px] text-[#CDE06A] flex items-center justify-between font-bold transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Image
                      src="/sol-logo.svg"
                      alt="SOL"
                      width={14}
                      height={14}
                      className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                    />
                    <span>Need USDC? You have {balances.solBalance.toFixed(3)} SOL available</span>
                  </span>
                  <span className="underline flex items-center gap-1">
                    Convert Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
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

      {/* 4. Segmented Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-2 sm:pt-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 p-1 rounded-xl bg-[#161B26] border border-[#262D3D] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("curated")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center ${
              activeTab === "curated"
                ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0 hidden xs:block" />
            <span className="sm:hidden">Themes ({curatedBasketsList.length})</span>
            <span className="hidden sm:inline">
              {marketFilter === "public"
                ? `Curated Theme Pies (${curatedBasketsList.length})`
                : `Curated Pre-IPO Pies (${curatedBasketsList.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center ${
              activeTab === "catalog"
                ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0 hidden xs:block" />
            <span className="sm:hidden">Directory ({marketFilter === "public" ? PUBLIC_XSTOCK_COUNT : "8"})</span>
            <span className="hidden sm:inline">
              {marketFilter === "public"
                ? `Curated xStocks (${PUBLIC_XSTOCK_COUNT})`
                : "PreStocks Directory (8)"}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center ${
              activeTab === "custom"
                ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                : "text-[#8F9CAE] hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0 hidden xs:block" />
            <span className="sm:hidden">Custom</span>
            <span className="hidden sm:inline">Custom Slyz Studio</span>
          </button>
        </div>

        {/* Search Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#8F9CAE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              marketFilter === "public"
                ? "Search stocks or themes..."
                : "Search PreStocks or Frontier..."
            }
            className="w-full pl-10 pr-4 py-2 bg-[#161B26] border border-[#262D3D] rounded-xl text-xs text-white placeholder-[#8F9CAE] focus:outline-none focus:border-[#CDE06A] transition-colors"
          />
        </div>
      </div>

      {/* 5. Tab 1: Curated Theme Pies */}
      {activeTab === "curated" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header Controls for Curated Tab */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {marketFilter === "public" ? "Curated Equity Themes" : "Curated Pre-IPO Pies"}
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#1D2332] text-[#8D8AFF] border border-[#262D3D]">
                  {curatedBasketsList.length} Pies
                </span>
              </div>
              <p className="text-xs text-[#8F9CAE] mt-0.5 hidden sm:block">
                Pre-assembled multi-asset baskets. Select any pie to preview performance and execute allocations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop View Switcher (Carousel vs Grid) */}
              <div className="hidden md:flex items-center p-0.5 rounded-xl bg-[#161B26] border border-[#262D3D]">
                <button
                  type="button"
                  onClick={() => setCuratedLayout("carousel")}
                  title="Horizontal Carousel View"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    curatedLayout === "carousel"
                      ? "bg-[#CDE06A] text-[#0B0E14]"
                      : "text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Carousel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCuratedLayout("grid")}
                  title="Grid View"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    curatedLayout === "grid"
                      ? "bg-[#CDE06A] text-[#0B0E14]"
                      : "text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>

              {/* Navigation Arrows for Carousel */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCurated("left")}
                  disabled={!canScrollCuratedLeft}
                  aria-label="Previous theme"
                  className="w-8 h-8 rounded-xl bg-[#161B26] border border-[#262D3D] flex items-center justify-center text-white hover:border-[#CDE06A] hover:text-[#CDE06A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCurated("right")}
                  disabled={!canScrollCuratedRight}
                  aria-label="Next theme"
                  className="w-8 h-8 rounded-xl bg-[#161B26] border border-[#262D3D] flex items-center justify-center text-white hover:border-[#CDE06A] hover:text-[#CDE06A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Swipeable Carousel Track or Responsive Grid */}
          <div
            ref={curatedCarouselRef}
            className={
              curatedLayout === "carousel"
                ? "flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-5 pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth items-stretch"
                : "flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none no-scrollbar gap-5 pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth items-stretch"
            }
          >
            {curatedBasketsList.map((basket) => {
              const isSelected = basket.id === selectedThemeId;
              const cardAmt = cardAmounts[basket.id] ?? "";
              const cardErr = cardErrors[basket.id];

              return (
                <div
                  key={basket.id}
                  onClick={() => setSelectedThemeId(basket.id)}
                  className={`bento-card !p-0 overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer h-full ${
                    curatedLayout === "carousel"
                      ? "w-[84vw] max-w-[340px] sm:w-[350px] md:w-[360px] shrink-0 snap-start"
                      : "w-[84vw] max-w-[340px] sm:w-[350px] md:w-auto shrink-0 md:shrink snap-start md:snap-align-none"
                  } ${
                    isSelected
                      ? basket.market === "private"
                        ? "border-[#8D8AFF] ring-1 ring-[#8D8AFF]/40 shadow-xl shadow-[#8D8AFF]/5"
                        : "border-[#CDE06A] ring-1 ring-[#CDE06A]/40 shadow-xl shadow-[#CDE06A]/5"
                      : "hover:border-[#8D8AFF]/40"
                  }`}
                >
                  <div className="flex flex-col h-full">
                    {/* Thematic Banner Artwork */}
                    {basket.image && (
                      <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-[#0B0E14] shrink-0">
                        <Image
                          src={basket.image}
                          alt={basket.name}
                          fill
                          sizes="(max-width: 640px) 84vw, 360px"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161B26] via-[#161B26]/30 to-transparent pointer-events-none" />

                        {/* Floating Badges */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                              basket.market === "private"
                                ? "bg-[#0B0E14]/85 text-[#8D8AFF] border border-[#8D8AFF]/30"
                                : "bg-[#0B0E14]/85 text-white/90 border border-white/10"
                            }`}
                          >
                            {basket.category}
                          </span>
                          {isSelected ? (
                            <span
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md shadow-sm ${
                                basket.market === "private"
                                  ? "bg-[#0B0E14]/90 text-[#8D8AFF] border border-[#8D8AFF]/40"
                                  : "bg-[#0B0E14]/90 text-[#CDE06A] border border-[#CDE06A]/40"
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#8F9CAE] group-hover:text-white px-2 py-0.5 rounded-lg bg-[#0B0E14]/85 backdrop-blur-md border border-white/10 transition-colors shadow-sm">
                              <TrendingUp className="w-3 h-3 text-[#CDE06A]" />
                              <span>Select</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-5 sm:p-6 pt-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{basket.name}</h3>
                        <p className="text-xs text-[#8F9CAE] mt-1 line-clamp-2 min-h-[36px] leading-relaxed">
                          {basket.description}
                        </p>

                        {/* Components breakdown with live prices */}
                        <div className="space-y-2 pt-3 mt-3 border-t border-[#262D3D]">
                          {basket.components.map((c) => {
                            const asset = VERIFIED_STOCKS[c.symbol];
                            const isPrivate = isPreStock(c.symbol);
                            const livePrice = getAssetPrice(c.symbol);
                            const preData = isPrivate
                              ? preStocksLive[c.symbol] || PRESTOCKS_FALLBACK[c.symbol]
                              : null;
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
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-white/10" />
                                  )}
                                  <div>
                                    <span className="font-bold text-white block">
                                      {asset?.underlying || c.symbol}
                                    </span>
                                    <span className="text-[10px] text-[#8F9CAE]">
                                      {livePrice ? `$${livePrice.toFixed(2)}` : "..."}
                                      {isPrivate && preData && (
                                        <span className="text-[#8D8AFF] ml-1">
                                          (Mark: ${preData.markPrice.toFixed(0)})
                                        </span>
                                      )}
                                    </span>
                                  </div>
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
                            <span className="font-mono text-[#8F9CAE] flex items-center gap-1.5">
                              <Image
                                src="/usdc-logo.svg"
                                alt="USDC"
                                width={13}
                                height={13}
                                className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                              />
                              <span>Wallet: ${balances.usdcBalance.toFixed(2)}</span>
                            </span>
                          </div>
                          <div className="relative">
                            <DollarSign className="w-3.5 h-3.5 text-[#8F9CAE] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              min="1"
                              step="any"
                              placeholder="0.00"
                              value={cardAmt}
                              onChange={(e) => {
                                const val = e.target.value;
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
                                const maxVal = basket.market === "private"
                                  ? Math.min(25, Math.floor(balances.usdcBalance))
                                  : Math.floor(balances.usdcBalance);
                                setCardAmounts((prev) => ({
                                  ...prev,
                                  [basket.id]: maxVal > 0 ? maxVal.toString() : "",
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

                          {cardAmt !== "" && Number(cardAmt) > 0 && balances.usdcBalance < Number(cardAmt) && balances.solBalance >= 0.02 && (
                            <button
                              type="button"
                              onClick={() => openQuickSwap("SOL_TO_USDC", Math.ceil(Number(cardAmt) - balances.usdcBalance))}
                              className="w-full p-2 rounded-xl bg-[#CDE06A]/10 hover:bg-[#CDE06A]/20 border border-[#CDE06A]/30 text-[11px] text-[#CDE06A] flex items-center justify-between font-bold transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Image
                                  src="/sol-logo.svg"
                                  alt="SOL"
                                  width={14}
                                  height={14}
                                  className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                                />
                                <span>Swap SOL to USDC</span>
                              </span>
                              <span className="underline flex items-center gap-1">
                                Convert <ArrowRight className="w-3 h-3" />
                              </span>
                            </button>
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
                  </div>
                </div>
              );
            })}
          </div>

          {/* Swipe Indicator & Pagination Dots */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {curatedBasketsList.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (!curatedCarouselRef.current) return;
                    const cardWidth = 360;
                    curatedCarouselRef.current.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
                  }}
                  aria-label={`Jump to ${b.name}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === curatedScrollIdx
                      ? "w-6 bg-[#CDE06A]"
                      : "w-2 bg-[#262D3D] hover:bg-[#8F9CAE]"
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] font-mono text-[#8F9CAE]">
              Swipe to explore ({curatedScrollIdx + 1}/{curatedBasketsList.length})
            </span>
          </div>
        </div>
      )}

      {/* 6. Tab 2: Available Equities or PreStocks Directory */}
      {activeTab === "catalog" && (
        <div className="bento-card overflow-hidden !p-0">
          <div className="p-6 border-b border-[#262D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {marketFilter === "public"
                  ? "Curated xStock Equities"
                  : "Official PreStocks Pre-IPO Directory"}
              </h2>
              <p className="text-xs text-[#8F9CAE] mt-0.5">
                {marketFilter === "public"
                  ? "Token-2022 US equities trading 24/7 on Solana with Jupiter routing."
                  : "Tokenized pre-IPO economic exposure verified via https://prestocks.com/api/prestocks."}
              </p>
            </div>
            <span
              className={`pill-badge self-start sm:self-auto ${
                marketFilter === "public" ? "pill-badge-lime" : "pill-badge-purple"
              }`}
            >
              {marketFilter === "public" ? `${PUBLIC_XSTOCK_COUNT} Curated xStocks` : "8 Verified PreStocks"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1D2332]/60 text-[#8F9CAE] uppercase font-bold text-[10px] tracking-wider border-b border-[#262D3D]">
                <tr>
                  <th className="px-6 py-3.5">Asset</th>
                  <th className="px-6 py-3.5">Underlying</th>
                  <th className="px-6 py-3.5">
                    {marketFilter === "public" ? "Live Price" : "Token vs Mark Price"}
                  </th>
                  <th className="px-6 py-3.5">Mint Address</th>
                  <th className="px-6 py-3.5">
                    {marketFilter === "public" ? "Decimals" : "Liquidity & Execution"}
                  </th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262D3D] text-white font-medium">
                {verifiedStocksList.map((stock) => {
                  const isPrivate = stock.market === "private";
                  const preData = isPrivate
                    ? preStocksLive[stock.symbol] || PRESTOCKS_FALLBACK[stock.symbol]
                    : null;
                  const price = isPrivate
                    ? preData?.tokenPrice
                    : prices[stock.mint]?.usdPrice;
                  const isExecutable =
                    !isPrivate ||
                    EXECUTABLE_PRIVATE_SYMBOLS.includes(stock.symbol as any);

                  return (
                    <tr key={stock.symbol} className="hover:bg-[#1D2332]/40 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        {stock.logo ? (
                          <Image
                            src={stock.logo}
                            alt={stock.symbol}
                            width={28}
                            height={28}
                            className="rounded-full bg-white/10"
                            unoptimized
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/10" />
                        )}
                        <div>
                          <span className="font-semibold text-sm block">{stock.symbol}</span>
                          <span className="text-[10px] text-[#8F9CAE] block">
                            {isPrivate ? "PreStocks Token-2022" : "xStock Token-2022"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#8F9CAE] font-semibold">{stock.underlying}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sm">
                        {isPrivate && preData ? (
                          <div>
                            <span className="text-[#CDE06A] block">
                              ${preData.tokenPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-[#8F9CAE] block font-normal">
                              Mark: ${preData.markPrice.toFixed(2)}
                              <span
                                className={
                                  preData.premiumPct >= 0
                                    ? " text-emerald-400 ml-1 font-semibold"
                                    : " text-rose-400 ml-1 font-semibold"
                                }
                              >
                                ({preData.premiumPct >= 0 ? "+" : ""}
                                {preData.premiumPct.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#CDE06A]">
                            {price ? `$${price.toFixed(2)}` : "Loading..."}
                          </span>
                        )}
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
                          <a
                            href={`https://solscan.io/token/${stock.mint}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-[#262D3D] text-[#8F9CAE] hover:text-white transition-colors"
                            title="View on Solscan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPrivate ? (
                          isExecutable ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Basket enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1D2332] text-[#8F9CAE] border border-[#262D3D]">
                              <Lock className="w-3 h-3 text-[#8F9CAE]" />
                              Direct purchase only
                            </span>
                          )
                        ) : (
                          <span className="font-mono text-xs text-[#8F9CAE]">
                            {stock.decimals} Decimals
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPrivate ? (
                          isExecutable ? (
                            <Link
                              href="/invest/frontier"
                              className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 ml-auto"
                            >
                              <span>Invest in Frontier</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span className="text-[11px] text-[#8F9CAE] italic">
                              Direct purchase only
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => addStockToCustomStudio(stock.symbol)}
                            className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 ml-auto hover:border-[#CDE06A] hover:text-[#CDE06A]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Custom Pie</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {marketFilter === "private" && (
            <div className="p-4 bg-[#0B0E14] border-t border-[#262D3D] text-xs text-[#8F9CAE] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#8D8AFF] shrink-0" />
              <span>
                <strong>Slyz Execution Policy:</strong> basket mode is available for a curated set of PreStocks assets. Every listed asset can be purchased directly or gifted, and basket coverage expands as execution improves.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 7. Tab 3: Custom Slyz Studio */}
      {activeTab === "custom" && marketFilter === "private" && (
        <div className="bento-card text-center py-16 px-6 max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#8D8AFF]/20 border border-[#8D8AFF]/30 text-[#8D8AFF] mx-auto flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Custom Studio is Configured for Public Equities</h3>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            In v1, the Custom Pie Builder supports all curated Public xStocks. For private pre-IPO exposure, invest directly in the curated <strong>Frontier</strong> basket (OpenAI, Anthropic, SpaceX).
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleSwitchMarket("public")}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Switch to Public xStocks</span>
            </button>
            <Link href="/invest/frontier" className="btn-secondary text-xs flex items-center gap-1.5">
              <span>View Frontier Basket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === "custom" && marketFilter === "public" && (
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
                const sliceColor = DONUT_COLORS[index % DONUT_COLORS.length];
                return (
                  <div
                    key={c.symbol}
                    className="p-3.5 sm:p-4 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D] space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {asset?.logo && (
                          <div
                            className="w-7 h-7 rounded-full overflow-hidden shrink-0 border bg-[#161B26] p-0.5 flex items-center justify-center shadow-sm"
                            style={{ borderColor: sliceColor }}
                          >
                            <Image
                              src={asset.logo}
                              alt={c.symbol}
                              width={24}
                              height={24}
                              className="rounded-full object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white truncate">{asset?.underlying || c.symbol}</span>
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: sliceColor }}
                            />
                          </div>
                          <span className="text-[10px] text-[#8F9CAE] block font-mono truncate">
                            {price ? `$${price.toFixed(2)}` : "..."} • ${legDollar.toFixed(2)} USDC
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                            className="w-9 sm:w-10 bg-transparent text-right font-mono font-bold text-sm text-white focus:outline-none"
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
                            aria-label={`Remove ${c.symbol}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Proportional Range Slider with Stock's Distinct Color */}
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
                      style={{ accentColor: sliceColor }}
                      className="w-full cursor-pointer h-2 bg-[#161B26] rounded-lg touch-manipulation"
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
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
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
          <div className="lg:col-span-5 bento-card space-y-5">
            <h3 className="text-lg font-bold text-white border-b border-[#262D3D] pb-3">
              Target Allocation Preview
            </h3>

            <div className="flex justify-center py-2">
              <DonutChart
                data={customDonutData}
                height={230}
                centerLabel={`$${customDepositUsd}`}
                centerSublabel="Total USDC"
              />
            </div>

            {/* Allocation Legend Breakdown (Matching Image 2 Style) */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#262D3D]/80">
              {customDonutData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#0B0E14]/60 border border-[#262D3D]/60 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-white truncate text-[11px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white text-[11px] shrink-0">
                    {item.value}%
                  </span>
                </div>
              ))}
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
      <div className="rounded-xl bg-[#161B26] border border-[#262D3D] p-6 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262D3D] pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
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

      {/* Bottom Corner Version Tag */}
      <div className="flex justify-end pt-2 pb-4">
        <span className="pill-badge pill-badge-lime text-[10px] sm:text-xs">
          Terminal v1.0
        </span>
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
                const isPrivate = isPreStock(c.symbol);
                const price = getAssetPrice(c.symbol);
                const preData = isPrivate
                  ? preStocksLive[c.symbol] || PRESTOCKS_FALLBACK[c.symbol]
                  : null;
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
                            unoptimized
                          />
                        )}
                        <div>
                          <span className="font-bold text-xs text-white block">{asset?.underlying || c.symbol}</span>
                          <span className="text-[10px] text-[#8F9CAE]">
                            {price ? `$${price.toFixed(2)}` : "..."} • ${legDollar.toFixed(2)} USDC
                            {isPrivate && preData && (
                              <span className="text-[#8D8AFF] ml-1">
                                (Mark: ${preData.markPrice.toFixed(0)})
                              </span>
                            )}
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#8F9CAE]">
                  USDC Dollar Amount
                </label>
                {editingTheme.components.some((c) => isPreStock(c.symbol)) && (
                  <span className="text-[10px] text-[#8D8AFF]">Suggested max: $25 (Liquidity Guard)</span>
                )}
              </div>
              <input
                type="number"
                min={editingTheme.components.some((c) => isPreStock(c.symbol)) ? 5 : 10}
                value={editingTheme.depositUsd}
                onChange={(e) => {
                  const minLimit = editingTheme.components.some((c) => isPreStock(c.symbol)) ? 5 : 10;
                  setEditingTheme({
                    ...editingTheme,
                    depositUsd: Math.max(minLimit, Number(e.target.value)),
                  });
                }}
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
