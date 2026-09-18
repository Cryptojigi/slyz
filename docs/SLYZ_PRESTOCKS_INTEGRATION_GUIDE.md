# Slyz × PreStocks — Complete Integration Guide

> Send this whole file to the coding agent.
> Integrate **locally on Solana mainnet first**. Do not deploy Vercel until Frontier quotes work in the browser.
> Do **not** add Tessera, Clawpump, Meteora DBC, or any non-PreStocks pre-IPO mint.

---

## A. What we are building (plain language)

Slyz is already a **thematic basket app**.

- User picks a pie (e.g. Mag 3).
- Types a dollar amount in USDC.
- Signs **three** Jupiter swaps in a row.
- Tokens land in their wallet. Portfolio reads Token-2022 balances.

**xStocks** (Backed) = tokenized **listed** US stocks (`NVDAx`, `AAPLx`, `MSFTx`, …).
That is the original product and the Stocklana **$100K main track**. **Keep them. Do not remove them.**

**PreStocks** = tokenized **pre-IPO / private company** exposure (OpenAI, SpaceX, …).
Same buy machine, different mints, extra data (mark vs token price). This sleeve is for the PreStocks **$10K bounty**.

We are **not** building a second app. We add a **Private** shelf next to **Public**.

```
Slyz
  Public  → xStocks pies (Mag 3, Index, AI Frontier, …)   → main track
  Private → PreStocks pies only (Frontier first)          → PreStocks bounty
```

Honest copy only: these are **exposure tokens**, not shares, votes, or dividends. Never write "own OpenAI."

---

## B. Eligibility (PreStocks bounty)

Official rule:

> Projects that integrate any **non-PreStocks pre-IPO tokens** will be ineligible.

| Allowed | Forbidden |
| :--- | :--- |
| PreStocks mints from `prestocks.com/api/prestocks` | Tessera T-tokens |
| Existing **xStocks** (listed, not pre-IPO) | Any other pre-IPO brand |
| Jupiter + our sequential engine | Mixing Tessera + PreStocks in one repo |

xStocks may stay. Tessera may **not**.

---

## C. PreStocks inventory — what was actually verified

**Source of truth for the catalog:**
`GET https://prestocks.com/api/prestocks`
Fetched 18 September 2026. **8 objects.** No auth.

Older PreStocks blog posts name extra companies (xAI, Discord, Databricks, Kraken, Perplexity, …). Those names were **not** in this API response. **Do not invent pies from marketing pages.** Only these 8.

### All 8 from the live API

| Symbol | Name | Mint (`contract_address`) | Logo |
| :--- | :--- | :--- | :--- |
| ANDURIL | Anduril PreStocks | `PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB` | API `image` or `https://www.prestocks.com/logos/anduril.png` |
| ANTHROPIC | Anthropic PreStocks | `Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw` | `https://www.prestocks.com/logos/anthropic.png` |
| FIGUREAI | Figure AI PreStocks | `PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd` | `https://www.prestocks.com/logos/figureai.png` |
| KALSHI | Kalshi PreStocks | `PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua` | `https://www.prestocks.com/logos/kalshi.png` |
| NEURALINK | Neuralink PreStocks | `PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S` | `https://www.prestocks.com/logos/neuralink.png` |
| OPENAI | OpenAI PreStocks | `PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF` | `https://www.prestocks.com/logos/openai.png` |
| POLYMARKET | Polymarket PreStocks | `Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP` | `https://www.prestocks.com/logos/polymarket.png` |
| SPACEX | SpaceX PreStocks | `PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh` | `https://www.prestocks.com/logos/spacex.png` |

### API object fields (use these names)

Each element includes at least:

- `name`, `symbol`, `description`, `image`, `external_url`
- `contract_address` — Solana mint
- `markPrice` — issuer reference price
- `tokenPrice` — market / token price
- `markValuation`, `impliedValuation`, `supply`

**Premium %** = `(tokenPrice - markPrice) / markPrice * 100`
Positive = token rich to mark. Negative = cheap to mark. Show this on Private cards.

Example snapshot from that fetch (numbers move; do not hardcode as live UI prices):

