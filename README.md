# Slyz ⚡

> **Slice the market. Own the theme.**  
> Non-custodial, fractional thematic stock basket investing on Solana powered by xStocks and Jupiter.

---

## Overview

**Slyz** brings the intuitive "Pies" investing experience of M1 Finance and Robinhood to Solana. Instead of researching individual tickers and executing fragmented trades, retail investors can select curated thematic baskets (or build their own), input a dollar amount in USDC, and acquire fractional shares in a single seamless flow.

Built for the **Stocklana 2026 Hackathon ($100K Main Track)**.

---

## Key Features

* **Thematic Pies**: Curated 3-stock thematic baskets designed around high-conviction macro trends:
  * 🏛️ **The Mag 3**: NVDA (40%), AAPL (30%), MSFT (30%)
  * 📊 **The Index**: SPY (50%), QQQ (30%), AAPL (20%)
  * 🤖 **AI Frontier**: NVDA (40%), MSFT (30%), GOOGL (30%)
  * 🚀 **High Beta**: TSLA (40%), NVDA (30%), COIN (30%)
  * 🛒 **Big Commerce**: AMZN (40%), META (30%), GOOGL (30%)
* **Custom Slyz Studio**: Interactive sandbox to assemble personalized 2-to-4 stock baskets with auto-normalizing allocation sliders and live Donut chart visualization.
* **Sequential Swap Engine**: Multi-step transaction orchestration via Jupiter Unified Lite API (`lite-api.jup.ag`), avoiding Solana's 1232-byte transaction MTU limits and eliminating partial-fill rollback risks.
* **Token-2022 Scaled-UI Precision**: True share-equivalent calculations integrating corporate actions and split multipliers directly from Jupiter v3 price oracles.
* **Smart Top-Up Rebalancing**: Innovative water-filling algorithm that routes 100% of new deposits into underweight assets to restore target weights with **zero sell fees and zero sell slippage**.
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
