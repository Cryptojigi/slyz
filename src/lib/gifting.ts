import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import {
  VERIFIED_STOCKS,
  TOKEN_2022_PROGRAM_ID,
  displaySharesToRawUnits,
  rawUnitsToDisplayShares,
  calculateNetShares,
  resolveMintCapabilities,
} from "./constants";

export type GiftTheme = "gold" | "lime" | "purple";
export type GiftDeliveryType = "link" | "direct";
export type GiftStatus = "pending_unlock" | "ready_to_claim" | "claimed" | "expired" | "reclaimed";

export interface GiftClaimPayload {
  id: string;
  symbol: string;
  shareAmount: number;
  netShareAmount?: number;
  feeBps?: number;
  rawAmountString?: string;
  netRawAmountString?: string;
  estimatedUsd: number;
  senderName: string;
  senderPublicKey: string;
  note: string;
  unlockTimestamp: number; // Unix seconds. 0 = instant
  expiryTimestamp: number; // Unix seconds
  theme: GiftTheme;
  secretKeyBase58: string;
  vaultPublicKey: string;
}

export interface SentGiftRecord {
  id: string;
  symbol: string;
  shareAmount: number;
  netShareAmount?: number;
  feeBps?: number;
  rawAmountString?: string;
  netRawAmountString?: string;
  estimatedUsd: number;
  senderName: string;
  senderPublicKey: string;
  recipientAddressOrDomain?: string;
  deliveryType: GiftDeliveryType;
  claimUrl?: string;
  vaultPublicKey?: string;
  secretKeyBase58?: string;
  txSignature: string;
  createdAt: number;
  unlockTimestamp: number;
  expiryTimestamp: number;
  status: GiftStatus;
  theme: GiftTheme;
  note: string;
}

/**
 * Simulates a Solana transaction and maps raw failure codes to user-friendly messages.
 */
export async function simulateAndValidateTransaction(
  connection: Connection,
  transaction: Transaction,
  feePayer: PublicKey
): Promise<void> {
  transaction.feePayer = feePayer;
  if (!transaction.recentBlockhash) {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
  }

  const simulation = await connection.simulateTransaction(transaction);
  if (simulation.value.err) {
    const err = simulation.value.err;
    const logs = simulation.value.logs?.join("\n") || "";
    console.error("Simulation failed:", err, logs);

    if (
      logs.includes("custom program error: 0x1") ||
      logs.includes("insufficient funds") ||
      logs.includes("InsufficientFunds")
    ) {
      throw new Error(
        "Insufficient share or SOL balance to process this transaction."
      );
    }
    if (
      logs.includes("custom program error: 0x11") ||
      logs.includes("AccountFrozen") ||
      logs.includes("frozen")
    ) {
      throw new Error("This token account is frozen by the issuer.");
    }
    if (logs.includes("paused") || logs.includes("Paused")) {
      throw new Error(
        "Transfers for this asset are temporarily paused by the token issuer."
      );
    }
    if (logs.includes("TransferHook") || logs.includes("hook")) {
      throw new Error("Transfer hook validation failed for this asset.");
    }
    if (logs.includes("AccountNotFound")) {
      throw new Error(
        "Token account not found. Please ensure you hold this asset before gifting."
      );
    }
    throw new Error(
      `Transaction simulation failed: ${
        typeof err === "object" ? JSON.stringify(err) : String(err)
      }`
    );
  }
}

const STORAGE_KEY_SENT_GIFTS = "slyz_sent_gifts";
const TOKEN_2022_PK = new PublicKey(TOKEN_2022_PROGRAM_ID);

/**
 * Generate a secure, non-custodial claim URL.
 * The ephemeral secret key is stored ONLY in the URL hash fragment (#gift=...)
 * so it is never sent to any server over HTTP.
 */
export function generateGiftClaimUrl(payload: GiftClaimPayload): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const rawJson = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(rawJson));
  return `${baseUrl}/gift/claim#gift=${encoded}`;
}

/**
 * Parse and validate the gift payload from the browser window hash.
 */