- OPENAI `markPrice` ~972.96 · `tokenPrice` ~1084.07
- SPACEX `markPrice` ~155.59 · `tokenPrice` ~121.90 (token was **cheap** to mark)
- ANTHROPIC mark ~1018.15 · token ~1011.52

### On-chain checks (mainnet `getAccountInfo`)

| Symbol | Account exists | Owner | Decimals | Program |
| :--- | :--- | :--- | :--- | :--- |
| OPENAI | Yes | Token-2022 `TokenzQdBNbLqP5V…` | **9** | spl-token-2022 |
| ANTHROPIC | Yes | Token-2022 | **9** | spl-token-2022 |
| SPACEX | Yes | Token-2022 | **9** | spl-token-2022 |
| ANDURIL | Yes | Token-2022 | **9** | spl-token-2022 |
| FIGUREAI, KALSHI, NEURALINK, POLYMARKET | Not separately probed | Confirm with `getAccountInfo` before first trade; expect Token-2022 / 9 decimals | | |

xStocks in this repo are **8 decimals**. PreStocks are **9**. Do not reuse xStock decimal math on sell/liquidate.

USDC stays `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`, **6 decimals**.
`$2` → `2000000` base units for Jupiter `amount`.

### Jupiter $2 USDC → token quotes

**Successful (18 Sep 2026, Lite API):**

| Symbol | Quote | Venue | `priceImpactPct` as fraction | approx impact |
| :--- | :--- | :--- | :--- | :--- |
| OPENAI | Yes | Manifest | ~0.0101 | ~1.0% |
| ANTHROPIC | Yes | Meteora DLMM | ~0.0183 | ~1.8% |
| SPACEX | Yes | Meteora DLMM | ~0.0208 | ~2.1% |

**Not quoted (this is not the same as failed):**
ANDURIL, FIGUREAI, KALSHI, NEURALINK, POLYMARKET.

A later burst of 8 quotes returned Jupiter Lite **429 Rate limit exceeded** even on OPENAI. Lite is easy to trip. When testing, space quotes (~2s+) or use one mint at a time.

**Jupiter Price v3** (`/price/v3?ids=`) returned **403** on these PreStocks mints when tried.
**Do not use Price v3 for PreStocks UI.** Use PreStocks API `tokenPrice` / `markPrice`. Use Jupiter **quote** only when executing.

### How the agent must treat the 8

| Use | Symbols |
| :--- | :--- |
| **v1 buy pie (Frontier)** | OPENAI, ANTHROPIC, SPACEX only |
| Constants + API catalog | All 8 |
| Add to a **second pie** or Private custom | Only after a live Jupiter quote for that mint succeeds here |
| Never | Tessera or any mint not on the PreStocks API |

If a quote returns no route or impact `> 0.05` (5%), do not put that mint in an executable basket.

---

## D. Product spec

### v1 basket — Frontier (executable)

```
id:            frontier
market:        private
name:          Frontier
tagline:       Private AI and space, one ticket
category:      Pre-IPO
themeColor:    #8D8AFF
components:
  OPENAI     40%
  ANTHROPIC  35%
  SPACEX     25%
```

Default invest amount on Private: **$5**. Recommended cap until you measure impact: **$25**.
Mag 3 impact on $2–$10 was ~0%. Frontier at $2 was already ~1–2%. Smaller size is part of the product.

### Optional later pies (not v1)

Only if each leg quotes under 5% impact:

- Defense — ANDURIL / FIGUREAI / NEURALINK
- Markets — KALSHI / POLYMARKET / + one quoted name

Do not ship Invest buttons for these until quotes exist.

### Information architecture

```
/                  landing — one extra line is enough: public xStocks + private PreStocks
/dashboard         toggle Public | Private
/invest/[basketId] already generic; works for `frontier`
/portfolio         issuer badge: xStock | PreStock; PreStock rows show vs-mark
```

- Public tab = existing `market: "public"` pies only.
- Private tab = PreStocks pies only (Frontier).
- **Custom Studio stays xStocks-only in v1.**

### Frontier card UI

