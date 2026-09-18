# Slyz ⚡

> **Slice the market. Own the theme.**  
> Non-custodial, fractional thematic stock basket investing on Solana powered by xStocks and Jupiter.

---

## Overview

**Slyz** is a non-custodial, consumer-grade thematic stock basket investing protocol on Solana. Instead of researching individual tickers and manually executing fragmented trades across disparate liquidity pools, investors can select curated thematic baskets (or design custom portfolios), input a dollar amount in USDC, and acquire fractional shares of tokenized US equities with automated drift tracking and smart rebalancing.

Built natively for the **Stocklana 2026 Hackathon ($100K Main Track)** and the **$10,000 PreStocks Bounty Track**.

---

## Dual-Sleeve Architecture

Slyz introduces a dual-shelf design separating public tokenized equities from private venture markets:

1. **Public Equities Shelf (xStocks — $100K Track)**:
   * 10 verified US equities (NVDAx, AAPLx, MSFTx, TSLAx, AMZNx, METAx, GOOGLx, SPYx, QQQx, COINx).
   * 8-decimal Token-2022 Backed Finance standard.
   * Multi-stock real-time price trend curves and custom allocation sandbox.

2. **Private Pre-IPO Shelf (PreStocks — $10K Bounty Track)**:
   * **Strict PreStocks Contract Verification**: 100% verified mints sourced directly from official `https://prestocks.com/api/prestocks`. Zero unverified or third-party pre-IPO tokens.
   * **9-Decimal Token-2022 Precision**: Native handling for 9-decimal tokens with raw string base-unit accounting during swaps and liquidations to eliminate floating-point dust.
   * **Frontier Curated Basket**: First executable private pie allocating to premier venture giants: **OpenAI** (40%), **Anthropic** (35%), and **SpaceX** (25%) with default $5 USDC entry.
   * **Jupiter AMM Liquidity Gating (<5% Impact)**: Only mints with confirmed live pool liquidity (<5% price impact) are unlocked for automated multi-leg execution. The remaining 5 assets (Anduril, Figure AI, Kalshi, Neuralink, Polymarket) are cataloged in directory mode until pool depth expands.
   * **Regulatory & Mark-to-Market Clarity**: Clear disclosure of tokenized economic exposure (not equity, voting, or corporate dividends) alongside official mark price vs live token price comparisons.

---

## Key Features

* **Thematic Pies**:
  * **Public Equities (xStocks)**:
    * 🏛️ **The Mag 3**: NVDA (40%), AAPL (30%), MSFT (30%)
    * 📊 **The Index**: SPY (50%), QQQ (30%), AAPL (20%)
    * 🤖 **AI Frontier**: NVDA (40%), MSFT (30%), GOOGL (30%)
    * 🚀 **High Beta**: TSLA (40%), NVDA (30%), COIN (30%)
    * 🛒 **Big Commerce**: AMZN (40%), META (30%), GOOGL (30%)
  * **Private Pre-IPO (PreStocks)**:
    * 🌌 **Frontier**: OpenAI (40%), Anthropic (35%), SpaceX (25%)
* **Custom Slyz Studio**: Interactive sandbox to assemble personalized 2-to-4 stock baskets with auto-normalizing allocation sliders and live Donut chart visualization.
* **Sequential Swap Engine**: Multi-step transaction orchestration via Jupiter Unified Lite API (`lite-api.jup.ag`), eliminating Solana's 1232-byte MTU packet limits and bundled instruction caps with isolated leg retries and Solscan verification links.
* **Token-2022 Real-World Asset Integration**: Native accounting for both 8-decimal Backed xStocks and 9-decimal PreStocks on Solana, reading on-chain Token-2022 program accounts and displaying accurate fractional share quantities.
* **Smart Top-Up Rebalancing**: Innovative water-filling algorithm that routes 100% of new deposits into underweight assets to restore target weights with **zero sell fees and zero sell slippage**.
* **Exit to USDC Liquidation**: Seamlessly exit and liquidate any held basket back into USDC through sequential reverse swaps with real-time on-chain confirmation.
* **Modern Editorial Aesthetic**: High-contrast, tactile UI inspired by EventBeds (Volt Lime `#CDE06A`, Periwinkle `#8D8AFF`, Obsidian `#0B0E14`, clean bento cards).

---

## Tech Stack

* **Framework**: Next.js 14 (App Router, TypeScript)
* **Styling**: Tailwind CSS + Custom Design Tokens
* **Charts**: Recharts (Interactive SVG Donut Visualizer)
* **Solana**: `@solana/web3.js` + `@solana/wallet-adapter-react` (Wallet Standard)
* **DEX Aggregation**: Jupiter Swap Unified Lite API (`https://lite-api.jup.ag/swap/v1/`)
* **RPC**: Alchemy Solana Mainnet

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Cryptojigi/slyz.git
cd slyz
```

### 2. Install dependencies
```bash
npm install --ignore-scripts
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Alchemy Solana Mainnet RPC URL:
```env
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_JUPITER_API_URL=https://lite-api.jup.ag
NEXT_PUBLIC_XSTOCKS_API_URL=https://api.xstocks.fi
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Security & Secrets Policy
No private keys, wallet seed phrases, or sensitive API credentials are committed to this repository. All sensitive configuration is loaded via local environment variables strictly ignored by `.gitignore`.

---

## License
MIT License. Built for Stocklana 2026.