export function parseGiftClaimFromHash(hashString: string): GiftClaimPayload | null {
  try {
    const cleanHash = hashString.startsWith("#") ? hashString.slice(1) : hashString;
    const match = cleanHash.match(/gift=([^&]+)/);
    if (!match || !match[1]) return null;

    const decoded = decodeURIComponent(atob(match[1]));
    const parsed = JSON.parse(decoded) as GiftClaimPayload;

    if (!parsed.symbol || !parsed.vaultPublicKey || !parsed.secretKeyBase58) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.error("Failed to parse gift claim payload:", err);
    return null;
  }
}

/**
 * Retrieve all sent gifts from localStorage.
 */
export function getStoredSentGifts(): SentGiftRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENT_GIFTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading sent gifts:", err);
    return [];
  }
}

/**
 * Save a newly sent gift record to localStorage.
 */
export function saveSentGift(gift: SentGiftRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredSentGifts();
    const updated = [gift, ...existing.filter((g) => g.id !== gift.id)];
    localStorage.setItem(STORAGE_KEY_SENT_GIFTS, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving sent gift:", err);
  }
}

/**
 * Update the status of a sent gift record.
 */
export function updateSentGiftStatus(id: string, status: GiftStatus): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredSentGifts();
    const updated = existing.map((g) => (g.id === id ? { ...g, status } : g));
    localStorage.setItem(STORAGE_KEY_SENT_GIFTS, JSON.stringify(updated));
  } catch (err) {
    console.error("Error updating sent gift status:", err);
  }
}

/**
 * Build the transaction that funds a Gift Claim Link.
 * Bundles:
 * 1. Transfer 0.0035 SOL to the ephemeral vault (to cover future recipient ATA rent + network fees).
 * 2. Idempotent ATA creation for the ephemeral vault.
 * 3. TransferChecked of the token shares from sender to the vault.
 */
export async function buildFundGiftLinkTransaction(params: {
  connection: Connection;
  senderPublicKey: PublicKey;
  symbol: string;
  shareAmount: number;
  rawAmountString?: string;
  vaultKeypair: Keypair;
}): Promise<{
  transaction: Transaction;
  baseUnits: bigint;
  netBaseUnits: bigint;
  netShares: number;
  decimals: number;
  feeBps: number;
}> {
  const { connection, senderPublicKey, symbol, shareAmount, rawAmountString, vaultKeypair } = params;
  const asset = VERIFIED_STOCKS[symbol];
  if (!asset) {
    throw new Error(`Unknown stock asset: ${symbol}`);
  }

  const mint = new PublicKey(asset.mint);
  const decimals = asset.decimals;
  const caps = await resolveMintCapabilities(connection, symbol);
  const feeBps = caps.feeBps;

  // Exact baseUnits honoring the multiplier if rawAmountString is omitted
  const baseUnits =
    rawAmountString && rawAmountString !== "0"
      ? BigInt(rawAmountString)
      : displaySharesToRawUnits(shareAmount, symbol, caps.multiplier);

  if (baseUnits <= BigInt(0)) {
    throw new Error("Invalid share amount for gifting.");
  }

  const feeUnitsFor = (u: bigint) =>
    feeBps > 0 ? (u * BigInt(feeBps) + BigInt(9999)) / BigInt(10000) : BigInt(0);

  // TWO fee-bearing transfers on the escrow path: sender→vault, then vault→recipient
  const afterVaultUnits = baseUnits - feeUnitsFor(baseUnits);
  const netBaseUnits = afterVaultUnits - feeUnitsFor(afterVaultUnits);
  const netShares = rawUnitsToDisplayShares(netBaseUnits, symbol, caps.multiplier);

  const senderAta = getAssociatedTokenAddressSync(mint, senderPublicKey, false, TOKEN_2022_PK);
  const vaultAta = getAssociatedTokenAddressSync(mint, vaultKeypair.publicKey, false, TOKEN_2022_PK);

  const transaction = new Transaction();

  // 1. Fund the vault with 0.0035 SOL for claiming network fees & rent
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: vaultKeypair.publicKey,
      lamports: 3_500_000, // 0.0035 SOL
    })
  );

  // 2. Create the vault's Token-2022 ATA idempotently
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      senderPublicKey,
      vaultAta,
      vaultKeypair.publicKey,
      mint,
      TOKEN_2022_PK
    )
  );

  // 3. Checked Token-2022 transfer from sender to vault
  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      mint,
      vaultAta,
      senderPublicKey,
      baseUnits,
      decimals,
      [],
      TOKEN_2022_PK
    )
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = senderPublicKey;

  return { transaction, baseUnits, netBaseUnits, netShares, decimals, feeBps };
}

