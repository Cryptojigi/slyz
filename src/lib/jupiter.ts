import { USDC_MINT, VERIFIED_STOCKS } from "./constants";

const JUPITER_API_URL = process.env.NEXT_PUBLIC_JUPITER_API_URL || "https://lite-api.jup.ag";

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null | any;
  priceImpactPct: string | number;
  routePlan: any[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface SwapTransactionResponse {
  swapTransaction: string; // Base64 serialized transaction
  lastValidBlockHeight?: number;
}

export interface TokenPriceInfo {
  usdPrice: number;
  priceChange24h: number;
  decimals: number;
  liquidity: number;
  scaledUiConfig?: {
    multiplier: number;
    newMultiplier?: number;
    newMultiplierEffectiveAt?: string;
  };
}

/**
 * Fetch swap quote from Jupiter Unified Lite API.
 * amount: Amount in base units (for USDC, dollar * 1_000_000).
 */
export async function getJupiterQuote(params: {
  inputMint?: string;
  outputMint: string;
  amount: number; // in base units
  slippageBps?: number;
}): Promise<QuoteResponse> {
  const inputMint = params.inputMint || USDC_MINT;
  const slippage = params.slippageBps ?? 50; // 0.5% default

  const url = `${JUPITER_API_URL}/swap/v1/quote?inputMint=${inputMint}&outputMint=${params.outputMint}&amount=${params.amount}&slippageBps=${slippage}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jupiter quote error (${res.status}): ${errText}`);
  }
  
  return await res.json();
}

/**
 * Request serialized swap transaction for wallet signing.
 */
export async function buildSwapTransaction(params: {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
}): Promise<SwapTransactionResponse> {
  const url = `${JUPITER_API_URL}/swap/v1/swap`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jupiter swap builder error (${res.status}): ${errText}`);
  }

  return await res.json();
}

const JUPITER_PRICES_STORAGE_KEY = "slyz_jupiter_prices_cache";

/**
 * SSR-safe helper to synchronously retrieve the last known Jupiter price snapshot from localStorage.
 */
export function getCachedJupiterPrices(): Record<string, TokenPriceInfo> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(JUPITER_PRICES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

/**
 * Persist the latest price snapshot to localStorage.
 */
export function saveCachedJupiterPrices(prices: Record<string, TokenPriceInfo>): void {
  if (typeof window === "undefined" || !prices || Object.keys(prices).length === 0) return;
  try {
    localStorage.setItem(JUPITER_PRICES_STORAGE_KEY, JSON.stringify(prices));
  } catch (_) {}
}

/**
 * Fetch live USD prices, 24h changes, and Token-2022 scaled-ui-amount multipliers in a single roundtrip.
 */
export async function getJupiterPrices(mintAddresses?: string[]): Promise<Record<string, TokenPriceInfo>> {
  // Never pass PreStocks mints to Jupiter Price v3 (PreStocks mints return 403 on Price API)
  const prestocksMints = new Set(
    Object.values(VERIFIED_STOCKS)
      .filter((s) => s.issuer === "prestocks")
      .map((s) => s.mint)
  );

  const candidateMints =
    mintAddresses && mintAddresses.length > 0
      ? mintAddresses
      : Object.values(VERIFIED_STOCKS)
          .filter((s) => s.issuer === "xstocks")
          .map((s) => s.mint);

  const mints = candidateMints.filter((m) => !prestocksMints.has(m));
  if (!mints.length) return getCachedJupiterPrices();
  const ids = mints.join(",");
  const url = `${JUPITER_API_URL}/price/v3?ids=${ids}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Price fetch failed with status: ${res.status}`);
      return getCachedJupiterPrices();
    }

    const data = await res.json();
    const prices: Record<string, TokenPriceInfo> = {};

    for (const [mint, info] of Object.entries<any>(data)) {
      if (info && typeof info.usdPrice === "number") {
        prices[mint] = {
          usdPrice: info.usdPrice,
          priceChange24h: info.priceChange24h || 0,
          decimals: info.decimals || 8,
          liquidity: info.liquidity || 0,
          scaledUiConfig: info.scaledUiConfig,
        };
      }
    }

    if (Object.keys(prices).length > 0) {
      saveCachedJupiterPrices(prices);
      return prices;
    }
  } catch (err) {
    console.warn("Error fetching Jupiter prices, using cached fallback:", err);
  }

  return getCachedJupiterPrices();
}

/**
 * Helper to convert a dollar amount to USDC base units (6 decimals).
 * Example: $25.50 -> 25,500,000 base units.
 */
export function toUsdcBaseUnits(dollarAmount: number): number {
  return Math.round(dollarAmount * 1_000_000);
}

/**
 * Helper to convert base units back to fractional shares or tokens.
 */
export function fromBaseUnits(amount: number | string, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}
