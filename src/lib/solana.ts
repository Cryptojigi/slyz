import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { USDC_MINT, TOKEN_2022_PROGRAM_ID, MIN_SOL_BALANCE } from "./constants";

/**
 * Single-RPC configuration — by design, there is NO fallback provider.
 *
 * A public-mainnet fallback used to exist here. It was removed because that host
 * rate-limits (HTTP 429), and a silent failover to a throttled RPC produced fake
 * $0.00 balances with no visible error — a worse failure mode than an honest one.
 *
 * The Alchemy app MUST allowlist the deployed origin (e.g. https://useslyz.vercel.app),
 * otherwise both balance reads and transaction sends fail.
 */
const PRIMARY_RPC_URL =
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com";

if (!process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL) {
  // Loud, not silent. Without this the app would quietly use a rate-limited public
  // RPC and report $0 balances as though they were real.
  console.warn(
    "[Slyz] NEXT_PUBLIC_ALCHEMY_RPC_URL is not set — falling back to rate-limited public mainnet. Balances may be inaccurate.",
  );
}

let primaryConn: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (!primaryConn) {
    primaryConn = new Connection(PRIMARY_RPC_URL, "confirmed");
  }
  return primaryConn;
}

export interface UserBalances {
  solBalance: number;
  usdcBalance: number;
  token2022Balances: Record<string, number>; // mint address -> raw token balance (decimal adjusted)
  token2022RawAmounts?: Record<string, string>; // mint address -> exact on-chain base units string (no float rounding)
  hasSufficientGas: boolean;
  rpcError?: boolean;
}

/**
 * Fetch all relevant balances (SOL, USDC, and all held Token-2022 xStock assets).
 *
 * Single-RPC by design: there is NO fallback failover. If the RPC fails, this
 * returns `rpcError: true` so the UI can surface a real error rather than
 * silently reporting zero balances.
 */
export async function fetchUserBalances(walletPublicKey: PublicKey): Promise<UserBalances> {
  try {
    return await queryBalances(getSolanaConnection(), walletPublicKey);
  } catch (error: any) {
    console.error("[Slyz] RPC balance fetch failed:", error?.message);
    return {
      solBalance: 0,
      usdcBalance: 0,
      token2022Balances: {},
      token2022RawAmounts: {},
      hasSufficientGas: false,
      rpcError: true,
    };
  }
}

async function queryBalances(connection: Connection, walletPublicKey: PublicKey): Promise<UserBalances> {
  // 1. Fetch SOL balance
  const lamports = await connection.getBalance(walletPublicKey);
  const solBalance = lamports / LAMPORTS_PER_SOL;

  // 2. Fetch standard SPL token accounts (USDC)
  const splAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  let usdcBalance = 0;
  for (const { account } of splAccounts.value) {
    const info = account.data.parsed.info;
    if (info.mint === USDC_MINT) {
      usdcBalance = Number(info.tokenAmount.uiAmount || 0);
      break;
    }
  }

  // 3. Fetch Token-2022 accounts (all xStocks)
  const token2022ProgramId = new PublicKey(TOKEN_2022_PROGRAM_ID);
  const token2022Accounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
    programId: token2022ProgramId,
  });

  const token2022Balances: Record<string, number> = {};
  const token2022RawAmounts: Record<string, string> = {};
  for (const { account } of token2022Accounts.value) {
    const info = account.data.parsed.info;
    const mint = info.mint;
    const uiAmount = Number(info.tokenAmount.uiAmount || 0);
    if (uiAmount > 0) {
      token2022Balances[mint] = uiAmount;
      token2022RawAmounts[mint] = String(info.tokenAmount.amount || "0");
    }
  }

  return {
    solBalance,
    usdcBalance,
    token2022Balances,
    token2022RawAmounts,
    hasSufficientGas: solBalance >= MIN_SOL_BALANCE,
    rpcError: false,
  };
}
