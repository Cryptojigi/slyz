import { PublicKey } from "@solana/web3.js";

export type MarketKind = "public" | "private";

export interface StockAsset {
  symbol: string;
  name: string;
  underlying: string;
  mint: string;
  decimals: number;
  logo: string;
  category: string;
  market: MarketKind;
  issuer: "xstocks" | "prestocks";
  transferFeeBps?: number;
  scaledUiMultiplier?: number;
}

export interface BasketComponent {
  symbol: string;
  targetWeight: number; // percentage (e.g. 40 for 40%)
}

export interface Basket {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  themeColor: string;
  market: MarketKind;
  image?: string;
  components: BasketComponent[];
}

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

// Minimum SOL required in wallet for creating new Token-2022 ATA accounts and fees (~0.015 SOL)
export const MIN_SOL_BALANCE = 0.015;

// Minimum SOL required for liquidating/selling positions (no new ATAs created, only swap tx fees ~0.00015 SOL)
export const MIN_LIQUIDATION_SOL = 0.0015;

export const VERIFIED_STOCKS: Record<string, StockAsset> = {
  // --- Public Listed Equities (xStocks - 8 decimals) ---
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA Corp",
    underlying: "NVDA",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/NVDAx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0017011968,
    transferFeeBps: 0,
  },
  AAPLx: {
    symbol: "AAPLx",
    name: "Apple Inc",
    underlying: "AAPL",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/AAPLx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0032690125,
  },
  MSFTx: {
    symbol: "MSFTx",
    name: "Microsoft Corp",
    underlying: "MSFT",
    mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/MSFTx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0059033905,
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla Inc",
    underlying: "TSLA",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/TSLAx.png",
    category: "growth",
    market: "public",
    issuer: "xstocks",
  },
  AMZNx: {
    symbol: "AMZNx",
    name: "Amazon.com Inc",
    underlying: "AMZN",
    mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/AMZNx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
  },
  METAx: {
    symbol: "METAx",
    name: "Meta Platforms",
    underlying: "META",
    mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/METAx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0028515433,
  },
  GOOGLx: {
    symbol: "GOOGLx",
    name: "Alphabet Inc",
    underlying: "GOOGL",
    mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/GOOGLx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0023772501,
  },
  SPYx: {
    symbol: "SPYx",
    name: "SPDR S&P 500 ETF",
    underlying: "SPY",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/SPYx.png",
    category: "index",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0057145603,
  },
  QQQx: {
    symbol: "QQQx",
    name: "Invesco QQQ Trust",
    underlying: "QQQ",
    mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/QQQx.png",
    category: "index",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0034560759,
  },
  COINx: {
    symbol: "COINx",
    name: "Coinbase Global",
    underlying: "COIN",
    mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/COINx.png",
    category: "crypto",
    market: "public",
    issuer: "xstocks",
  },

  // --- Expansion set: quote-verified at $2 USDC @ 50bps, impact < 5% ---
  CRCLx: {
    symbol: "CRCLx",
    name: "Circle xStock",
    underlying: "CRCL",
    mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/CRCLx.png",
    category: "fintech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  HOODx: {
    symbol: "HOODx",
    name: "Robinhood xStock",
    underlying: "HOOD",
    mint: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/HOODx.png",
    category: "fintech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  MSTRx: {
    symbol: "MSTRx",
    name: "MicroStrategy xStock",
    underlying: "MSTR",
    mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/MSTRx.png",
    category: "crypto-equity",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  GLDx: {
    symbol: "GLDx",
    name: "Gold xStock",
    underlying: "GLD",
    mint: "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/GLDx.png",
    category: "commodities",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  NFLXx: {
    symbol: "NFLXx",
    name: "Netflix xStock",
    underlying: "NFLX",
    mint: "XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/NFLXx.png",
    category: "consumer",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  MCDx: {
    symbol: "MCDx",
    name: "McDonald's xStock",
    underlying: "MCD",
    mint: "XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/MCDx.png",
    category: "consumer",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0161604345481776,
    transferFeeBps: 0,
  },
  PLTRx: {
    symbol: "PLTRx",
    name: "Palantir xStock",
    underlying: "PLTR",
    mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/PLTRx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  GMEx: {
    symbol: "GMEx",
    name: "Gamestop xStock",
    underlying: "GME",
    mint: "Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/GMEx.png",
    category: "consumer",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  STRCx: {
    symbol: "STRCx",
    name: "Strategy PP Variable xStock",
    underlying: "STRC",
    mint: "Xs78JED6PFZxWc2wCEPspZW9kL3Se5J7L5TChKgsidH",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/STRCx.png",
    category: "crypto-equity",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0808929977256367,
    transferFeeBps: 0,
  },
  INTCx: {
    symbol: "INTCx",
    name: "Intel xStock",
    underlying: "INTC",
    mint: "XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/INTCx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  AMDx: {
    symbol: "AMDx",
    name: "AMD xStock",
    underlying: "AMD",
    mint: "XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/AMDx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1,
    transferFeeBps: 0,
  },
  ORCLx: {
    symbol: "ORCLx",
    name: "Oracle xStock",
    underlying: "ORCL",
    mint: "XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/ORCLx.png",
    category: "tech",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0068751347045037,
    transferFeeBps: 0,
  },
  JPMx: {
    symbol: "JPMx",
    name: "JPMorgan Chase xStock",
    underlying: "JPM",
    mint: "XsMAqkcKsUewDrzVkait4e5u4y8REgtyS7jWgCpLV2C",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/JPMx.png",
    category: "finance",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0107444463984723,
    transferFeeBps: 0,
  },
  Vx: {
    symbol: "Vx",
    name: "Visa xStock",
    underlying: "V",
    mint: "XsqgsbXwWogGJsNcVZ3TyVouy2MbTkfCFhCGGGcQZ2p",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/Vx.png",
    category: "payments",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0053649367805917,
    transferFeeBps: 0,
  },
  UNHx: {
    symbol: "UNHx",
    name: "UnitedHealth xStock",
    underlying: "UNH",
    mint: "XszvaiXGPwvk2nwb3o9C1CX4K6zH8sez11E6uyup6fe",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/UNHx.png",
    category: "healthcare",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0229655423325776,
    transferFeeBps: 0,
  },
  WMTx: {
    symbol: "WMTx",
    name: "Walmart xStock",
    underlying: "WMT",
    mint: "Xs151QeqTCiuKtinzfRATnUESM2xTU6V9Wy8Vy538ci",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/WMTx.png",
    category: "consumer",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0055069408636728,
    transferFeeBps: 0,
  },
  KOx: {
    symbol: "KOx",
    name: "Coca-Cola xStock",
    underlying: "KO",
    mint: "XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/KOx.png",
    category: "consumer",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0183317967386898,
    transferFeeBps: 0,
  },
  XOMx: {
    symbol: "XOMx",
    name: "Exxon Mobil xStock",
    underlying: "XOM",
    mint: "XsaHND8sHyfMfsWPj6kSdd5VwvCayZvjYgKmmcNL5qh",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/XOMx.png",
    category: "energy",
    market: "public",
    issuer: "xstocks",
    scaledUiMultiplier: 1.0130866005227463,
    transferFeeBps: 0,
  },

  // --- Pre-IPO Private Market Exposure (PreStocks - 9 decimals) ---
  OPENAI: {
    symbol: "OPENAI",
    name: "OpenAI PreStocks",
    underlying: "OpenAI",
    mint: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/openai.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
    scaledUiMultiplier: 1.4861347,
  },
  ANTHROPIC: {
    symbol: "ANTHROPIC",
    name: "Anthropic PreStocks",
    underlying: "Anthropic",
    mint: "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/anthropic.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
  },
  SPACEX: {
    symbol: "SPACEX",
    name: "SpaceX PreStocks",
    underlying: "SpaceX",
    mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/spacex.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
    scaledUiMultiplier: 5,
  },
  ANDURIL: {
    symbol: "ANDURIL",
    name: "Anduril PreStocks",
    underlying: "Anduril",
    mint: "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/anduril.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
  },
  FIGUREAI: {
    symbol: "FIGUREAI",
    name: "Figure AI PreStocks",
    underlying: "Figure AI",
    mint: "PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/figureai.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
  },
  KALSHI: {
    symbol: "KALSHI",
    name: "Kalshi PreStocks",
    underlying: "Kalshi",
    mint: "PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/kalshi.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
  },
  NEURALINK: {
    symbol: "NEURALINK",
    name: "Neuralink PreStocks",
    underlying: "Neuralink",
    mint: "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/neuralink.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
  },
  POLYMARKET: {
    symbol: "POLYMARKET",
    name: "Polymarket PreStocks",
    underlying: "Polymarket",
    mint: "Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP",
    decimals: 9,
    logo: "https://www.prestocks.com/logos/polymarket.png",
    category: "preipo",
    market: "private",
    issuer: "prestocks",
    transferFeeBps: 100,
  },
};

export const PUBLIC_XSTOCK_COUNT =
  Object.values(VERIFIED_STOCKS).filter((s) => s.issuer === "xstocks").length;

// Only mints with confirmed liquidity (<5% impact on Jupiter) are executable in v1
export const EXECUTABLE_PRIVATE_SYMBOLS = ["OPENAI", "ANTHROPIC", "SPACEX"] as const;

export function isPreStock(symbol: string): boolean {
  return VERIFIED_STOCKS[symbol]?.issuer === "prestocks";
}

// ─── On-chain Token-2022 capability resolution ──────────────────────────────
export interface MintCapabilities {
  multiplier: number;
  feeBps: number;
  source: "chain" | "table";
}

const CAP_TTL_MS = 60_000;
const capabilityCache = new Map<string, { caps: MintCapabilities; at: number }>();

/**
 * Read the mint's live Token-2022 capabilities (scaled-UI multiplier + transfer fee).
 * The chain is the source of truth; the static table is an offline fallback only.
 * Results are cached for 60s to avoid RPC spam.
 */
export async function resolveMintCapabilities(
  connection: { getParsedAccountInfo: (pk: any) => Promise<any> },
  symbol: string
): Promise<MintCapabilities> {
  const asset = VERIFIED_STOCKS[symbol];
  const fallback: MintCapabilities = {
    multiplier: asset?.scaledUiMultiplier ?? 1,
    feeBps: asset?.transferFeeBps ?? (asset && asset.market === "private" ? 100 : 0),
    source: "table",
  };
  if (!asset) return fallback;

  const cached = capabilityCache.get(symbol);
  if (cached && Date.now() - cached.at < CAP_TTL_MS) return cached.caps;

  try {
    const resp = await connection.getParsedAccountInfo(new PublicKey(asset.mint));
    const info = (resp?.value as any)?.data?.parsed?.info;
    if (!info) return fallback;

    const exts: Record<string, any> = {};
    for (const e of info.extensions ?? []) exts[e.extension] = e.state ?? {};

    const sc = exts.scaledUiAmountConfig ?? {};
    const cur = Number(sc.multiplier ?? 1) || 1;
    const next = Number(sc.newMultiplier ?? cur) || cur;
    const effTs = Number(sc.newMultiplierEffectiveTimestamp ?? 0) || 0;
    const nowSec = Math.floor(Date.now() / 1000);
    const multiplier = effTs && nowSec >= effTs ? next : cur;

    const tf = exts.transferFeeConfig ?? {};
    const feeBps =
      Number(
        tf.newerTransferFee?.transferFeeBasisPoints ??
          tf.olderTransferFee?.transferFeeBasisPoints ??
          0
      ) || 0;

    const caps: MintCapabilities = { multiplier, feeBps, source: "chain" };
    capabilityCache.set(symbol, { caps, at: Date.now() });
    return caps;
  } catch {
    return fallback;
  }
}

export function getEffectiveMultiplier(symbol: string): number {
  const cached = capabilityCache.get(symbol);
  if (cached) return cached.caps.multiplier;
  return VERIFIED_STOCKS[symbol]?.scaledUiMultiplier ?? 1;
}

export function getTransferFeeBps(symbol: string): number {
  const cached = capabilityCache.get(symbol);
  if (cached) return cached.caps.feeBps;
  return VERIFIED_STOCKS[symbol]?.transferFeeBps ?? (isPreStock(symbol) ? 100 : 0);
}

export function displaySharesToRawUnits(
  shares: number,
  symbol: string,
  multiplierOverride?: number
): bigint {
  const asset = VERIFIED_STOCKS[symbol];
  if (!asset || shares <= 0) return BigInt(0);
  const multiplier = multiplierOverride ?? getEffectiveMultiplier(symbol);
  const decimals = asset.decimals;
  const rawBase = Math.floor((shares / multiplier) * Math.pow(10, decimals));
  return BigInt(Math.max(1, rawBase));
}

export function rawUnitsToDisplayShares(
  rawUnits: bigint | string | number,
  symbol: string,
  multiplierOverride?: number
): number {
  const asset = VERIFIED_STOCKS[symbol];
  if (!asset) return 0;
  const multiplier = multiplierOverride ?? getEffectiveMultiplier(symbol);
  const rawNum = Number(rawUnits);
  return (rawNum / Math.pow(10, asset.decimals)) * multiplier;
}

export function calculateNetShares(
  grossShares: number,
  symbol: string,
  transfers: 1 | 2 = 1
): { netShares: number; feeShares: number; feeBps: number; hasFee: boolean } {
  const feeBps = getTransferFeeBps(symbol);
  const factor = (10000 - feeBps) / 10000;
  const netShares = grossShares * Math.pow(factor, transfers);
  return {
    netShares,
    feeShares: grossShares - netShares,
    feeBps,
    hasFee: feeBps > 0,
  };
}

export const CURATED_BASKETS: Basket[] = [
  // --- Public Equity Pies (xStocks) ---
  {
    id: "mag-3",
    name: "The Mag 3",
    tagline: "The bedrock of modern enterprise & computing",
    description: "Concentrated exposure in the three highest-capitalization technology giants in the world: Nvidia, Apple, and Microsoft.",
    category: "Big Tech",
    themeColor: "#CDE06A",
    market: "public",
    image: "/images/themes/mag-3.jpg",
    components: [
      { symbol: "NVDAx", targetWeight: 40 },
      { symbol: "AAPLx", targetWeight: 30 },
      { symbol: "MSFTx", targetWeight: 30 },
    ],
  },
  {
    id: "the-index",
    name: "The Index",
    tagline: "Classic market foundation with a high-growth tech tilt",
    description: "Broad macro stability via SPY paired with the innovation horsepower of Nasdaq-100 and Apple.",
    category: "Foundational",
    themeColor: "#8D8AFF",
    market: "public",
    image: "/images/themes/the-index.jpg",
    components: [
      { symbol: "SPYx", targetWeight: 50 },
      { symbol: "QQQx", targetWeight: 30 },
      { symbol: "AAPLx", targetWeight: 20 },
    ],
  },
  {
    id: "ai-frontier",
    name: "AI Frontier",
    tagline: "Compute hardware, cloud infrastructure, and foundation models",
    description: "The complete artificial intelligence value stack: Nvidia GPU compute, Microsoft OpenAI partnership, and Google DeepMind.",
    category: "AI & Future",
    themeColor: "#CDE06A",
    market: "public",
    image: "/images/themes/ai-frontier.jpg",
    components: [
      { symbol: "NVDAx", targetWeight: 40 },
      { symbol: "MSFTx", targetWeight: 30 },
      { symbol: "GOOGLx", targetWeight: 30 },
    ],
  },
  {
    id: "high-beta",
    name: "High Beta",
    tagline: "Maximum volatility, momentum, and crypto-native synergy",
    description: "High-octane growth assets combining EV disruption, AI dominance, and on-chain economy gateway Coinbase.",
    category: "Risk-On",
    themeColor: "#8D8AFF",
    market: "public",
    image: "/images/themes/high-beta.jpg",
    components: [
      { symbol: "TSLAx", targetWeight: 40 },
      { symbol: "NVDAx", targetWeight: 30 },
      { symbol: "COINx", targetWeight: 30 },
    ],
  },
  {
    id: "big-commerce",
    name: "Big Commerce",
    tagline: "Digital advertising monopolies & global logistics infrastructure",
    description: "Own the pipelines of global consumer spending, cloud infrastructure, and social engagement.",
    category: "Consumer Tech",
    themeColor: "#CDE06A",
    market: "public",
    image: "/images/themes/big-commerce.jpg",
    components: [
      { symbol: "AMZNx", targetWeight: 40 },
      { symbol: "METAx", targetWeight: 30 },
      { symbol: "GOOGLx", targetWeight: 30 },
    ],
  },
  {
    id: "payments",
    name: "Payments & Fintech",
    tagline: "Global payment rails and digital settlement",
    description: "Dominant payment processing networks and money transfer infrastructure: Visa, JPMorgan Chase, and Circle.",
    category: "Payments",
    themeColor: "#8D8AFF",
    market: "public",
    image: "/images/themes/payments.jpg",
    components: [
      { symbol: "Vx", targetWeight: 40 },
      { symbol: "JPMx", targetWeight: 30 },
      { symbol: "CRCLx", targetWeight: 30 },
    ],
  },
  {
    id: "consumer",
    name: "Consumer Giants",
    tagline: "Essential retail, global beverages, and streaming entertainment",
    description: "Everyday consumer staples and digital media powerhouse: Walmart, Coca-Cola, and Netflix.",
    category: "Consumer",
    themeColor: "#CDE06A",
    market: "public",
    image: "/images/themes/consumer.jpg",
    components: [
      { symbol: "WMTx", targetWeight: 40 },
      { symbol: "KOx", targetWeight: 30 },
      { symbol: "NFLXx", targetWeight: 30 },
    ],
  },
  {
    id: "hard-assets",
    name: "Hard Assets & Energy",
    tagline: "Commodity hedges, broad market index, and traditional energy",
    description: "Inflation resilience and real asset cash flows: Physical Gold, S&P 500 Index, and ExxonMobil.",
    category: "Hard Assets",
    themeColor: "#8D8AFF",
    market: "public",
    image: "/images/themes/hard-assets.jpg",
    components: [
      { symbol: "GLDx", targetWeight: 40 },
      { symbol: "SPYx", targetWeight: 30 },
      { symbol: "XOMx", targetWeight: 30 },
    ],
  },

  // --- Private Market Pies (PreStocks) ---
  {
    id: "frontier",
    name: "Frontier",
    tagline: "Private AI and space, one ticket",
    description: "Concentrated exposure in premier private venture giants: OpenAI, Anthropic, and SpaceX via verified PreStocks tokens.",
    category: "Pre-IPO",
    themeColor: "#8D8AFF",
    market: "private",
    image: "/images/themes/frontier.jpg",
    components: [
      { symbol: "OPENAI", targetWeight: 40 },
      { symbol: "ANTHROPIC", targetWeight: 35 },
      { symbol: "SPACEX", targetWeight: 25 },
    ],
  },
];