- Logos + weights
- `tokenPrice` from API
- Chip: `+X.X% vs mark` or `-X.X% vs mark`
- Default $5
- Fine print: "PreStocks = tokenized pre-IPO exposure, not equity."

Hide the 3-stock theme chart on Private if you have no honest candle source. **No fake charts.**

### Portfolio / top-up / liquidate

- Wallet Token-2022 scan already picks up PreStocks mints.
- Map mint → symbol via `VERIFIED_STOCKS`.
- Smart Top-Up: same dollar-leg filter (`>= $1`).
- Liquidate: **`tokenAmount.amount` raw string**, not `uiAmount * 10^9`.
- PreStocks have 9 decimals; xStocks 8. The raw string avoids that class of bug.

---

## E. Copy

Use:

- "Private AI and space, one ticket."
- "Tokenized pre-IPO exposure via PreStocks."
- "Mark $X · Token $Y · ±Z% vs mark."

Do not use:

- "Own OpenAI / SpaceX."
- "Shares of …"
- "Robinhood for pre-IPO."
- Tessera, Clawpump, DBC on this sleeve.

Private + Invest footer:

> PreStocks provide economic exposure only. Not equity, votes, or dividends. Issuer terms restrict some jurisdictions (including US persons). The user is responsible for eligibility.

---

## F. Code changes

Repo: `https://github.com/Cryptojigi/slyz`
Existing engine: `src/lib/jupiter.ts` (Lite `https://lite-api.jup.ag`), `ExecutionModal`, `solana.ts` Token-2022 read.

### F.1 New `src/lib/prestocks.ts`

```ts
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

export async function fetchPreStocksLive(): Promise<Record<string, PreStockAssetLive>> {
  const res = await fetch(PRESTOCKS_API, { cache: "no-store" });
  if (!res.ok) throw new Error(`PreStocks API ${res.status}`);
  const rows = await res.json();
  const map: Record<string, PreStockAssetLive> = {};
  for (const row of rows) {
    const mark = Number(row.markPrice) || 0;
    const token = Number(row.tokenPrice) || 0;
    map[row.symbol] = {
      symbol: row.symbol,
      name: row.name,
      mint: row.contract_address,
      image: row.image,
      markPrice: mark,
      tokenPrice: token,
      markValuation: row.markValuation,
      impliedValuation: row.impliedValuation,
      supply: row.supply,
      premiumPct: mark > 0 ? ((token - mark) / mark) * 100 : 0,
    };
  }
  return map;
}
```

In-memory cache 30–60 seconds. On failure: hardcoded mints + "mark unavailable"; still allow quote-time execution.

### F.2 `src/lib/constants.ts`

Extend types (do not break Mag 3):

```ts
export type MarketKind = "public" | "private";

export interface StockAsset {
  symbol: string;
  name: string;
  underlying: string;
  mint: string;
  decimals: number;
  logo: string;
  category: "tech" | "index" | "crypto" | "growth" | "preipo";
  market: MarketKind;
  issuer: "xstocks" | "prestocks";
}

export interface Basket {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  themeColor: string;
  market: MarketKind;
  components: BasketComponent[];
}
```

- Every existing xStock + existing pie: `market: "public"`, `issuer: "xstocks"`, decimals **8**.
- All 8 PreStocks in `VERIFIED_STOCKS`: `market: "private"`, `issuer: "prestocks"`, decimals **9**.
- Add **only** the Frontier basket as executable `market: "private"`.
- Helper: `isPreStock(symbol)`.
- `EXECUTABLE_PRIVATE_SYMBOLS = ["OPENAI","ANTHROPIC","SPACEX"]` so Invest cannot run an unquoted name.

### F.3 `src/lib/jupiter.ts`

- Keep Lite hosts.
- Buy: USDC 6dp → PreStock mint.
- Do not call Price v3 for PreStocks.
- `priceImpactPct` is a **decimal fraction**. Existing modal: warn `> 0.025`, block `> 0.05`. Keep that.

### F.4 `src/lib/solana.ts`

Already loads all Token-2022 accounts. Do not filter the wallet read to xStock mints only. Keep `token2022RawAmounts`.

