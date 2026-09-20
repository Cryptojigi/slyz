import {
  BaseMessageSignerWalletAdapter,
  EventEmitter,
  scopePollingDetectionStrategy,
  SupportedTransactionVersions,
  WalletAccountError,
  WalletConnectionError,
  WalletDisconnectionError,
  WalletError,
  WalletName,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSignMessageError,
  WalletSignTransactionError,
  TransactionOrVersionedTransaction,
} from "@solana/wallet-adapter-base";
import { PublicKey, type TransactionVersion } from "@solana/web3.js";

export const OkxWalletName = "OKX Wallet" as WalletName<"OKX Wallet">;

interface OkxSolanaProvider {
  publicKey: {
    toBytes?: () => Uint8Array;
    toString: () => string;
  } | null;
  isConnected: boolean;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{
    publicKey: {
      toBytes?: () => Uint8Array;
      toString: () => string;
    };
  }>;
  disconnect(): Promise<void>;
  signTransaction<T extends TransactionOrVersionedTransaction<any>>(transaction: T): Promise<T>;
  signAllTransactions<T extends TransactionOrVersionedTransaction<any>>(transactions: T[]): Promise<T[]>;
  signMessage(
    message: Uint8Array,
    display?: "hex" | "utf8"
  ): Promise<{ signature: Uint8Array } | Uint8Array>;
  on(event: string, listener: (...args: any[]) => void): void;
  off?(event: string, listener: (...args: any[]) => void): void;
  removeListener?(event: string, listener: (...args: any[]) => void): void;
}

export class OkxWalletAdapter extends BaseMessageSignerWalletAdapter<"OKX Wallet"> {
  name = OkxWalletName;
  url = "https://www.okx.com/web3";
  icon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSIjMDAwMDAwIi8+PHJlY3QgeD0iMjIiIHk9IjIyIiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSI0IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iNTYiIHk9IjIyIiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSI0IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMzkiIHk9IjM5IiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSI0IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMjIiIHk9IjU2IiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSI0IiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iNTYiIHk9IjU2IiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSI0IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+";
  supportedTransactionVersions: SupportedTransactionVersions = new Set<TransactionVersion>(["legacy", 0]);

  private _connecting = false;
  private _publicKey: PublicKey | null = null;
  private _readyState: WalletReadyState =
    typeof window !== "undefined" && (window as any).okxwallet?.solana
      ? WalletReadyState.Installed
      : WalletReadyState.NotDetected;

  constructor() {
    super();

    if (typeof window !== "undefined" && this._readyState !== WalletReadyState.Installed) {
      scopePollingDetectionStrategy(() => {
        if ((window as any).okxwallet?.solana) {
          this._readyState = WalletReadyState.Installed;
          this.emit("readyStateChange", this._readyState);
          return true;
        }
        return false;
      });
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  private _getProvider(): OkxSolanaProvider | null {
    if (typeof window === "undefined") return null;
    return (window as any).okxwallet?.solana ?? null;
  }

  async autoConnect(): Promise<void> {
    const provider = this._getProvider();
    if (!provider) return;

    try {
      this._connecting = true;
      this.emit("connecting" as any);

      // Attempt trusted connection without triggering aggressive pop-ups
      const res = await provider.connect({ onlyIfTrusted: true });
      const pubkeyObj = res?.publicKey || provider.publicKey;

      if (!pubkeyObj) {
        throw new WalletAccountError("Failed to retrieve OKX account");
      }

      const keyBytes = pubkeyObj.toBytes ? pubkeyObj.toBytes() : new PublicKey(pubkeyObj.toString()).toBytes();
      this._publicKey = new PublicKey(keyBytes);
      this.emit("connect", this._publicKey);
    } catch {
      // Gracefully swallow autoConnect rejections so wallet-adapter doesn't wipe localStorage
    } finally {
      this._connecting = false;
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;

      if (this._readyState !== WalletReadyState.Installed) {
        throw new WalletNotReadyError("OKX Wallet extension is not installed");
      }

      const provider = this._getProvider();
      if (!provider) {
        throw new WalletNotReadyError("OKX Wallet provider not found");
      }

      this._connecting = true;
      this.emit("connecting" as any);

      let res;
      try {
        res = await provider.connect();
      } catch (error: any) {
        throw new WalletConnectionError(error?.message || "Failed to connect to OKX Wallet", error);
      }

      const pubkeyObj = res?.publicKey || provider.publicKey;
      if (!pubkeyObj) {
        throw new WalletAccountError("Failed to get OKX Wallet public key");
      }

      try {
        const keyBytes = pubkeyObj.toBytes ? pubkeyObj.toBytes() : new PublicKey(pubkeyObj.toString()).toBytes();
        this._publicKey = new PublicKey(keyBytes);
      } catch (error: any) {
        throw new WalletPublicKeyError(error?.message, error);
      }

      this.emit("connect", this._publicKey);
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const provider = this._getProvider();
    if (provider) {
      try {
        await provider.disconnect();
      } catch (_) {}
    }
    this._publicKey = null;
    this.emit("disconnect");
  }

  async signTransaction<T extends TransactionOrVersionedTransaction<any>>(transaction: T): Promise<T> {
    try {
      const provider = this._getProvider();
      if (!provider) throw new WalletNotConnectedError();

      try {
        return await provider.signTransaction(transaction);
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  async signAllTransactions<T extends TransactionOrVersionedTransaction<any>>(transactions: T[]): Promise<T[]> {
    try {
      const provider = this._getProvider();
      if (!provider) throw new WalletNotConnectedError();

      try {
        return await provider.signAllTransactions(transactions);
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const provider = this._getProvider();
      if (!provider) throw new WalletNotConnectedError();

      try {
        const response = await provider.signMessage(message);
        if (response instanceof Uint8Array) return response;
        if ("signature" in response && response.signature instanceof Uint8Array) {
          return response.signature;
        }
        return new Uint8Array(response as any);
      } catch (error: any) {
        throw new WalletSignMessageError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }
}
