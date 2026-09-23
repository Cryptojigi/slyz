<div align="center">
  <img src="./public/slyzlogo.png" alt="Slyz Logo" width="90" height="90" style="border-radius: 16px; margin-bottom: 12px;" />
  <h1>Slyz</h1>
  <p><strong>Slice the Market. Own the Theme.</strong></p>
  <p><em>Non-custodial, fractional thematic stock basket investing and stock gifting on Solana.</em></p>

  <p>
    <a href="https://useslyz.vercel.app"><img src="https://img.shields.io/badge/Live_App-useslyz.vercel.app-CDE06A?style=for-the-badge&logo=vercel&logoColor=0B0E14" alt="Live App" /></a>
    <img src="https://img.shields.io/badge/Solana-Mainnet--Beta-8D8AFF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana Mainnet" />
    <img src="https://img.shields.io/badge/Standard-Token--2022-14F195?style=for-the-badge" alt="Token-2022" />
    <img src="https://img.shields.io/badge/DEX-Jupiter_Lite-F87171?style=for-the-badge&logo=target" alt="Jupiter Lite" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  </p>
</div>

---

<div align="center">
  <img src="./public/slyz-preview.png" alt="Slyz Application Preview" width="100%" style="border-radius: 16px; border: 1px solid #262D3D; box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />
</div>

---

## The Problem

Investing in stocks on-chain today is fragmented, confusing, and impractical for most people:

1. **No easy way to invest thematically.** You want exposure to "AI" or "Big Tech" as a theme, but you're forced to research individual tickers, find the right tokenized versions, and execute separate swap transactions for each one. On traditional brokerages this takes a few clicks; on-chain it takes dozens.

2. **Two separate markets, zero unified experience.** Public equities (Apple, Nvidia, Tesla) live on one set of protocols (xStocks), while private pre-IPO companies (SpaceX, OpenAI, Anthropic) live on a completely different one (PreStocks). Each has different token decimals, different fee structures, and different liquidity pools. No existing tool combines them.

3. **Rebalancing is a nightmare.** When your portfolio drifts from target weights, the only option is manual selling and re-buying -- creating taxable events, paying swap fees twice, and losing to slippage on every trade.

4. **You can't gift stocks to anyone.** Want to send a friend $50 in Tesla shares for their birthday? There's no way to do it. You'd have to walk them through setting up a wallet, finding the right token, and executing a swap themselves.

5. **Token-2022 complexity is hidden but dangerous.** Many tokenized stocks use Solana's Token-2022 standard with features like transfer fees (1% on every transfer) and scaled UI multipliers that change over time. If an app doesn't handle these correctly, users silently lose money -- receiving fewer shares than expected, or having claims fail entirely because the vault math is wrong.

---

## What Slyz Solves

**Slyz is a non-custodial web app that lets anyone invest in curated stock baskets and gift fractional shares to friends -- all on Solana, with a few clicks.**

Here's what that means in plain terms:

- **Pick a theme, enter an amount, done.** Select "AI Frontier" or "The Mag 3", type `$50`, and Slyz automatically splits your USDC across 3 stocks, executes each swap through Jupiter, and deposits the tokenized shares directly into your wallet. You never hold custody with Slyz -- it's your wallet, your keys, your shares.

- **Public and private stocks in one place.** Slyz supports 10 public equities (NVDA, AAPL, MSFT, TSLA, AMZN, META, GOOGL, SPY, QQQ, COIN) and 8 private pre-IPO companies (OpenAI, Anthropic, SpaceX, Anduril, Figure AI, Kalshi, Neuralink, Polymarket) through a single unified interface.

- **Rebalance without selling.** Slyz tracks how far each holding has drifted from its target weight and uses a "water-filling" algorithm to route 100% of new deposits into the underweight assets. Zero sells, zero extra tax events, zero unnecessary slippage.

- **Gift stock to anyone with a link.** Send fractional shares of any tokenized stock as an expiring claim link. The recipient just connects their Solana wallet and clicks "Claim" -- they don't need to already own the token. The gift link uses a non-custodial ephemeral vault: a temporary keypair is generated client-side, the secret key is embedded in the URL hash fragment (never sent to any server), and the sender funds the vault with shares and enough SOL to cover the recipient's claim transaction.

