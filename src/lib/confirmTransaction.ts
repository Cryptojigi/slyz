import { Connection } from "@solana/web3.js";

interface RobustConfirmOptions {
  connection: Connection;
  signature: string;
  blockhash?: string;
  lastValidBlockHeight?: number;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
}

interface RobustConfirmResult {
  confirmed: boolean;
  err: any;
  errorReason?: string;
}

/**
 * Robustly awaits Solana transaction confirmation.
 * Prevents false negatives from `confirmTransaction` timing out or throwing
 * `TransactionExpiredBlockheightExceededError` when the transaction actually
 * was committed and finalized on-chain.
 */
export async function waitForTransactionConfirmation({
  connection,
  signature,
  blockhash,
  lastValidBlockHeight,
  maxPollAttempts = 15,
  pollIntervalMs = 1500,
}: RobustConfirmOptions): Promise<RobustConfirmResult> {
  // 1. If swapRes provided lastValidBlockHeight and blockhash, attempt confirmTransaction first
  if (lastValidBlockHeight && blockhash) {
    try {
      const res = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );
      if (res?.value?.err) {
        return {
          confirmed: false,
          err: res.value.err,
          errorReason: `Transaction reverted on-chain: ${JSON.stringify(res.value.err)}`,
        };
      }
      return { confirmed: true, err: null };
    } catch (confirmErr: any) {
      console.warn(
        `[waitForTransactionConfirmation] confirmTransaction threw for ${signature} (${confirmErr?.message}). Falling back to getSignatureStatus polling...`
      );
    }
  }

  // 2. Poll getSignatureStatus with searchTransactionHistory: true
  for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
    try {
      const status = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (status?.value) {
        if (status.value.err) {
          return {
            confirmed: false,
            err: status.value.err,
            errorReason: `Transaction reverted on-chain: ${JSON.stringify(status.value.err)}`,
          };
        }
        if (
          status.value.confirmationStatus === "confirmed" ||
          status.value.confirmationStatus === "finalized"
        ) {
          return { confirmed: true, err: null };
        }
      }
    } catch (pollErr) {
      console.warn("[waitForTransactionConfirmation] getSignatureStatus error:", pollErr);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  // 3. Final verification query
  try {
    const finalCheck = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    if (finalCheck?.value) {
      if (finalCheck.value.err) {
        return {
          confirmed: false,
          err: finalCheck.value.err,
          errorReason: `Transaction reverted on-chain: ${JSON.stringify(finalCheck.value.err)}`,
        };
      }
      if (
        finalCheck.value.confirmationStatus === "confirmed" ||
        finalCheck.value.confirmationStatus === "finalized"
      ) {
        return { confirmed: true, err: null };
      }
    }
  } catch (_) {}

  return {
    confirmed: false,
    err: new Error("Confirmation timeout: transaction not yet confirmed on-chain."),
    errorReason: "Confirmation timeout on RPC. Check Solscan before retrying.",
  };
}

/**
 * Verifies if a given transaction signature has already landed and confirmed on-chain.
 */
export async function isSignatureConfirmedOnChain(
  connection: Connection,
  signature: string
): Promise<boolean> {
  try {
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    if (
      status?.value &&
      !status.value.err &&
      (status.value.confirmationStatus === "confirmed" ||
        status.value.confirmationStatus === "finalized")
    ) {
      return true;
    }
  } catch (err) {
    console.warn(`[isSignatureConfirmedOnChain] check error for ${signature}:`, err);
  }
  return false;
}
