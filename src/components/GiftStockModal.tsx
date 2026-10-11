"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import {
  Gift,
  Clock,
  Send,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Share2,
  X,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  VERIFIED_STOCKS,
  TOKEN_2022_PROGRAM_ID,
  USDC_MINT,
  StockAsset,
  displaySharesToRawUnits,
  rawUnitsToDisplayShares,
  calculateNetShares,
  resolveMintCapabilities,
} from "@/lib/constants";
import { PortfolioPosition } from "@/lib/portfolio";
import {
  GiftTheme,
  GiftDeliveryType,
  SentGiftRecord,
  GiftClaimPayload,
  generateGiftClaimUrl,
  saveSentGift,
  buildFundGiftLinkTransaction,
  buildDirectGiftTransferTransaction,
  simulateAndValidateTransaction,
} from "@/lib/gifting";
import { getJupiterQuote } from "@/lib/jupiter";
import { getOrSignWalletAuth } from "@/lib/walletAuthClient";
import { waitForTransactionConfirmation } from "@/lib/confirmTransaction";
import { GiftCountdownClock } from "./GiftCountdownClock";

interface GiftStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string | null;
  positions?: PortfolioPosition[];
  solBalance: number;
  onSuccess?: () => void;
}

export function GiftStockModal({
  isOpen,
  onClose,
  initialSymbol,
  positions = [],
  solBalance,
  onSuccess,
}: GiftStockModalProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"configure" | "funding" | "completed">("configure");

  // Public xStocks only for this sprint
  const publicStocks = Object.values(VERIFIED_STOCKS).filter((s) => s.market === "public");
  const defaultSymbol = initialSymbol && VERIFIED_STOCKS[initialSymbol]?.market === "public" ? initialSymbol : "NVDAx";

  // Selection state
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const [deliveryType, setDeliveryType] = useState<GiftDeliveryType>("link");
  const [amountUsd, setAmountUsd] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState<string>("");

  // Live Quote state
  const [quotedRawUnits, setQuotedRawUnits] = useState<string>("0");
  const [quotedShares, setQuotedShares] = useState<number>(0);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [priceImpactPct, setPriceImpactPct] = useState<number>(0);

  // Expiration state: Presets from 1 hour to 7 days, or No Expiry
  type ExpiryPreset = "1h" | "24h" | "7d" | "none";
  const [expiryMode, setExpiryMode] = useState<ExpiryPreset>("24h");

  // Personalization state
  const [senderName, setSenderName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [theme, setTheme] = useState<GiftTheme>("gold");

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [generatedClaimUrl, setGeneratedClaimUrl] = useState<string>("");
  const [fundedTxSig, setFundedTxSig] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialSymbol && VERIFIED_STOCKS[initialSymbol]?.market === "public") {
      setSelectedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  const currentAsset: StockAsset = VERIFIED_STOCKS[selectedSymbol] || publicStocks[0];

  // Live quote calculation: convert USD to raw base units via Jupiter quote
  useEffect(() => {
    let active = true;
    const parsed = parseFloat(amountUsd) || 0;

    if (parsed < 0.1) {
      setQuotedRawUnits("0");
      setQuotedShares(0);
      setQuoteError(null);
      setPriceImpactPct(0);
      setIsQuoting(false);
      return;
    }

    setIsQuoting(true);
    setQuoteError(null);

    const timer = setTimeout(async () => {
      try {
        const quote = await getJupiterQuote({
          inputMint: USDC_MINT,
          outputMint: currentAsset.mint,
          amount: Math.round(parsed * 1_000_000), // USDC base units
          slippageBps: 50, // 0.5% default
        });

        if (!active) return;

        const impact = Math.abs(Number(quote.priceImpactPct || 0));
        setPriceImpactPct(impact);

        if (impact > 5) {
          setQuoteError(`Price impact (${impact.toFixed(2)}%) exceeds the 5% threshold.`);
          setQuotedRawUnits("0");
          setQuotedShares(0);
        } else {
          setQuotedRawUnits(quote.outAmount);
          // Decimals = 8 for xStocks. Never multiply uiAmount by scaledUiMultiplier.
          setQuotedShares(Number(quote.outAmount) / Math.pow(10, currentAsset.decimals));
          setQuoteError(null);
        }
      } catch (err: any) {
        if (!active) return;
        setQuoteError(err?.message || "Failed to fetch live quote for this amount.");
        setQuotedRawUnits("0");
        setQuotedShares(0);
      } finally {
        if (active) setIsQuoting(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [amountUsd, selectedSymbol, currentAsset.mint, currentAsset.decimals]);

  if (!mounted || !isOpen) return null;

  // Calculate expiration timestamp in unix seconds (0 = no expiration)
  const calculateExpiryTimestamp = (): number => {
    const now = Math.floor(Date.now() / 1000);
    switch (expiryMode) {
      case "1h":
        return now + 3600;
      case "24h":
        return now + 86400;
      case "7d":
        return now + 7 * 86400;
      case "none":
      default:
        return 0;
    }
  };

  // Find matching user position in wallet
  const userPosition = positions.find((p) => p.symbol === selectedSymbol);
  const availableShares = userPosition ? userPosition.rawBalance : 0;

  // Form validation & parsing
  const parsedAmount = parseFloat(amountUsd) || 0;
  const hasValidAmount = parsedAmount >= 0.1 && !quoteError && quotedRawUnits !== "0";
  const hasValidRecipient = deliveryType === "link" || recipientAddress.trim().length >= 32;
  const minRequiredSol = deliveryType === "link" ? 0.004 : 0.002;
  const hasSufficientShares = availableShares >= quotedShares && availableShares > 0;
  const hasSufficientSol = solBalance >= minRequiredSol;

  const isFormValid =
    hasValidAmount &&
    hasValidRecipient &&
    hasSufficientShares &&
    hasSufficientSol &&
    !isQuoting;

  const handleFundGift = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setExecutionError("Please connect your Solana wallet first.");
      return;
    }

    if (parsedAmount < 0.1) {
      setExecutionError("Please enter a gift amount of at least $0.10.");
      return;
    }

    if (quoteError || !quotedRawUnits || quotedRawUnits === "0") {
      setExecutionError(quoteError || "Valid stock quote required before proceeding.");
      return;
    }

    if (deliveryType === "direct" && !recipientAddress.trim()) {
      setExecutionError("Please enter a valid recipient Solana address.");
      return;
    }

    if (!hasSufficientShares) {
      setExecutionError(
        `Insufficient ${currentAsset.name} balance. You hold ${availableShares.toFixed(4)} shares, but this gift requires ~${quotedShares.toFixed(4)} shares.`
      );
      return;
    }

    if (!hasSufficientSol) {
      setExecutionError(
        `Low SOL balance (${solBalance.toFixed(4)} SOL). Need at least ${minRequiredSol} SOL for account rent & network fees.`
      );
      return;
    }

    setExecutionError(null);
    setIsExecuting(true);
    setStep("funding");

    try {
      const expiryTs = calculateExpiryTimestamp();
      const unlockTs = 0; // Immediately claimable

      if (deliveryType === "link") {
        // 1. Generate ephemeral keypair for the Gift Vault
        const vaultKeypair = Keypair.generate();
        const giftId = `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // 2. Obtain wallet signature auth for secure Route Handler requests
        const authHeaders = await getOrSignWalletAuth(wallet);
        if (!authHeaders) {
          throw new Error("Wallet signature is required to register and authenticate this gift draft.");
        }

        // 3. Pre-Broadcast Persistence: Insert row into Supabase BEFORE prompting wallet for transaction
        const createRes = await fetch("/api/gifts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            id: giftId,
            sender: wallet.publicKey.toBase58(),
            vault: vaultKeypair.publicKey.toBase58(),
            secretKeyBase58: bs58.encode(vaultKeypair.secretKey),
            symbol: selectedSymbol,
            mint: currentAsset.mint,
            rawAmount: quotedRawUnits,
            estimatedUsd: parsedAmount,
            note: note.trim(),
            unlockAt: null,
            expiresAt: expiryTs > 0 ? new Date(expiryTs * 1000).toISOString() : null,
          }),
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          throw new Error(
            errData.error || "Unable to initialize gift session. The transaction prompt was safely aborted."
          );
        }

        // 4. Build on-chain funding transaction
        const { transaction, netBaseUnits, netShares, feeBps } =
          await buildFundGiftLinkTransaction({
            connection,
            senderPublicKey: wallet.publicKey,
            symbol: selectedSymbol,
            shareAmount: quotedShares,
            rawAmountString: quotedRawUnits,
            vaultKeypair,
          });

        // 5. Preflight simulation
        await simulateAndValidateTransaction(connection, transaction, wallet.publicKey);

        // 6. User signs in wallet
        let signedTx;
        try {
          signedTx = await wallet.signTransaction(transaction);
        } catch (signErr: any) {
          // If user rejects the wallet prompt, discard the draft in Supabase
          await fetch(`/api/gifts?id=${giftId}`, {
            method: "DELETE",
            headers: authHeaders,
          }).catch(() => {});
          throw new Error("Transaction signature was cancelled in wallet.");
        }

        // 7. Broadcast transaction to Solana
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        setFundedTxSig(signature);

        // 8. IMMEDIATELY update Supabase status to 'submitted' with the transaction signature
        await fetch("/api/gifts", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            id: giftId,
            status: "submitted",
            signature,
          }),
        }).catch((err) => console.warn("Failed to patch status to submitted:", err));

        // 9. Resilient Confirmation using buy-flow helper & fallback polling
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        const confirmResult = await waitForTransactionConfirmation({
          connection,
          signature,
          blockhash,
          lastValidBlockHeight,
          maxPollAttempts: 15,
          pollIntervalMs: 1500,
        });

        let isConfirmed = confirmResult.confirmed && !confirmResult.err;

        // Fallback check on timeout or error
        if (!isConfirmed) {
          try {
            const statusCheck = await connection.getSignatureStatus(signature, {
              searchTransactionHistory: true,
            });
            if (statusCheck?.value) {
              if (
                !statusCheck.value.err &&
                (statusCheck.value.confirmationStatus === "confirmed" ||
                  statusCheck.value.confirmationStatus === "finalized")
              ) {
                isConfirmed = true;
              } else if (statusCheck.value.err) {
                throw new Error(`Transaction reverted on-chain: ${JSON.stringify(statusCheck.value.err)}`);
              }
            }
          } catch (statusErr: any) {
            console.warn("Fallback getSignatureStatus check:", statusErr);
          }
        }

        if (isConfirmed) {
          // Status updated to 'funded'
          await fetch("/api/gifts", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              id: giftId,
              status: "funded",
              signature,
            }),
          });

          // Construct Gift Payload for the claim URL
          const payload: GiftClaimPayload = {
            id: giftId,
            symbol: selectedSymbol,
            shareAmount: quotedShares,
            netShareAmount: netShares,
            feeBps,
            rawAmountString: quotedRawUnits,
            netRawAmountString: netBaseUnits.toString(),
            estimatedUsd: parsedAmount,
            senderName: senderName.trim() || "A Friend",
            senderPublicKey: wallet.publicKey.toBase58(),
            note: note.trim() || `Enjoy your ${currentAsset.name} gift!`,
            unlockTimestamp: unlockTs,
            expiryTimestamp: expiryTs,
            theme,
            secretKeyBase58: bs58.encode(vaultKeypair.secretKey),
            vaultPublicKey: vaultKeypair.publicKey.toBase58(),
          };

          const claimUrl = generateGiftClaimUrl(payload);
          setGeneratedClaimUrl(claimUrl);

          // Local backup caching
          const sentRecord: SentGiftRecord = {
            id: giftId,
            symbol: selectedSymbol,
            shareAmount: quotedShares,
            netShareAmount: netShares,
            feeBps,
            rawAmountString: quotedRawUnits,
            netRawAmountString: netBaseUnits.toString(),
            estimatedUsd: parsedAmount,
            senderName: senderName.trim() || "A Friend",
            senderPublicKey: wallet.publicKey.toBase58(),
            deliveryType: "link",
            claimUrl,
            vaultPublicKey: vaultKeypair.publicKey.toBase58(),
            secretKeyBase58: bs58.encode(vaultKeypair.secretKey),
            txSignature: signature,
            createdAt: Date.now(),
            unlockTimestamp: unlockTs,
            expiryTimestamp: expiryTs,
            status: "funded",
            theme,
            note: note.trim(),
          };
          saveSentGift(sentRecord);

          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#CDE06A", "#8D8AFF", "#FFFFFF"],
          });

          setStep("completed");
          if (onSuccess) onSuccess();
        } else {
          // Marked unknown in Supabase so user can verify in Sent Gifts
          await fetch("/api/gifts", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              id: giftId,
              status: "unknown",
              signature,
            }),
          }).catch(() => {});

          throw new Error(
            `Transaction submitted (${signature.slice(0, 8)}...), but network confirmation is taking longer than usual. Your gift record is securely preserved. Please check 'Sent Gifts' once Solana finalizes.`
          );
        }
      } else {
        // Direct transfer
        const recipientPk = new PublicKey(recipientAddress.trim());
        const { transaction } = await buildDirectGiftTransferTransaction({
          connection,
          senderPublicKey: wallet.publicKey,
          recipientPublicKey: recipientPk,
          symbol: selectedSymbol,
          shareAmount: quotedShares,
          rawAmountString: quotedRawUnits,
        });

        await simulateAndValidateTransaction(connection, transaction, wallet.publicKey);

        const signedTx = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        await waitForTransactionConfirmation({
          connection,
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        setFundedTxSig(signature);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setStep("completed");
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setExecutionError(err?.message || "Failed to process gift transfer.");
      setStep("configure");
    } finally {
      setIsExecuting(false);
    }
  };

  const copyClaimLink = () => {
    if (!generatedClaimUrl) return;
    navigator.clipboard.writeText(generatedClaimUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isExecuting) onClose();
        }}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-[#161B26] border border-[#262D3D] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#262D3D] flex items-center justify-between shrink-0 bg-[#161B26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CDE06A]/10 border border-[#CDE06A]/30 flex items-center justify-center text-[#CDE06A]">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Gift Public Stocks</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#CDE06A]/10 border border-[#CDE06A]/30 text-[#CDE06A] font-semibold">
                  xStocks
                </span>
              </h3>
              <p className="text-xs text-[#8F9CAE]">
                {step === "completed"
                  ? "Gift Link Ready to Share"
                  : "Send fractional shares of tokenized public stocks"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isExecuting) onClose();
            }}
            disabled={isExecuting}
            className="w-8 h-8 rounded-full bg-[#0B0E14] border border-[#262D3D] flex items-center justify-center text-[#8F9CAE] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {executionError && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Execution Error</span>
                <span className="leading-relaxed">{executionError}</span>
              </div>
            </div>
          )}

          {step === "funding" ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#CDE06A]/10 border border-[#CDE06A]/30 text-[#CDE06A] mx-auto flex items-center justify-center animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">Securing & Broadcasting Gift Vault</h4>
                <p className="text-xs text-[#8F9CAE] max-w-sm mx-auto">
                  Initializing secure escrow vault, allocating rent exemption, and transferring shares...
                </p>
              </div>
            </div>
          ) : step === "configure" ? (
            <div className="space-y-4">
              {/* Delivery Type Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0E14] rounded-2xl border border-[#262D3D]">
                <button
                  type="button"
                  onClick={() => setDeliveryType("link")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    deliveryType === "link"
                      ? "bg-[#CDE06A] text-[#0B0E14] shadow-md font-bold"
                      : "text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Expiring Claim Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("direct")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    deliveryType === "direct"
                      ? "bg-[#CDE06A] text-[#0B0E14] shadow-md font-bold"
                      : "text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Direct Wallet Transfer</span>
                </button>
              </div>

              {/* Stock Selector (Public xStocks only) */}
              <div>
                <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block mb-1.5">
                  Select Public Stock (xStocks)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {publicStocks.map((stk) => {
                    const isSelected = selectedSymbol === stk.symbol;
                    return (
                      <button
                        key={stk.symbol}
                        type="button"
                        onClick={() => setSelectedSymbol(stk.symbol)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#CDE06A]/15 border-[#CDE06A] shadow-md shadow-[#CDE06A]/10"
                            : "bg-[#0B0E14] border-[#262D3D] hover:border-[#8F9CAE]/40"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#161B26] shrink-0 border border-[#262D3D] flex items-center justify-center">
                          {stk.logo ? (
                            <Image
                              src={stk.logo}
                              alt={stk.symbol}
                              width={24}
                              height={24}
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[10px]">{stk.symbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block truncate">
                            {stk.underlying}
                          </span>
                          <span className="text-[9px] font-semibold text-[#CDE06A]">
                            xStock
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gift Amount (USD Input) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase">
                    Gift Amount (USD)
                  </label>
                  {isQuoting ? (
                    <span className="text-xs text-[#8F9CAE] flex items-center gap-1 font-mono">
                      <Loader2 className="w-3 h-3 animate-spin text-[#CDE06A]" />
                      <span>Quoting live shares...</span>
                    </span>
                  ) : quotedShares > 0 ? (
                    <span className="text-xs text-[#CDE06A] font-mono font-semibold">
                      ~{quotedShares.toFixed(4)} {currentAsset.underlying}
                    </span>
                  ) : (
                    <span className="text-xs text-[#8F9CAE] font-mono">Min. $0.10</span>
                  )}
                </div>

                {/* User Balance */}
                {wallet.connected && (
                  <div className="flex items-center justify-between text-[11px] mb-2 px-1">
                    <span className="text-[#8F9CAE]">Your {currentAsset.underlying} Balance:</span>
                    <span className={`font-mono font-medium ${availableShares > 0 ? "text-white" : "text-amber-400"}`}>
                      {availableShares.toFixed(4)} shares
                    </span>
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                  {["0.3", "1", "5", "10"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountUsd(amt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        amountUsd === amt
                          ? "bg-[#CDE06A] text-[#0B0E14] shadow-sm"
                          : "bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] hover:text-white"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#CDE06A]"
                  placeholder="Enter USD amount (e.g. 0.30)"
                />

                {/* Quote Breakdown */}
                {parsedAmount > 0 && quotedShares > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[#8F9CAE]">
                      <span>Quoted Transfer Amount:</span>
                      <span className="text-white font-mono">~{quotedShares.toFixed(4)} {currentAsset.underlying}</span>
                    </div>
                    {priceImpactPct > 0.1 && (
                      <div className="flex justify-between items-center text-[#8F9CAE]">
                        <span>Price Impact:</span>
                        <span className="text-white font-mono">{priceImpactPct.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quote Error Warning */}
                {quoteError && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{quoteError}</span>
                  </div>
                )}

                {/* Balance Warnings */}
                {wallet.connected && parsedAmount > 0 && !hasSufficientShares && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {availableShares === 0
                        ? `You do not own any ${currentAsset.name} shares in this wallet.`
                        : `Insufficient balance. You hold ${availableShares.toFixed(4)} shares, but this gift requires ~${quotedShares.toFixed(4)} shares.`}
                    </span>
                  </div>
                )}

                {wallet.connected && !hasSufficientSol && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Low SOL balance ({solBalance.toFixed(4)} SOL). Need at least {minRequiredSol} SOL to sponsor recipient claim rent & network fees.
                    </span>
                  </div>
                )}
              </div>

              {/* Timing Selector (Only for Link mode) */}
              {deliveryType === "link" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#CDE06A]" />
                      <span>Link Expiration Window</span>
                    </label>
                    <span className="text-[10px] text-[#8F9CAE] font-mono">1 Hour Min</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {(["1h", "24h", "7d", "none"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setExpiryMode(mode)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          expiryMode === mode
                            ? "bg-[#CDE06A] text-[#0B0E14] font-bold shadow-sm"
                            : "bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] hover:text-white"
                        }`}
                      >
                        {mode === "1h"
                          ? "1 Hour"
                          : mode === "24h"
                          ? "24 Hours"
                          : mode === "7d"
                          ? "7 Days"
                          : "No Expiry"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Recipient Address Input (Only for Direct mode) */}
              {deliveryType === "direct" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block">
                    Recipient Solana Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#CDE06A]"
                    placeholder="Enter base58 Solana wallet address..."
                  />
                </div>
              )}

              {/* Note / Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block">
                  Gift Note (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#CDE06A]"
                  placeholder="e.g. Happy birthday! Enjoy your Nvidia shares."
                />
              </div>
            </div>
          ) : (
            /* Completed Success State */
            <div className="py-6 px-2 space-y-5 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                  {deliveryType === "link" ? "Shareable Claim Link" : "Direct Transfer"}
                </span>
                <h4 className="font-bold text-lg text-white">
                  ${parsedAmount.toFixed(2)} in {currentAsset.name}
                </h4>
                <p className="text-xs text-[#8F9CAE]">
                  {deliveryType === "link"
                    ? "Vault funded and ready to claim! Share the secure link below with your recipient."
                    : "Transferred directly to the recipient wallet."}
                </p>
              </div>

              {/* Countdown Clock */}
              {deliveryType === "link" && calculateExpiryTimestamp() > Math.floor(Date.now() / 1000) && (
                <div className="pt-2 space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#CDE06A] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Link Expires In:</span>
                  </div>
                  <GiftCountdownClock
                    targetTimestamp={calculateExpiryTimestamp()}
                    theme={theme}
                  />
                </div>
              )}

              {/* Copy Claim Link Box */}
              {generatedClaimUrl && (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block">
                    Shareable Claim Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedClaimUrl}
                      className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3 py-2 text-xs font-mono text-[#8F9CAE] select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyClaimLink}
                      className="btn-primary flex items-center gap-1.5 text-xs !py-2 shrink-0 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              )}

              {fundedTxSig && (
                <div className="pt-2 text-center">
                  <a
                    href={`https://solscan.io/tx/${fundedTxSig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#CDE06A] hover:underline"
                  >
                    <span>View On-Chain Funding Tx on Solscan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#262D3D] bg-[#0B0E14]/80 flex items-center justify-between gap-3 shrink-0">
          {step === "configure" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs !py-3 px-4 cursor-pointer"
              >
                Cancel
              </button>
              {!wallet.connected ? (
                <button
                  type="button"
                  onClick={() => setWalletModalVisible(true)}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm flex-1 justify-center !py-3 font-bold cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>Connect Wallet to Fund</span>
                </button>
              ) : !isFormValid ? (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 text-xs sm:text-sm flex-1 justify-center !py-3 rounded-xl bg-[#1D2332] text-[#8F9CAE] border border-[#262D3D] font-semibold opacity-60 cursor-not-allowed transition-all"
                >
                  <Gift className="w-4 h-4 opacity-50" />
                  <span>
                    {isQuoting
                      ? "Fetching Live Quote..."
                      : quoteError
                      ? "Invalid Quote"
                      : !hasValidAmount
                      ? "Enter Valid Amount ($0.10+)"
                      : !hasValidRecipient
                      ? "Enter Recipient Address"
                      : !hasSufficientShares
                      ? `Insufficient ${currentAsset.underlying} Balance`
                      : !hasSufficientSol
                      ? "Low SOL for Rent & Sponsorship"
                      : "Cannot Complete"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFundGift}
                  disabled={isExecuting}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm flex-1 justify-center !py-3 font-bold shadow-lg shadow-[#CDE06A]/10 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {deliveryType === "link"
                      ? `Create Gift Link ($${parsedAmount.toFixed(2)})`
                      : `Transfer Gift ($${parsedAmount.toFixed(2)})`}
                  </span>
                </button>
              )}
            </>
          ) : step === "completed" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full btn-primary !py-3 text-xs sm:text-sm font-bold cursor-pointer"
            >
              Done — Close
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