- **Token-2022 math done right.** Slyz dynamically reads each token's on-chain capabilities (scaled UI multipliers, transfer fee basis points) and accounts for them everywhere: gift creation, claiming, reclaiming, and display. Escrow link gifts correctly calculate the double-transfer fee (sender to vault, vault to recipient = 0.99 x 0.99 = 0.9801 net for assets with 1% transfer fees). The recipient always sees the exact net amount they'll receive.

---

## Features

### Thematic Basket Investing

| Basket | Market | Assets | Thesis |
|---|---|---|---|
| **The Mag 3** | Public (xStocks) | NVDA 40%, AAPL 30%, MSFT 30% | Core mega-cap enterprise tech and mobile compute. |
| **The Index** | Public (xStocks) | SPY 50%, QQQ 30%, AAPL 20% | Broad US market and large-cap tech index blend. |
| **AI Frontier** | Public (xStocks) | NVDA 40%, MSFT 30%, GOOGL 30% | Full-stack AI exposure: compute, hyperscalers, models. |
| **High Beta** | Public (xStocks) | TSLA 40%, NVDA 30%, COIN 30% | High-volatility momentum in tech, mobility, and crypto. |
| **Big Commerce** | Public (xStocks) | AMZN 40%, META 30%, GOOGL 30% | Digital ad monopolies and global logistics platforms. |
| **Frontier** | Private (PreStocks) | OpenAI 40%, Anthropic 35%, SpaceX 25% | Direct exposure to the most valuable private tech companies. |

You can also build custom baskets with 2 to 4 public equities using the **Slyz Studio**, with interactive allocation sliders and a live donut chart.

### Stock Gifting

- **Link Gifts (Escrow):** Generate a claim URL with an expiring timer (7 min to 24 hrs). The shares sit in a temporary non-custodial vault until claimed. If unclaimed, the sender can reclaim them.
- **Direct Gifts:** Send shares straight to a friend's Solana wallet address. One transfer, no escrow.
- **Transfer Fee Transparency:** For PreStocks assets that carry a 1% issuer transfer fee, the exact net amount is shown upfront before the sender confirms. Link gifts account for the double-transfer path; direct gifts account for the single-transfer path.
- **Vault Sponsorship:** The sender deposits 0.0035 SOL into the ephemeral vault to cover the recipient's claim transaction network fees and account rent -- the recipient pays nothing.

### Portfolio Management

- **Real-Time Drift Tracking:** Reads live Token-2022 account balances directly from Solana mainnet, calculates current value via Jupiter oracle prices, and compares against target weights.
- **Smart Top-Up Rebalancing:** Water-filling algorithm routes new deposits into underweight assets only. No selling, no unnecessary tax events.
- **Exit to USDC:** Full or partial liquidation back into USDC with sequential swap execution.
- **Cost Basis and PnL:** Track unrealized profit/loss against acquisition cost.

### On-Chain Safety

- **Non-Custodial:** Slyz never holds user funds or private keys. Every transaction is built client-side and signed by the user's own wallet.
- **Preflight Simulation:** All gifting transactions are simulated before broadcast. Clear error messages for frozen accounts, paused transfers, insufficient balance, and hook failures.
- **Impact Guard:** PreStocks purchases are capped with slippage guards and order limits to defend against thin AMM pool liquidity.
- **Live Mint Verification:** An included verification script (`scripts/verify-mints.mjs`) compares all 18 on-chain Token-2022 mint configurations against the app's static fallback table to catch multiplier or fee drift before deployment.

---

## Architecture

### Dual-Sleeve Model

Slyz bridges two separate token ecosystems through a unified investment and gifting engine:

