import crypto from "crypto";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5-minute replay window
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Builds the canonical message string that the wallet must sign.
 */
export function buildAuthMessage(timestamp: number): string {
  return `Sign this message to authenticate with Slyz: ${timestamp}`;
}

/**
 * Verifies that the request was signed by the claimed Solana wallet address using Node's native Ed25519 engine.
 * 
 * Headers expected:
 * - x-wallet-address: base58 wallet address
 * - x-wallet-signature: base58 ed25519 detached signature
 * - x-wallet-timestamp: timestamp integer string
 */
export function verifyWalletSignature(params: {
  walletAddress: string;
  signatureBase58: string;
  timestampStr: string;
}): { isValid: boolean; error?: string } {
  const { walletAddress, signatureBase58, timestampStr } = params;

  if (!walletAddress || !signatureBase58 || !timestampStr) {
    return { isValid: false, error: "Missing authentication headers (address, signature, or timestamp)." };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { isValid: false, error: "Invalid timestamp in authentication header." };
  }

  const now = Date.now();
  if (Math.abs(now - timestamp) > MAX_TIMESTAMP_DRIFT_MS) {
    return { isValid: false, error: "Authentication signature expired (outside 5-minute replay window)." };
  }

  try {
    const pubKey = new PublicKey(walletAddress);
    const pubKeyBytes = Buffer.from(pubKey.toBytes());
    const signatureBytes = Buffer.from(bs58.decode(signatureBase58));
    const message = buildAuthMessage(timestamp);
    const messageBytes = Buffer.from(new TextEncoder().encode(message));

    const pubKeyDer = Buffer.concat([ED25519_SPKI_PREFIX, pubKeyBytes]);
    const pubKeyObj = crypto.createPublicKey({
      key: pubKeyDer,
      format: "der",
      type: "spki",
    });

    const verified = crypto.verify(null, messageBytes, pubKeyObj, signatureBytes);
    if (!verified) {
      return { isValid: false, error: "Cryptographic wallet signature verification failed." };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: `Signature verification error: ${err?.message || "Invalid public key or signature"}` };
  }
}
