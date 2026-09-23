#!/usr/bin/env node
/**
 * verify-mints.mjs — pre-push mint capability checker for Slyz.
 *
 * Compares the assumptions in src/lib/constants.ts (decimals, transferFeeBps,
 * scaledUiMultiplier) against what the mints actually report ON-CHAIN, and
 * exits non-zero if anything drifted.
 *
 * Why: Token-2022 issuers change capabilities over time (scheduled scaled-UI
 * multiplier updates, fee changes, new transfer-hook programs). Hardcoded
 * constants silently rot and gifts deliver the wrong share counts.
 *
 * Usage:  node scripts/verify-mints.mjs
 *         RPC_URL=https://your-rpc node scripts/verify-mints.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const here = dirname(fileURLToPath(import.meta.url));
const CONSTANTS = join(here, "..", "src", "lib", "constants.ts");

/** --- parse the registry out of constants.ts --- */
function parseRegistry(src) {
  const out = [];
  const re = /(\w+):\s*\{([\s\S]*?)\n  \}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, symbol, body] = m;
    const mint = body.match(/mint:\s*"([^"]+)"/);
    const decimals = body.match(/decimals:\s*(\d+)/);
    if (!mint || !decimals) continue;
    const fee = body.match(/transferFeeBps:\s*(\d+)/);
    const mult = body.match(/scaledUiMultiplier:\s*([\d.]+)/);
    out.push({
      symbol,
      mint: mint[1],
      decimals: Number(decimals[1]),
      declaredFeeBps: fee ? Number(fee[1]) : 0,
      declaredMultiplier: mult ? Number(mult[1]) : 1,
    });
  }
  return out;
}

/** --- one RPC round trip --- */
async function getMint(mint) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAccountInfo",
      params: [mint, { encoding: "jsonParsed" }],
    }),
  });
  const json = await res.json();
  const info = json?.result?.value?.data?.parsed?.info;
  if (!info) throw new Error("mint not parsed");
  const exts = {};
  for (const e of info.extensions ?? []) exts[e.extension] = e.state ?? {};
  const sc = exts.scaledUiAmountConfig ?? {};
  const cur = Number(sc.multiplier ?? 1) || 1;
  const next = Number(sc.newMultiplier ?? cur) || cur;
  const ts = Number(sc.newMultiplierEffectiveTimestamp ?? 0) || 0;
  const nowSec = Math.floor(Date.now() / 1000);
  const tf = exts.transferFeeConfig ?? {};
  const feeBps =
    Number(
      tf.newerTransferFee?.transferFeeBasisPoints ??
        tf.olderTransferFee?.transferFeeBasisPoints ??
        0
    ) || 0;
  return {
    decimals: Number(info.decimals),
    feeBps,
    effectiveMultiplier: ts && nowSec >= ts ? next : cur,
    hasHook: "transferHook" in exts,
    hookProgram: exts.transferHook?.programId ?? null,
    pausable: "pausableConfig" in exts,
    permanentDelegate: "permanentDelegate" in exts,
  };
}

const near = (a, b) => Math.abs(a - b) < 1e-9;

async function main() {
  const registry = parseRegistry(readFileSync(CONSTANTS, "utf8"));
  if (!registry.length) {
    console.error("Could not parse any assets from constants.ts — check the regex.");
    process.exit(2);
  }

  console.log(`Checking ${registry.length} mints on ${RPC_URL}\n`);
  console.log(
    "SYMBOL".padEnd(11) +
      "dec".padEnd(5) +
      "fee(decl/chain)".padEnd(17) +
      "mult(decl/chain)".padEnd(24) +
      "flags"
  );
  console.log("-".repeat(92));

  const problems = [];
  for (const a of registry) {
    try {
      const c = await getMint(a.mint);
      const flags = [];
      if (c.decimals !== a.decimals) flags.push("DECIMALS");
      if (!near(c.effectiveMultiplier, a.declaredMultiplier))
        flags.push("MULTIPLIER");
      if (c.feeBps !== a.declaredFeeBps) flags.push("FEE");
      if (c.hookProgram) flags.push("HOOK-ACTIVE");
      if (flags.length) problems.push({ symbol: a.symbol, declared: a, chain: c, flags });

      console.log(
        a.symbol.padEnd(11) +
          String(c.decimals).padEnd(5) +
          `${a.declaredFeeBps} / ${c.feeBps}`.padEnd(17) +
          `${a.declaredMultiplier} / ${c.effectiveMultiplier.toFixed(10)}`.padEnd(24) +
          (flags.length ? "⚠ " + flags.join(",") : "ok")
      );
    } catch (e) {
      problems.push({ symbol: a.symbol, flags: ["RPC-ERROR"], error: String(e) });
      console.log(a.symbol.padEnd(11) + `ERROR: ${e}`);
    }
  }

  console.log("\n" + "=".repeat(92));
  if (!problems.length) {
    console.log("✅ All mints match constants.ts. Safe to push.");
    return;
  }
  console.log(`❌ ${problems.length} mismatch(es):\n`);
  for (const p of problems) {
    console.log(`  ${p.symbol} — ${p.flags.join(", ")}`);
    if (p.chain) {
      console.log(
        `      declared: fee ${p.declared.declaredFeeBps} bps, mult ${p.declared.declaredMultiplier}`
      );
      console.log(
        `      on-chain: fee ${p.chain.feeBps} bps, mult ${p.chain.effectiveMultiplier}`
      );
    }
  }
  console.log(
    "\nFix: read capabilities on-chain (resolveMintCapabilities) instead of trusting constants."
  );
  process.exit(1);
}

main();
