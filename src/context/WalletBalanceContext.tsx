"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchUserBalances, UserBalances } from "@/lib/solana";
import { MIN_SOL_BALANCE } from "@/lib/constants";

export type SwapDirection = "SOL_TO_USDC" | "USDC_TO_SOL";

interface WalletBalanceContextType {
  solBalance: number;
  usdcBalance: number;
  token2022Balances: Record<string, number>;
  token2022RawAmounts?: Record<string, string>;
  hasSufficientGas: boolean;
  loading: boolean;
  rpcError: boolean;
  refreshBalances: () => Promise<void>;
  // Quick Swap Modal Controls
  isQuickSwapOpen: boolean;
  quickSwapDirection: SwapDirection;
  quickSwapPrefillAmount?: number;
  openQuickSwap: (direction?: SwapDirection, prefillAmount?: number) => void;
  closeQuickSwap: () => void;
}

const WalletBalanceContext = createContext<WalletBalanceContextType | undefined>(undefined);

export function WalletBalanceProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [balances, setBalances] = useState<UserBalances>({
    solBalance: 0,
    usdcBalance: 0,
    token2022Balances: {},
    token2022RawAmounts: {},
    hasSufficientGas: false,
    rpcError: false,
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Quick swap modal state
  const [isQuickSwapOpen, setIsQuickSwapOpen] = useState<boolean>(false);
  const [quickSwapDirection, setQuickSwapDirection] = useState<SwapDirection>("SOL_TO_USDC");
  const [quickSwapPrefillAmount, setQuickSwapPrefillAmount] = useState<number | undefined>(undefined);

  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalances({
        solBalance: 0,
        usdcBalance: 0,
        token2022Balances: {},
        token2022RawAmounts: {},
        hasSufficientGas: false,
        rpcError: false,
      });
      return;
    }

    setLoading(true);
    try {
      const updated = await fetchUserBalances(wallet.publicKey);
      setBalances(updated);
    } catch (err) {
      console.error("[WalletBalanceContext] Failed to fetch balances:", err);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey]);

  // Initial fetch and 20s background polling
  useEffect(() => {
    refreshBalances();
    if (!wallet.publicKey) return;

    const interval = setInterval(() => {
      refreshBalances();
    }, 20000);

    return () => clearInterval(interval);
  }, [wallet.publicKey, refreshBalances]);

  const openQuickSwap = useCallback((direction: SwapDirection = "SOL_TO_USDC", prefillAmount?: number) => {
    setQuickSwapDirection(direction);
    setQuickSwapPrefillAmount(prefillAmount);
    setIsQuickSwapOpen(true);
  }, []);

  const closeQuickSwap = useCallback(() => {
    setIsQuickSwapOpen(false);
    setQuickSwapPrefillAmount(undefined);
  }, []);

  return (
    <WalletBalanceContext.Provider
      value={{
        solBalance: balances.solBalance,
        usdcBalance: balances.usdcBalance,
        token2022Balances: balances.token2022Balances,
        token2022RawAmounts: balances.token2022RawAmounts,
        hasSufficientGas: balances.hasSufficientGas,
        loading,
        rpcError: !!balances.rpcError,
        refreshBalances,
        isQuickSwapOpen,
        quickSwapDirection,
        quickSwapPrefillAmount,
        openQuickSwap,
        closeQuickSwap,
      }}
    >
      {children}
    </WalletBalanceContext.Provider>
  );
}

export function useWalletBalances() {
  const context = useContext(WalletBalanceContext);
  if (!context) {
    throw new Error("useWalletBalances must be used within a WalletBalanceProvider");
  }
  return context;
}
