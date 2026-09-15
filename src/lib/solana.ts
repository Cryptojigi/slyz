import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { USDC_MINT, TOKEN_2022_PROGRAM_ID, MIN_SOL_BALANCE } from "./constants";

const PRIMARY_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com";
const FALLBACK_RPC_URL = "https://api.mainnet-beta.solana.com";

let primaryConn: Connection | null = null;
let fallbackConn: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (!primaryConn) {
    primaryConn = new Connection(PRIMARY_RPC_URL, "confirmed");
  }
  return primaryConn;
}

export function getFallbackConnection(): Connection {
  if (!fallbackConn) {
    fallbackConn = new Connection(FALLBACK_RPC_URL, "confirmed");
  }
  return fallbackConn;
}

export interface UserBalances {
  solBalance: number;
  usdcBalance: number;
  token2022Balances: Record<string, number>; // mint address -> raw token balance (decimal adjusted)
  hasSufficientGas: boolean;
}

/**
 * Fetch all relevant balances (SOL, USDC, and all held Token-2022 xStock assets).
 * Automatically fails over to fallback RPC if primary RPC is blocked by whitelist or CORS.
 */
export async function fetchUserBalances(walletPublicKey: PublicKey): Promise<UserBalances> {
  const primary = getSolanaConnection();

  try {
    return await queryBalances(primary, walletPublicKey);
  } catch (error: any) {
    // If blocked by Alchemy origin whitelist or network error, failover to public fallback
    console.warn("Primary RPC failed (likely origin whitelist restriction), failing over to backup RPC:", error?.message);
    try {
      const fallback = getFallbackConnection();
      return await queryBalances(fallback, walletPublicKey);
    } catch (fallbackError) {
      console.error("Both primary and fallback RPC failed:", fallbackError);
      return {
        solBalance: 0,
        usdcBalance: 0,
        token2022Balances: {},
        hasSufficientGas: false,
      };
    }
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
  for (const { account } of token2022Accounts.value) {
    const info = account.data.parsed.info;
    const mint = info.mint;
    const uiAmount = Number(info.tokenAmount.uiAmount || 0);
    if (uiAmount > 0) {
      token2022Balances[mint] = uiAmount;
    }
  }

  return {
    solBalance,
    usdcBalance,
    token2022Balances,
    hasSufficientGas: solBalance >= MIN_SOL_BALANCE,
  };
}