```
                         +-----------------------+
                         |   Investor's Wallet   |
                         |      (USDC + SOL)     |
                         +----------+------------+
                                    |
                         +----------v------------+
                         |  Slyz Allocation Engine|
                         |  (Client-Side Only)   |
                         +-----+----------+------+
                               |          |
              +----------------+          +----------------+
              |                                            |
   +----------v-----------+                  +-------------v----------+
   | Public Equities Shelf|                  | Private Pre-IPO Shelf  |
   |     (xStocks)        |                  |     (PreStocks)        |
   |-----------------------|                  |------------------------|
   | 8-decimal Token-2022 |                  | 9-decimal Token-2022   |
   | 0% transfer fee      |                  | 1% transfer fee (100bp)|
   | Scaled UI multipliers|                  | Scaled UI multipliers  |
   |-----------------------|                  |------------------------|
   | NVDAx  AAPLx  MSFTx  |                  | OpenAI    Anthropic    |
   | TSLAx  AMZNx  METAx  |                  | SpaceX    Anduril      |
   | GOOGLx SPYx   QQQx   |                  | Figure AI Kalshi      |
   | COINx                 |                  | Neuralink Polymarket   |
   +----------+------------+                  +-------------+----------+
              |                                            |
              +----------------+          +----------------+
                               |          |
                         +-----v----------v------+
                         |   Jupiter Lite API     |
                         |   (Swap Aggregation)   |
                         +----------+------------+
                                    |
                         +----------v------------+
                         |   Solana Mainnet       |
                         |   (Token-2022 Program) |
                         +-----------------------+
```

### Gifting Flow

```
  LINK GIFT (Escrow):
  Sender --> [Fund Vault TX] --> Ephemeral Vault ATA
                                      |
                                 Claim URL with
                                 secret key in #hash
                                      |
                              Recipient clicks link
                                      |
                              [Claim TX signed by vault keypair]
                                      |
                              Recipient ATA <-- shares
                              Recipient    <-- swept SOL


  DIRECT GIFT:
  Sender --> [TransferChecked TX] --> Recipient ATA
```

### Token-2022 Capability Resolution

The app resolves each mint's live configuration from chain data at runtime:

1. **Scaled UI Multiplier** -- converts between "display shares" (what the user sees) and "raw base units" (what the blockchain stores). For example, OPENAI has a multiplier of ~1.486, meaning 1 display share = 1/1.486 raw base units. These multipliers change over time as issuers adjust them.

2. **Transfer Fee BPS** -- PreStocks assets charge 100 basis points (1%) per transfer, withheld from the receiving account. The app reads this from the mint's `transferFeeConfig` extension, not from a static table.

Results are cached for 60 seconds to avoid RPC spam. Static fallback values are baked in for offline/degraded scenarios.

---

## Verified Mainnet Transaction Proof

Live on-chain settlement proof for "The Mag 3" basket (sequential 3-leg execution):

