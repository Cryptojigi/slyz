/**
 * PreStocks live client & cache.
 * Source of truth: https://prestocks.com/api/prestocks
 * Provides live mark prices, token prices, valuations, and premium calculations.
 */

/**
 * Client-side fetch target: our OWN same-origin proxy route.
 *
 * The upstream API (prestocks.com/api/prestocks) returns valid JSON but sends
 * NO CORS headers, so browsers block it ("TypeError: Failed to fetch"). It can
 * only be fetched server-side — see src/app/api/prestocks/route.ts.
 *
 * This is deliberately NOT configurable from the client: a NEXT_PUBLIC_ override
 * here lets the app point straight back at the CORS-blocked upstream. Configure
 * the upstream server-side with PRESTOCKS_API_URL instead.
 */
export const PRESTOCKS_API = "/api/prestocks";

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
const STORAGE_KEY = "slyz_prestocks_last_payload";

/**
 * SSR-safe helper to read the last successful payload from localStorage.
 */
function getStoredPayload(): Record<string, PreStockAssetLive> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
      return parsed as Record<string, PreStockAssetLive>;
    }
  } catch (err) {
    console.warn("[PreStocks] Failed to parse localStorage cache:", err);
  }
  return null;
}

/**
 * SSR-safe helper to persist the last successful payload to localStorage.
 */
function persistPayload(data: Record<string, PreStockAssetLive>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[PreStocks] Failed to save payload to localStorage:", err);
  }
}

/**
 * Static baseline captured directly from official https://prestocks.com/api/prestocks payload.
 * Used strictly when:
 * 1. Live API is unreachable AND
 * 2. Client has no cached payload in localStorage (e.g. first-time visit offline).
 * Never uses made-up or placeholder numbers.
 */
export const PRESTOCKS_FALLBACK: Record<string, PreStockAssetLive> = {
  OPENAI: {
    symbol: "OPENAI",
    name: "OpenAI PreStocks",
    mint: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
    image: "https://www.prestocks.com/logos/openai.png",
    markPrice: 978.40620476,
    tokenPrice: 1123.37469359,
    markValuation: 1212177090680,
    impliedValuation: 1391782943723,
    supply: 2826.491246835395,
    premiumPct: 14.82,
  },
  ANTHROPIC: {
    symbol: "ANTHROPIC",
    name: "Anthropic PreStocks",
    mint: "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw",
    image: "https://www.prestocks.com/logos/anthropic.png",
    markPrice: 1021.07156044,
    tokenPrice: 999.56947059,
    markValuation: 1672864732050,
    impliedValuation: 1637636948638,
    supply: 7381.90393041,
    premiumPct: -2.11,
  },
  SPACEX: {
    symbol: "SPACEX",
    name: "SpaceX PreStocks",
    mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
    image: "https://www.prestocks.com/logos/spacex.png",
    markPrice: 152.23002267,
    tokenPrice: 120.580318,
    markValuation: 1995904741663,
    impliedValuation: 1580941947101,
    supply: 43712.57638766999,
    premiumPct: -20.79,
  },
  ANDURIL: {
    symbol: "ANDURIL",
    name: "Anduril PreStocks",
    mint: "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB",
    image: "https://www.prestocks.com/logos/anduril.png",
    markPrice: 153.63620076,
    tokenPrice: 153.86593214,
    markValuation: 135921801978,
    impliedValuation: 136125045111,
    supply: 11805.864798372,
    premiumPct: 0.15,
  },
  FIGUREAI: {
    symbol: "FIGUREAI",
    name: "Figure AI PreStocks",
    mint: "PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd",
    image: "https://www.prestocks.com/logos/figureai.png",
    markPrice: 181.10714999,
    tokenPrice: 179.97595482,
    markValuation: 39486245701,
    impliedValuation: 39239614631,
    supply: 3012.928748456,
    premiumPct: -0.62,
  },
  KALSHI: {
    symbol: "KALSHI",
    name: "Kalshi PreStocks",
    mint: "PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua",
    image: "https://www.prestocks.com/logos/kalshi.png",
    markPrice: 885.90630625,
    tokenPrice: 907.61781908,
    markValuation: 32222231157,
    impliedValuation: 33011923453,
    supply: 904.89829863,
    premiumPct: 2.45,
  },
  NEURALINK: {
    symbol: "NEURALINK",
    name: "Neuralink PreStocks",
    mint: "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S",
    image: "https://www.prestocks.com/logos/neuralink.png",
    markPrice: 323.38637079,
    tokenPrice: 393.49694758,
    markValuation: 61603502713,
    impliedValuation: 74959220510,
    supply: 2595.340150415,
    premiumPct: 21.68,
  },
  POLYMARKET: {
    symbol: "POLYMARKET",
    name: "Polymarket PreStocks",
    mint: "Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP",
    image: "https://www.prestocks.com/logos/polymarket.png",
    markPrice: 144.39222493,
    tokenPrice: 144.34786872,
    markValuation: 14240793422,
    impliedValuation: 14236418757,
    supply: 4817.186733388,
    premiumPct: -0.03,
  },
};

/**
 * Synchronous getter returning the best available PreStocks data:
 * 1. In-memory cache
 * 2. SSR-safe localStorage cached payload
 * 3. Static authentic baseline
 */
export function getLastKnownPreStocks(): Record<string, PreStockAssetLive> {
  if (cachedPreStocks) return cachedPreStocks;
  const stored = getStoredPayload();
  if (stored) return stored;
  return PRESTOCKS_FALLBACK;
}

/**
 * Fetch the latest live catalog of PreStocks from official API.
 * Dynamic hierarchy:
 * 1. Live API (prestocks.com/api/prestocks) -> updates memory + localStorage
 * 2. If down -> returns in-memory cache or localStorage last successful payload
 * 3. If no cache -> returns PRESTOCKS_FALLBACK (authentic baseline snapshot)
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
      console.warn(`[PreStocks] API returned ${res.status}, falling back to last known payload`);
      return getLastKnownPreStocks();
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return getLastKnownPreStocks();
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
    persistPayload(map);
    return map;
  } catch (err) {
    console.warn("[PreStocks] Fetch failed:", err);
    return getLastKnownPreStocks();
  }
}
