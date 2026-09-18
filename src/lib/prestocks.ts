/**
 * PreStocks live client & cache.
 * Source of truth: https://prestocks.com/api/prestocks
 * Provides live mark prices, token prices, valuations, and premium calculations.
 */

export const PRESTOCKS_API = "https://prestocks.com/api/prestocks";

export interface PreStockAssetLive {
  symbol: string;
  name: string;
  mint: string;
  image: string;
  markPrice: number;
  tokenPrice: number;
  markValuation?: number;
  impliedValuation?: number;
  supply?: number;
  premiumPct: number;
}

// In-memory cache for API responses (45-second TTL)
let cachedPreStocks: Record<string, PreStockAssetLive> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 45 * 1000;

// Static fallback metadata in case prestocks.com API is temporarily unreachable or rate-limited
export const PRESTOCKS_FALLBACK: Record<string, PreStockAssetLive> = {
  OPENAI: {
    symbol: "OPENAI",
    name: "OpenAI PreStocks",
    mint: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
    image: "https://www.prestocks.com/logos/openai.png",
    markPrice: 972.96,
    tokenPrice: 1084.07,
    premiumPct: 11.42,
  },
  ANTHROPIC: {
    symbol: "ANTHROPIC",
    name: "Anthropic PreStocks",
    mint: "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw",
    image: "https://www.prestocks.com/logos/anthropic.png",
    markPrice: 1018.15,
    tokenPrice: 1011.52,
    premiumPct: -0.65,
  },
  SPACEX: {
    symbol: "SPACEX",
    name: "SpaceX PreStocks",
    mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
    image: "https://www.prestocks.com/logos/spacex.png",
    markPrice: 155.59,
    tokenPrice: 121.90,
    premiumPct: -21.65,
  },
  ANDURIL: {
    symbol: "ANDURIL",
    name: "Anduril PreStocks",
    mint: "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB",
    image: "https://www.prestocks.com/logos/anduril.png",
    markPrice: 48.0,
    tokenPrice: 52.0,
    premiumPct: 8.33,
  },
  FIGUREAI: {
    symbol: "FIGUREAI",
    name: "Figure AI PreStocks",
    mint: "PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd",
    image: "https://www.prestocks.com/logos/figureai.png",
    markPrice: 35.0,
    tokenPrice: 38.5,
    premiumPct: 10.0,
  },
  KALSHI: {
    symbol: "KALSHI",
    name: "Kalshi PreStocks",
    mint: "PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua",
    image: "https://www.prestocks.com/logos/kalshi.png",
    markPrice: 18.0,
    tokenPrice: 20.0,
    premiumPct: 11.11,
  },
  NEURALINK: {
    symbol: "NEURALINK",
    name: "Neuralink PreStocks",
    mint: "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S",
    image: "https://www.prestocks.com/logos/neuralink.png",
    markPrice: 65.0,
    tokenPrice: 70.0,
    premiumPct: 7.69,
  },
  POLYMARKET: {
    symbol: "POLYMARKET",
    name: "Polymarket PreStocks",
    mint: "Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP",
    image: "https://www.prestocks.com/logos/polymarket.png",
    markPrice: 25.0,
    tokenPrice: 28.0,
    premiumPct: 12.0,
  },
};

/**
 * Fetch the latest live catalog of PreStocks from official API.
 * Uses in-memory caching to protect client from rate limits.
 */
export async function fetchPreStocksLive(): Promise<Record<string, PreStockAssetLive>> {
  const now = Date.now();
  if (cachedPreStocks && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedPreStocks;
  }

  try {
    const res = await fetch(PRESTOCKS_API, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`[PreStocks] API returned ${res.status}, falling back to static cache`);
      return cachedPreStocks || PRESTOCKS_FALLBACK;
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return cachedPreStocks || PRESTOCKS_FALLBACK;
    }

    const map: Record<string, PreStockAssetLive> = {};
    for (const row of rows) {
      const mark = Number(row.markPrice) || 0;
      const token = Number(row.tokenPrice) || 0;
      map[row.symbol] = {
        symbol: row.symbol,
        name: row.name,
        mint: row.contract_address,
        image: row.image || `https://www.prestocks.com/logos/${row.symbol.toLowerCase()}.png`,
        markPrice: mark,
        tokenPrice: token,
        markValuation: row.markValuation ? Number(row.markValuation) : undefined,
        impliedValuation: row.impliedValuation ? Number(row.impliedValuation) : undefined,
        supply: row.supply ? Number(row.supply) : undefined,
        premiumPct: mark > 0 ? ((token - mark) / mark) * 100 : 0,
      };
    }

    cachedPreStocks = map;
    lastFetchTime = now;
    return map;
  } catch (err) {
    console.warn("[PreStocks] Fetch failed:", err);
    return cachedPreStocks || PRESTOCKS_FALLBACK;
  }
}