/**
 * Build a Direct Gift Transfer transaction (send straight to friend's wallet address).
 */
export async function buildDirectGiftTransferTransaction(params: {
  connection: Connection;
  senderPublicKey: PublicKey;
  recipientPublicKey: PublicKey;
  symbol: string;
  shareAmount: number;
  rawAmountString?: string;
}): Promise<{
  transaction: Transaction;
  baseUnits: bigint;
  netBaseUnits: bigint;
  netShares: number;
  decimals: number;
  feeBps: number;
}> {
  const { connection, senderPublicKey, recipientPublicKey, symbol, shareAmount, rawAmountString } =
    params;
  const asset = VERIFIED_STOCKS[symbol];
  if (!asset) {
    throw new Error(`Unknown stock asset: ${symbol}`);
  }

  const mint = new PublicKey(asset.mint);
  const decimals = asset.decimals;
  const caps = await resolveMintCapabilities(connection, symbol);
  const feeBps = caps.feeBps;

  const baseUnits =
    rawAmountString && rawAmountString !== "0"
      ? BigInt(rawAmountString)
      : displaySharesToRawUnits(shareAmount, symbol, caps.multiplier);

  if (baseUnits <= BigInt(0)) {
    throw new Error("Invalid share amount for gifting.");
  }

  const feeUnits = feeBps > 0 ? (baseUnits * BigInt(feeBps) + BigInt(9999)) / BigInt(10000) : BigInt(0);
  const netBaseUnits = baseUnits > feeUnits ? baseUnits - feeUnits : BigInt(0);
  const netShares = rawUnitsToDisplayShares(netBaseUnits, symbol, caps.multiplier);

  const senderAta = getAssociatedTokenAddressSync(mint, senderPublicKey, false, TOKEN_2022_PK);
  const recipientAta = getAssociatedTokenAddressSync(
    mint,
    recipientPublicKey,
    false,
    TOKEN_2022_PK
  );

  const transaction = new Transaction();

  // 1. Idempotently create recipient ATA funded by sender
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      senderPublicKey,
      recipientAta,
      recipientPublicKey,
      mint,
      TOKEN_2022_PK
    )
  );

  // 2. TransferChecked of shares
  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      mint,
      recipientAta,
      senderPublicKey,
      baseUnits,
      decimals,
      [],
      TOKEN_2022_PK
    )
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = senderPublicKey;

  return { transaction, baseUnits, netBaseUnits, netShares, decimals, feeBps };
}

/**
 * Execute claiming a gift link into the recipient's wallet.
 * Signed entirely by the vault ephemeral keypair (the recipient doesn't even need SOL).
 */
