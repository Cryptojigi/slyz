"use client";

import React, { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  WalletAdapterNetwork,
  type WalletAdapter,
} from "@solana/wallet-adapter-base";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
import { WalletBalanceProvider } from "@/context/WalletBalanceContext";
import { QuickSwapModal } from "@/components/QuickSwapModal";

interface Props {
  children: ReactNode;
}

// WalletConnect / Reown Cloud project id — https://cloud.reown.com
// WalletConnect is only enabled when this value is present, so a missing or
// placeholder id can never break the build or the connect flow.
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

// Must be the deployed public origin — WalletConnect shows this to the wallet app.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com",
    []
  );

  const wallets = useMemo(() => {
    const adapters: WalletAdapter[] = [];

    // Mobile support: WalletConnect lets a phone browser (Safari / Chrome) reach
    // Phantom, Solflare, Backpack etc. via QR or deep link. Without it, wallets
    // are only visible when the site is opened inside a wallet's in-app browser.
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

    // WalletProvider runs useStandardWalletAdapters() internally, so every
    // Wallet Standard wallet (Phantom, Solflare, Backpack, ...) is still
    // auto-detected and merged in — passing an explicit array here does NOT
    // disable browser-extension detection.
    return adapters;
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletBalanceProvider>
            {children}
            <QuickSwapModal />
          </WalletBalanceProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