| Leg | Asset | Allocation | Status | Solscan Link |
|---|---|---|---|---|
| 1 | `NVDAx` | $2.60 (40%) | Finalized | [`38mKMuae...4fJXX6d1`](https://solscan.io/tx/38mKMuaeCuPEhfx7ykvd9r33wET5pkd76XNxBCUzCsg7Fn2fcBjeDEbA4QCuY5dZwkFsXWEPTELRQXf44fJXX6d1) |
| 2 | `AAPLx` | $1.95 (30%) | Finalized | [`2sQuCfa8...2Hn31qbrft`](https://solscan.io/tx/2sQuCfa8MnrwpdC8NnRbkDFz1kqbqnigVVKy6m9WcdzGeh1mf2pVaH87gxPzB4RNyPCosoPc4hxZQz2Hn31qbrft) |
| 3 | `MSFTx` | $1.95 (30%) | Finalized | [`4uwcwtC7...USdh1K8n`](https://solscan.io/tx/4uwcwtC7asRqGw8CGMR9vptnHDHXge6n6Zy7sUioLxRqpXpVRnyna4Tv6vEW8eRbZzqkiJaHEXJF5VCPUSdh1K8n) |

<br/>

<div align="center">
  <img src="./public/portfolio-preview.png" alt="Slyz Non-Custodial Portfolio and Drift Tracker on Solana Mainnet" width="100%" style="border-radius: 16px; border: 1px solid #262D3D; box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />
  <p><em>Real-Time Portfolio and Drift Tracker showing active Token-2022 holdings, allocation drift, and Jupiter oracle valuations.</em></p>
</div>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / App Router | [Next.js 14](https://nextjs.org/) (React 18, TypeScript) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) with custom design tokens |
| Charts | [Recharts](https://recharts.org/) + SVG Donut Allocator |
| Solana Web3 | `@solana/web3.js` and `@solana/spl-token` (Token-2022 program parsing) |
| Wallet Support | `@solana/wallet-adapter-react` (Phantom, Solflare, Backpack, WalletConnect, Mobile Wallet Adapter) |
| DEX Aggregator | [Jupiter Unified Lite API](https://lite-api.jup.ag) |
| Pre-IPO Data | [PreStocks REST API](https://prestocks.com/api/prestocks) (proxied server-side) |
| RPC | Dedicated Alchemy Solana Mainnet endpoint |
| Deployment | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- **Node.js** v18.17+ or v20.x
- **npm**, **yarn**, or **pnpm**
- A Solana wallet (Phantom, Solflare, etc.) funded with SOL and USDC

### 1. Clone

```bash
git clone https://github.com/Cryptojigi/slyz.git
cd slyz
```

### 2. Install

```bash
npm install --ignore-scripts
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Primary Solana RPC (Alchemy Mainnet recommended).
# The Alchemy app MUST allowlist the deployed origin (e.g. https://useslyz.vercel.app),
# otherwise both balance reads and transaction sends will fail.
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY

# Public site URL (used for metadata and wallet origin verification)
NEXT_PUBLIC_APP_URL=https://useslyz.vercel.app

# Solana cluster
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# Jupiter Swap API
NEXT_PUBLIC_JUPITER_API_URL=https://lite-api.jup.ag

# WalletConnect / Reown Cloud Project ID (optional, for mobile QR/deep links)
NEXT_PUBLIC_WC_PROJECT_ID=YOUR_REOWN_PROJECT_ID

# PreStocks upstream (optional override, defaults to https://prestocks.com/api/prestocks)
PRESTOCKS_API_URL=https://prestocks.com/api/prestocks
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Verify Mint Configuration

Before deploying, confirm all 18 token mint configurations match the chain:

```bash
node scripts/verify-mints.mjs
```

Expected output: `All mints match constants.ts. Safe to push.`

### 6. Production Build

```bash
npm run build
npm run start
```

---

## Project Structure

```
slyz/
  src/
    app/
      page.tsx              Landing page
      dashboard/            Basket explorer, swap terminal, studio
      portfolio/            Holdings, drift tracker, rebalancing, exits
      gift/
        page.tsx            Gift hub (create gifts, track sent vaults)
        claim/page.tsx      Gift claim page (recipient-facing)
      invest/[basketId]/    Per-basket investment execution page
      docs/                 Documentation page
      api/prestocks/        Server-side proxy for PreStocks API (CORS)
    components/
      GiftStockModal.tsx    Gift creation modal (link + direct)
      GiftCountdownClock.tsx  Live countdown timer for gift expiry
      LiveSlyzSculpture.tsx   Animated 3D landing page element
      ...
    lib/
      constants.ts          Verified stocks, baskets, Token-2022 capability resolver
      gifting.ts            Gift vault creation, claim, reclaim, simulation
      jupiter.ts            Jupiter Lite API integration (quotes, swaps, prices)
      solana.ts             Balance fetching, Token-2022 account parsing
      portfolio.ts          Portfolio position calculation, drift analysis
      prestocks.ts          PreStocks API client with 3-tier failover
    context/
      WalletBalanceContext.tsx   Global wallet balance state
  scripts/
    verify-mints.mjs        On-chain mint verification (run before deploy)
  public/
    slyzlogo.png            App icon
    slyz-preview.png        Landing page screenshot
    portfolio-preview.png   Portfolio screenshot
    ...                     Partner logos (Solana, Jupiter, xStocks, PreStocks)
```

---

## Security Model

| Principle | Implementation |
|---|---|
| **Non-Custodial** | Slyz never holds user funds or private keys. All transactions are built in the browser and signed by the user's wallet. |
| **Ephemeral Gift Vaults** | Gift link secret keys exist only in the URL hash fragment -- they are never sent to Slyz servers or stored in any database. |
| **Preflight Simulation** | Every gift transaction is simulated before broadcast. Simulation errors are parsed into human-readable messages (frozen account, paused transfers, insufficient balance). |
| **Impact Guard** | PreStocks purchases enforce slippage limits and order size caps to protect against thin AMM liquidity. |
| **Live Capability Verification** | On-chain multipliers and fee rates are read from the blockchain at runtime, not assumed from static values. |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>Built for the Solana ecosystem.</p>
</div>