export async function executeClaimGift(params: {
  connection: Connection;
  payload: GiftClaimPayload;
  recipientPublicKey: PublicKey;
}): Promise<string> {
  const { connection, payload, recipientPublicKey } = params;
 
  // Validate link expiration
  if (payload.expiryTimestamp && payload.expiryTimestamp > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.expiryTimestamp) {
      throw new Error("This gift claim link has expired. The time limit set by the sender has elapsed.");
    }
  }

  // Validate time lock
  if (payload.unlockTimestamp && payload.unlockTimestamp > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now < payload.unlockTimestamp) {
      const waitMinutes = Math.ceil((payload.unlockTimestamp - now) / 60);
      throw new Error(`This gift is time-locked and cannot be claimed yet. Please return in ${waitMinutes} minute(s).`);
    }
  }

  // Reconstitute the ephemeral vault keypair
  const secretKey = bs58.decode(payload.secretKeyBase58);
  const vaultKeypair = Keypair.fromSecretKey(secretKey);

  const asset = VERIFIED_STOCKS[payload.symbol];
  if (!asset) {
    throw new Error(`Unknown stock asset: ${payload.symbol}`);
  }

  const mint = new PublicKey(asset.mint);
  const decimals = asset.decimals;
  const caps = await resolveMintCapabilities(connection, payload.symbol);
  const feeBps = caps.feeBps;

  const vaultAta = getAssociatedTokenAddressSync(mint, vaultKeypair.publicKey, false, TOKEN_2022_PK);
  const recipientAta = getAssociatedTokenAddressSync(
    mint,
    recipientPublicKey,
    false,
    TOKEN_2022_PK
  );

  // 1. Fetch vault ATA's actual on-chain available balance
  let transferUnits: bigint = BigInt(0);
  try {
    const balanceInfo = await connection.getTokenAccountBalance(vaultAta, "confirmed");
    if (balanceInfo?.value?.amount) {
      transferUnits = BigInt(balanceInfo.value.amount);
    }
  } catch (err) {
    console.warn("Could not query vaultTokenBalance directly:", err);
  }

  // Fallback to payload amount if on-chain query returned empty/failed
  if (transferUnits === BigInt(0)) {
    if (payload.netRawAmountString && payload.netRawAmountString !== "0") {
      transferUnits = BigInt(payload.netRawAmountString);
    } else if (payload.rawAmountString && payload.rawAmountString !== "0") {
      const raw = BigInt(payload.rawAmountString);
      const withheld = feeBps > 0 ? (raw * BigInt(feeBps) + BigInt(9999)) / BigInt(10000) : BigInt(0);
      transferUnits = raw > withheld ? raw - withheld : raw;
    } else {
      const raw = displaySharesToRawUnits(payload.shareAmount, payload.symbol, caps.multiplier);
      const withheld = feeBps > 0 ? (raw * BigInt(feeBps) + BigInt(9999)) / BigInt(10000) : BigInt(0);
      transferUnits = raw > withheld ? raw - withheld : raw;
    }
  }

  if (transferUnits === BigInt(0)) {
    throw new Error("This gift vault holds 0 shares or has already been claimed.");
  }

  // Fetch vault SOL balance to sweep leftover rent back to recipient
  const vaultSolBalance = await connection.getBalance(vaultKeypair.publicKey);

  const transaction = new Transaction();

  // 1. Create recipient's Token-2022 ATA idempotently (paid by vault's SOL)
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      vaultKeypair.publicKey,
      recipientAta,
      recipientPublicKey,
      mint,
      TOKEN_2022_PK
    )
  );

  // 2. Transfer available net shares from vault to recipient
  transaction.add(
    createTransferCheckedInstruction(
      vaultAta,
      mint,
      recipientAta,
      vaultKeypair.publicKey,
      transferUnits,
      decimals,
      [],
      TOKEN_2022_PK
    )
  );

  // 3. Close vault Token-2022 ATA to reclaim rent ONLY if no withheld transfer fees exist.
  // In Token-2022, closing an account with withheld transfer fees reverts with an error.
  if (feeBps === 0) {
    transaction.add(
      createCloseAccountInstruction(
        vaultAta,
        recipientPublicKey,
        vaultKeypair.publicKey,
        [],
        TOKEN_2022_PK
      )
    );
  }

  // 4. Sweep remaining SOL lamports from vault to recipient (35,000 lamport reserve for priority fees)
  const estimatedFee = 35_000;
  if (vaultSolBalance > estimatedFee + 10_000) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: vaultKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: vaultSolBalance - estimatedFee,
      })
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = vaultKeypair.publicKey;

  transaction.sign(vaultKeypair);

  // Preflight simulation before broadcast to capture errors cleanly
  await simulateAndValidateTransaction(connection, transaction, vaultKeypair.publicKey);

  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  const confirm = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  if (confirm.value.err) {
    throw new Error(`Claim confirmation failed: ${JSON.stringify(confirm.value.err)}`);
  }

  updateSentGiftStatus(payload.id, "claimed");
  return signature;
}

