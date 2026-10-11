import bs58 from "bs58";
import { buildAuthMessage } from "./walletAuth";

interface CachedAuth {
  address: string;
  signature: string;
  timestamp: number;
}

/**
 * Retrieves a valid cached session auth header or requests a signature from the user's wallet.
 * Caches the detached signature in sessionStorage for 4 minutes to minimize wallet popups.
 */
export async function getOrSignWalletAuth(
  wallet: {
    publicKey: { toBase58(): string } | null;
    signMessage?: (msg: Uint8Array) => Promise<Uint8Array>;
  }
): Promise<{
  "x-wallet-address": string;
  "x-wallet-signature": string;
  "x-wallet-timestamp": string;
} | null> {
  if (!wallet.publicKey || !wallet.signMessage) {
    return null;
  }

  const address = wallet.publicKey.toBase58();
  const sessionKey = `slyz_wallet_auth_${address}`;

  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const cached = JSON.parse(raw) as CachedAuth;
        if (cached.address === address && Date.now() - cached.timestamp < 4 * 60 * 1000) {
          return {
            "x-wallet-address": cached.address,
            "x-wallet-signature": cached.signature,
            "x-wallet-timestamp": cached.timestamp.toString(),
          };
        }
      }
    } catch {
      // Ignore cache parsing errors
    }
  }

  const timestamp = Date.now();
  const message = buildAuthMessage(timestamp);
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = await wallet.signMessage(messageBytes);
  const signatureBase58 = bs58.encode(signatureBytes);

  const authData: CachedAuth = {
    address,
    signature: signatureBase58,
    timestamp,
  };

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(authData));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    "x-wallet-address": address,
    "x-wallet-signature": signatureBase58,
    "x-wallet-timestamp": timestamp.toString(),
  };
}
