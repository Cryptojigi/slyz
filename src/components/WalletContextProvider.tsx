"use client";

import React, { FC, ReactNode, useMemo, useEffect, useRef } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  WalletAdapterNetwork,
  type WalletAdapter,
  type WalletError,
} from "@solana/wallet-adapter-base";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
import { OkxWalletAdapter } from "@/lib/OkxWalletAdapter";
import { WalletBalanceProvider } from "@/context/WalletBalanceContext";
import { QuickSwapModal } from "@/components/QuickSwapModal";

interface Props {
  children: ReactNode;
}

// WalletConnect / Reown Cloud project id — https://cloud.reown.com
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const STORAGE_KEY_LAST_WALLET = "slyz_last_connected_wallet";

/**
 * Ensures wallet connection state persists cleanly across page refreshes
 * on both Desktop extensions and Mobile web browsers.
 */
const AutoReconnectManager: FC = () => {
  const { wallet, connected, connecting, select } = useWallet();
  const isUnloadingRef = useRef(false);

  // Track unload / navigation events to prevent wiping connection state on page refresh
  useEffect(() => {
    const handleUnload = () => {
      isUnloadingRef.current = true;
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  // Save the currently connected wallet name to our persistent backup key
  useEffect(() => {
    if (connected && wallet?.adapter?.name) {
      try {
        localStorage.setItem(STORAGE_KEY_LAST_WALLET, wallet.adapter.name);
      } catch (_) {}
    }
  }, [connected, wallet]);

  // Handle explicit user disconnect vs page refresh
  useEffect(() => {
    if (!wallet) return;

    const handleDisconnect = () => {
      // If the page is actively unloading or refreshing, do NOT erase the saved wallet
      if (isUnloadingRef.current || document.visibilityState === "hidden") {
        return;
      }
      // User explicitly disconnected
      try {
        localStorage.removeItem(STORAGE_KEY_LAST_WALLET);
        localStorage.removeItem("walletName");
      } catch (_) {}
    };

    wallet.adapter.on("disconnect", handleDisconnect);
    return () => {
      wallet.adapter.off("disconnect", handleDisconnect);
    };
  }, [wallet]);

  // On page load/refresh: If not connected, attempt reliable auto-reconnect to saved wallet
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedWallet = localStorage.getItem(STORAGE_KEY_LAST_WALLET);
    if (!savedWallet) return;

    // Ensure standard walletName in localStorage is restored if cleared by browser unload
    try {
      const current = localStorage.getItem("walletName");
      if (!current || current === "null") {
        localStorage.setItem("walletName", JSON.stringify(savedWallet));
      }
    } catch (_) {}

    // Allow browser extensions (OKX, Phantom, Solflare) a brief moment to finish injection
    const timer = setTimeout(() => {
      if (!connected && !connecting && savedWallet) {
        select(savedWallet as any);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [connected, connecting, select]);

  return null;
};

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com",
    []
  );

  // Synchronously restore walletName from persistent backup before WalletProvider mounts
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAST_WALLET);
      const current = localStorage.getItem("walletName");
      if (saved && (!current || current === "null")) {
        localStorage.setItem("walletName", JSON.stringify(saved));
      }
    } catch (_) {}
  }

  const wallets = useMemo(() => {
    const adapters: WalletAdapter[] = [];

    // Explicit OKX Wallet extension adapter
    adapters.push(new OkxWalletAdapter());

    // Mobile support: WalletConnect for mobile browser QR / deep link connections
    if (WC_PROJECT_ID && WC_PROJECT_ID.trim().length > 0) {
      adapters.push(
        new WalletConnectWalletAdapter({
          network: WalletAdapterNetwork.Mainnet,
          options: {
            projectId: WC_PROJECT_ID,
            metadata: {
              name: "Slyz",
              description: "Thematic stock basket investing on Solana",
              url: APP_URL,
              icons: [`${APP_URL.replace(/\/$/, "")}/slyzlogo.png`],
            },
          },
        })
      );
    }

    // WalletProvider automatically detects Wallet Standard wallets (Phantom, Solflare, etc.)
    return adapters;
  }, []);

  const handleWalletError = (error: WalletError) => {
    // Gracefully handle silent connect or cancel errors without crashing
    console.warn("[WalletProvider]", error?.name, error?.message);
  };

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect onError={handleWalletError}>
        <WalletModalProvider>
          <AutoReconnectManager />
          <WalletBalanceProvider>
            {children}
            <QuickSwapModal />
          </WalletBalanceProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