/**
 * Senders can reclaim an expired or unclaimed gift back to their wallet.
 */
export async function executeReclaimGift(params: {
  connection: Connection;
  giftRecord: SentGiftRecord;
  senderPublicKey: PublicKey;
}): Promise<string> {
  const { connection, giftRecord, senderPublicKey } = params;
  if (!giftRecord.secretKeyBase58) {
    throw new Error("Missing vault secret key for reclaim.");
  }

  const secretKey = bs58.decode(giftRecord.secretKeyBase58);
  const vaultKeypair = Keypair.fromSecretKey(secretKey);

  const asset = VERIFIED_STOCKS[giftRecord.symbol];
  if (!asset) {
    throw new Error(`Unknown stock asset: ${giftRecord.symbol}`);
  }

  const mint = new PublicKey(asset.mint);
  const decimals = asset.decimals;
  const caps = await resolveMintCapabilities(connection, giftRecord.symbol);
  const feeBps = caps.feeBps;

  const vaultAta = getAssociatedTokenAddressSync(mint, vaultKeypair.publicKey, false, TOKEN_2022_PK);
  const senderAta = getAssociatedTokenAddressSync(mint, senderPublicKey, false, TOKEN_2022_PK);

  // 1. Fetch available vault token balance
  let transferUnits: bigint = BigInt(0);
  try {
    const balanceInfo = await connection.getTokenAccountBalance(vaultAta, "confirmed");
    if (balanceInfo?.value?.amount) {
      transferUnits = BigInt(balanceInfo.value.amount);
    }
  } catch (err) {
    console.warn("Could not fetch on-chain vault token balance for reclaim:", err);
  }

  if (transferUnits === BigInt(0)) {
    if (giftRecord.netRawAmountString && giftRecord.netRawAmountString !== "0") {
      transferUnits = BigInt(giftRecord.netRawAmountString);
    } else {
      const raw = giftRecord.rawAmountString
        ? BigInt(giftRecord.rawAmountString)
        : displaySharesToRawUnits(giftRecord.shareAmount, giftRecord.symbol, caps.multiplier);
      const withheld = feeBps > 0 ? (raw * BigInt(feeBps) + BigInt(9999)) / BigInt(10000) : BigInt(0);
      transferUnits = raw > withheld ? raw - withheld : raw;
    }
  }

  if (transferUnits === BigInt(0)) {
    throw new Error("Vault holds zero shares to reclaim.");
  }

  const vaultSolBalance = await connection.getBalance(vaultKeypair.publicKey);

  const transaction = new Transaction();

  // 1. Ensure sender ATA exists
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      vaultKeypair.publicKey,
      senderAta,
      senderPublicKey,
      mint,
      TOKEN_2022_PK
    )
  );

  // 2. Transfer available shares back to sender
  transaction.add(
    createTransferCheckedInstruction(
      vaultAta,
      mint,
      senderAta,
      vaultKeypair.publicKey,
      transferUnits,
      decimals,
      [],
      TOKEN_2022_PK
    )
  );

  // 3. Close vault ATA only if feeBps === 0 (no withheld transfer fees)
  if (feeBps === 0) {
    transaction.add(
      createCloseAccountInstruction(
        vaultAta,
        senderPublicKey,
        vaultKeypair.publicKey,
        [],
        TOKEN_2022_PK
      )
    );
  }

  // 4. Sweep remaining SOL back to sender (35,000 lamport reserve)
  const estimatedFee = 35_000;
  if (vaultSolBalance > estimatedFee + 10_000) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: vaultKeypair.publicKey,
        toPubkey: senderPublicKey,
        lamports: vaultSolBalance - estimatedFee,
      })
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = vaultKeypair.publicKey;

  transaction.sign(vaultKeypair);

  // Preflight simulation before broadcast
  await simulateAndValidateTransaction(connection, transaction, vaultKeypair.publicKey);

  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  updateSentGiftStatus(giftRecord.id, "reclaimed");
  return signature;
}
