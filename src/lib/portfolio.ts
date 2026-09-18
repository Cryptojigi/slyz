import { VERIFIED_STOCKS, BasketComponent, isPreStock } from "./constants";
import { TokenPriceInfo } from "./jupiter";
import { PreStockAssetLive, PRESTOCKS_FALLBACK } from "./prestocks";

export interface StoredBasket {
  id: string;
  name: string;
  investedAt: number;
  components: BasketComponent[]; // Target weights
  initialDepositUsd: number;
  txSignatures: string[];
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  underlying: string;
  mint: string;
  logo: string;
  rawBalance: number;
  rawAmountString?: string;
  multiplier: number;
  shareEquivalents: number;
  usdPrice: number;
  currentValueUsd: number;
  currentWeightPct: number;
  targetWeightPct: number;
  driftPct: number; // currentWeightPct - targetWeightPct
  market?: "public" | "private";
  markPrice?: number;
  premiumPct?: number;
}

const STORAGE_KEY = "slyz_invested_baskets";

/**
 * Get all stored user baskets from localStorage.
 */
export function getStoredBaskets(): StoredBasket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading stored baskets:", e);
    return [];
  }
}

/**
 * Save a newly executed basket investment.
 */
export function saveBasketInvestment(basket: StoredBasket): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredBaskets();
    const updated = [basket, ...existing.filter((b) => b.id !== basket.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving basket investment:", e);
  }
}

/**
 * Calculate full portfolio positions, applying multipliers and calculating drift.
 * Handles both public xStocks (Jupiter prices) and private PreStocks (live PreStocks API).
 */
export function calculatePortfolioPositions(
  targetComponents: BasketComponent[],
  balances: Record<string, number>, // mint -> raw ui amount
  prices: Record<string, TokenPriceInfo>,
  rawAmounts?: Record<string, string>,
  prestocksLive?: Record<string, PreStockAssetLive>
): {
  positions: PortfolioPosition[];
  totalValueUsd: number;
  maxDriftPct: number;
} {
  let totalValueUsd = 0;

  // First pass: compute current value per component
  const rawPositions = targetComponents.map((comp) => {
    const asset = VERIFIED_STOCKS[comp.symbol];
    const mint = asset ? asset.mint : "";
    const rawBal = (mint && balances[mint]) || 0;
    const rawAmountStr = (mint && rawAmounts && rawAmounts[mint]) || "";
    const isPrivate = isPreStock(comp.symbol);

    let usdPrice = 0;
    let markPrice: number | undefined = undefined;
    let premiumPct: number | undefined = undefined;

    if (isPrivate) {
      const liveData =
        prestocksLive?.[comp.symbol] || PRESTOCKS_FALLBACK[comp.symbol];
      usdPrice = liveData?.tokenPrice || 0;
      markPrice = liveData?.markPrice;
      premiumPct = liveData?.premiumPct;
    } else {
      const priceInfo = (mint && prices[mint]) || {
        usdPrice: 0,
        scaledUiConfig: { multiplier: 1 },
      };
      usdPrice = priceInfo.usdPrice || 0;
    }

    const multiplier = 1;
    // On Solana Token-2022, uiAmount from RPC already accounts for decimals and scaling.
    const shareEquivalents = rawBal;
    const currentValueUsd = shareEquivalents * usdPrice;

    totalValueUsd += currentValueUsd;

    return {
      symbol: comp.symbol,
      name: asset?.name || comp.symbol,
      underlying: asset?.underlying || comp.symbol,
      mint,
      logo: asset?.logo || "",
      rawBalance: rawBal,
      rawAmountString: rawAmountStr,
      multiplier,
      shareEquivalents,
      usdPrice,
      currentValueUsd,
      targetWeightPct: comp.targetWeight,
      market: asset?.market || "public",
      markPrice,
      premiumPct,
    };
  });

  // Second pass: compute weights and drift
  let maxDriftPct = 0;
  const positions: PortfolioPosition[] = rawPositions.map((pos) => {
    const currentWeightPct = totalValueUsd > 0 ? (pos.currentValueUsd / totalValueUsd) * 100 : 0;
    const driftPct = currentWeightPct - pos.targetWeightPct;
    if (Math.abs(driftPct) > maxDriftPct) {
      maxDriftPct = Math.abs(driftPct);
    }

    return {
      ...pos,
      currentWeightPct,
      driftPct,
    };
  });

  return {
    positions,
    totalValueUsd,
    maxDriftPct,
  };
}

/**
 * Smart Top-Up Allocation Algorithm (Zero Sell Fees / Zero Sell Slippage)
 * Calculates the optimal distribution of a new cash deposit D such that
 * underweight assets receive fresh capital to minimize overall drift.
 */
export function calculateSmartTopUp(
  positions: PortfolioPosition[],
  depositAmountUsd: number
): { symbol: string; allocationUsd: number; targetShareAmount: number }[] {
  if (depositAmountUsd <= 0 || !positions.length) return [];

  const currentTotal = positions.reduce((acc, p) => acc + p.currentValueUsd, 0);
  const newTotal = currentTotal + depositAmountUsd;

  // Target dollar value for each position in the post-deposit portfolio
  const targetDollars = positions.map((p) => (p.targetWeightPct / 100) * newTotal);

  // Deficits: how much each position is missing compared to its new target
  const deficits = positions.map((p, i) => Math.max(0, targetDollars[i] - p.currentValueUsd));
  const sumDeficits = deficits.reduce((a, b) => a + b, 0);

  // If sum of deficits > 0, distribute deposit proportionally among deficits
  if (sumDeficits > 0) {
    let allocatedSum = 0;
    const items = positions.map((p, i) => {
      let allocationUsd = (deficits[i] / sumDeficits) * depositAmountUsd;
      allocationUsd = Math.floor(allocationUsd * 100) / 100;
      allocatedSum += allocationUsd;
      const targetShareAmount = p.usdPrice > 0 ? allocationUsd / p.usdPrice : 0;
      return {
        symbol: p.symbol,
        allocationUsd,
        targetShareAmount,
      };
    });

    // Absorb any leftover rounding cents into the highest deficit item
    const remainder = Math.round((depositAmountUsd - allocatedSum) * 100) / 100;
    if (remainder > 0 && items.length > 0) {
      items[0].allocationUsd = Math.round((items[0].allocationUsd + remainder) * 100) / 100;
      items[0].targetShareAmount = positions[0].usdPrice > 0 ? items[0].allocationUsd / positions[0].usdPrice : 0;
    }
    return items;
  }

  // Fallback if all already balanced: distribute according to target weights
  let allocatedSum = 0;
  const items = positions.map((p) => {
    let allocationUsd = (p.targetWeightPct / 100) * depositAmountUsd;
    allocationUsd = Math.floor(allocationUsd * 100) / 100;
    allocatedSum += allocationUsd;
    const targetShareAmount = p.usdPrice > 0 ? allocationUsd / p.usdPrice : 0;
    return {
      symbol: p.symbol,
      allocationUsd,
      targetShareAmount,
    };
  });

  const remainder = Math.round((depositAmountUsd - allocatedSum) * 100) / 100;
  if (remainder > 0 && items.length > 0) {
    items[0].allocationUsd = Math.round((items[0].allocationUsd + remainder) * 100) / 100;
    items[0].targetShareAmount = positions[0].usdPrice > 0 ? items[0].allocationUsd / positions[0].usdPrice : 0;
  }
  return items;
}