`ExecutionModal` uses `useConnection()` (primary RPC only). Fallback env does not cover sends unless the wallet adapter endpoint is that working RPC.

### F.5 `src/lib/portfolio.ts`

For PreStocks display price, inject `tokenPrice` from `fetchPreStocksLive()` into the same `usdPrice` slot the page already passes. Do not apply xStock scaled-ui multipliers.

### F.6 `src/app/dashboard/page.tsx`

- `marketFilter: "public" | "private"`
- Filter `CURATED_BASKETS` by `market`
- Private default amounts **5**
- Load PreStocks API when Private is selected
- Do not show High Beta / Custom on the Private tab

### F.7 `src/app/invest/[basketId]/page.tsx`

- If `basket.market === "private"`: breakdown uses API token + mark + premium
- Slippage copy **1.0% max** matching `slippageBps: 100`
- Min invest **$5** if the floor is still $10
- Extra line on private: "Pre-IPO tokens can move more than listed xStocks."

### F.8 `src/components/ExecutionModal.tsx` (required fixes, still open)

1. `useState(() => legs.filter...)` is stale. Reset steps when `isOpen` flips true **or** `legs` change.
2. `if (!isOpen || steps.length === 0) return null` swallows the click. If open and no legs: "Nothing to swap" + close.
3. Reuse dollar legs `amountUsd >= 1`.

### F.9 Cards, portfolio, liquidation, landing, README

- Badge `Pre-IPO` vs `xStock`
- Liquidation: pass `rawAmountString` from `token2022RawAmounts[mint]`
- Landing: one sentence, no new sculpture
- README: Private markets bullet + "exposure not equity" + Frontier composition

### F.10 Out of scope in this pass

Tessera, Clawpump, DBC, Pyth, new programs, backend, Custom Studio for PreStocks, Price v3 for PreStocks, devnet.

---

## G. Local test plan (mainnet only)

Devnet does **not** have these mints. Phantom / Backpack must be on **Mainnet**.

Need in wallet for a real fill: about **$5–$8 USDC** + **~0.02 SOL** (gas + new Token-2022 ATAs).

### G.1 API + one quote (no wallet)

```bash
curl -s "https://prestocks.com/api/prestocks" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d),[x['symbol'] for x in d])"

curl -s "https://lite-api.jup.ag/swap/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF&amount=2000000&slippageBps=100"
```

Expect 8 symbols and an OPENAI `outAmount`. If 429, wait and retry one mint.

### G.2 UI

1. `npm run dev`
2. `/dashboard` → Private → Frontier shows 3 names + vs-mark
3. `/invest/frontier` breakdown live
4. Connect mainnet wallet
5. Stepper at $5: three legs, no $0
6. Reject first signature → Retry works
7. Optional: **$2 OPENAI-only** smoke tx before full Frontier
8. `/portfolio` shows the PreStock + raw amount + vs-mark

### G.3 Build

`npm run build` exit 0. Mag 3 public path still works (regression click).

### G.4 Do not

- Switch RPC to devnet
- Deploy Vercel before Private quotes work
- Enable Invest on unquoted symbols
- Default Private size to $100

---

## H. Agent checklist (order)

1. `prestocks.ts` + typed constants for all 8 + Frontier pie (3 executable)
2. Dashboard Public / Private
3. Invest private pricing + premium
4. ExecutionModal reset + empty-state
5. Portfolio badge + vs-mark; liquidate raw amounts
6. README + landing one-liner
7. Local quote + optional $2–$5 mainnet fill (paste Solscan in the commit message)
8. Vercel only after 7

---

## I. Success criteria

- Mag 3 unchanged and still executable
- Frontier quotes OPENAI + ANTHROPIC + SPACEX
- Private UI shows mark vs token from the official API
- Zero Tessera / non-PreStocks pre-IPO mints in the repo
- Unquoted 5 names are catalog-only until a quote lands
- Build clean
- At least one mainnet test signature on a PreStock mint before deploy

That is the full spec: every mint we have, what was proven, what was not, and exactly how it plugs into Slyz.
