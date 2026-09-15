export interface StockAsset {
  symbol: string;
  name: string;
  underlying: string;
  mint: string;
  decimals: number;
  logo: string;
  category: "tech" | "index" | "crypto" | "growth";
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
  components: BasketComponent[];
}

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

// Minimum SOL required in wallet for ATA rent + gas (~0.015 - 0.02 SOL)
export const MIN_SOL_BALANCE = 0.015;

export const VERIFIED_STOCKS: Record<string, StockAsset> = {
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA Corp",
    underlying: "NVDA",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/NVDA.png",
    category: "tech",
  },
  AAPLx: {
    symbol: "AAPLx",
    name: "Apple Inc",
    underlying: "AAPL",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/AAPL.png",
    category: "tech",
  },
  MSFTx: {
    symbol: "MSFTx",
    name: "Microsoft Corp",
    underlying: "MSFT",
    mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/MSFT.png",
    category: "tech",
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla Inc",
    underlying: "TSLA",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/TSLA.png",
    category: "growth",
  },
  AMZNx: {
    symbol: "AMZNx",
    name: "Amazon.com Inc",
    underlying: "AMZN",
    mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/AMZN.png",
    category: "tech",
  },
  METAx: {
    symbol: "METAx",
    name: "Meta Platforms",
    underlying: "META",
    mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/META.png",
    category: "tech",
  },
  GOOGLx: {
    symbol: "GOOGLx",
    name: "Alphabet Inc",
    underlying: "GOOGL",
    mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/GOOGL.png",
    category: "tech",
  },
  SPYx: {
    symbol: "SPYx",
    name: "SPDR S&P 500 ETF",
    underlying: "SPY",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/SPY.png",
    category: "index",
  },
  QQQx: {
    symbol: "QQQx",
    name: "Invesco QQQ Trust",
    underlying: "QQQ",
    mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/QQQ.png",
    category: "index",
  },
  COINx: {
    symbol: "COINx",
    name: "Coinbase Global",
    underlying: "COIN",
    mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
    decimals: 8,
    logo: "https://xstocks-metadata.backed.fi/logos/tokens/COIN.png",
    category: "crypto",
  },
};

export const CURATED_BASKETS: Basket[] = [
  {
    id: "mag-3",
    name: "The Mag 3",
    tagline: "The bedrock of modern enterprise & computing",
    description: "Concentrated exposure in the three highest-capitalization technology giants in the world: Nvidia, Apple, and Microsoft.",
    category: "Big Tech",
    themeColor: "#CDE06A",
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
    components: [
      { symbol: "AMZNx", targetWeight: 40 },
      { symbol: "METAx", targetWeight: 30 },
      { symbol: "GOOGLx", targetWeight: 30 },
    ],
  },
];
