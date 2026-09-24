#!/usr/bin/env node
/**
 * verify-execution-costs.mjs — measures the REAL cost of trading each asset and
 * flags any asset whose UI label disagrees with its measured cost.
 *
 * What it does: for each asset, quotes USDC -> token -> USDC (a full round trip at a
 * reference size) on Jupiter and reports the loss. That loss is the true cost of
 * entering and exiting, and it is what a "basket eligible" gate should be based on.
 *
 * Headline "liquidity" on Jupiter's token page is NOT execution cost: it measures how
 * much is deposited, not the spread you pay. A $249k-liquidity asset can still cost
 * ~2.8% to round-trip because small trades hit an order-book spread.
 *
 * Usage:  node scripts/verify-execution-costs.mjs
 *         node scripts/verify-execution-costs.mjs 250     # reference size in USDC
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const REFERENCE_USD = Number(process.argv[2] || 100);
const SLIPPAGE_BPS = 500;
const COST_LIMIT_PCT = 2.0; // basket-eligibility threshold (keep in sync with the app)

const here = dirname(fileURLToPath(import.meta.url));
const CONSTANTS = join(here, "..", "src", "lib", "constants.ts");

function parseRegistry(src) {
  const out = [];
  const re = /(\w+):\s*\{([\s\S]*?)\n  \}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, symbol, body] = m;
    const mint = body.match(/mint:\s*"([^"]+)"/);
    const market = body.match(/market:\s*"(\w+)"/);
    const fee = body.match(/transferFeeBps:\s*(\d+)/);
    if (!mint || !market) continue;
    out.push({
      symbol,
      mint: mint[1],
      market: market[1],
      transferFeeBps: fee ? Number(fee[1]) : 0,
    });
  }
  return out;
}

async function quote(inputMint, outputMint, amount) {
  const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${SLIPPAGE_BPS}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const d = await res.json();
  return d?.routePlan ? d : null;
}

async function cost(asset) {
  const buy = await quote(USDC, asset.mint, String(Math.round(REFERENCE_USD * 1e6)));
  if (!buy) return { available: false };
  const sell = await quote(asset.mint, USDC, buy.outAmount);
  if (!sell) return { available: false };
  const returned = Number(sell.outAmount) / 1e6;
  const roundTripPct = ((REFERENCE_USD - returned) / REFERENCE_USD) * 100;
  const transferFeePct = asset.transferFeeBps / 100;
  return {
    available: true,
    entryImpactPct: Number(buy.priceImpactPct) * 100,
    exitImpactPct: Number(sell.priceImpactPct) * 100,
    roundTripPct,
    transferFeePct,
    totalCostPct: roundTripPct + transferFeePct,
  };
}

async function main() {
  const assets = parseRegistry(readFileSync(CONSTANTS, "utf8")).filter(
    (a) => a.market === "private"
  );
  console.log(
    `Round-trip cost at $${REFERENCE_USD} (buy USDC->token, sell it straight back)\n`
  );
  console.log(
    "ASSET".padEnd(12) +
      "entry".padEnd(9) +
      "exit".padEnd(9) +
      "round-trip".padEnd(12) +
      "+fee".padEnd(8) +
      "TOTAL".padEnd(9) +
      "gate"
  );
  console.log("-".repeat(72));

  const rows = [];
  for (const a of assets) {
    const c = await cost(a);
    if (!c.available) {
      console.log(`${a.symbol.padEnd(12)} no route at this size — cost unknown`);
      rows.push({ symbol: a.symbol, total: null });
      continue;
    }
    const gate = c.totalCostPct <= COST_LIMIT_PCT ? "basket OK" : "direct only";
    console.log(
      a.symbol.padEnd(12) +
        `${c.entryImpactPct.toFixed(2)}%`.padEnd(9) +
        `${c.exitImpactPct.toFixed(2)}%`.padEnd(9) +
        `${c.roundTripPct.toFixed(2)}%`.padEnd(12) +
        `${c.transferFeePct.toFixed(2)}%`.padEnd(8) +
        `${c.totalCostPct.toFixed(2)}%`.padEnd(9) +
        gate
    );
    rows.push({ symbol: a.symbol, total: c.totalCostPct });
  }

  const priced = rows.filter((r) => r.total !== null).sort((x, y) => x.total - y.total);
  if (priced.length) {
    console.log("\nRanked cheapest → most expensive to round-trip:");
    for (const r of priced) {
      console.log(
        `  ${r.total.toFixed(2)}%  ${r.symbol}` +
          (r.total > COST_LIMIT_PCT ? "   <- would NOT clear a " + COST_LIMIT_PCT + "% gate" : "")
      );
    }
  }
  console.log(
    `\nGate threshold in this script: ${COST_LIMIT_PCT}%. Compare against whatever the UI labels claim.`
  );
}

main();
