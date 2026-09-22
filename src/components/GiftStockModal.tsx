"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Keypair } from "@solana/web3.js";
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
  Sparkles,
  Lock,
  ArrowRight,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  VERIFIED_STOCKS,
  TOKEN_2022_PROGRAM_ID,
  StockAsset,
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
} from "@/lib/gifting";
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

  // Selection state
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    initialSymbol || "SPACEX"
  );
  const [deliveryType, setDeliveryType] = useState<GiftDeliveryType>("link");
  const [amountUsd, setAmountUsd] = useState<number>(25);
  const [recipientAddress, setRecipientAddress] = useState<string>("");

  // Expiration state (Applies ONLY when generating a claim link)
  const [expiryMode, setExpiryMode] = useState<"24hours" | "48hours" | "7days" | "30days" | "custom">("24hours");
  const [customDateTime, setCustomDateTime] = useState<string>("");

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
    if (initialSymbol && VERIFIED_STOCKS[initialSymbol]) {
      setSelectedSymbol(initialSymbol);
      const isPriv = VERIFIED_STOCKS[initialSymbol].market === "private";
      setTheme(isPriv ? "gold" : "lime");
    }
  }, [initialSymbol]);

  if (!mounted || !isOpen) return null;

  const currentAsset: StockAsset =
    VERIFIED_STOCKS[selectedSymbol] || VERIFIED_STOCKS["SPACEX"];

  // Calculate expiration timestamp in unix seconds
  const calculateExpiryTimestamp = (): number => {
    const now = Math.floor(Date.now() / 1000);
    switch (expiryMode) {
      case "24hours":
        return now + 24 * 3600;
      case "48hours":
        return now + 48 * 3600;
      case "7days":
        return now + 7 * 86400;
      case "30days":
        return now + 30 * 86400;
      case "custom":
        if (!customDateTime) return now + 24 * 3600;
        return Math.floor(new Date(customDateTime).getTime() / 1000);
      default:
        return now + 24 * 3600;
    }
  };

  // Find matching user position if user already holds shares
  const userPosition = positions.find((p) => p.symbol === selectedSymbol);
  const hasPosition = Boolean(userPosition && userPosition.rawBalance > 0.00001);

  // Approximate share calculation (fallback price for PreStocks or xStocks)
  const estimatedPrice = userPosition?.usdPrice && userPosition.usdPrice > 0
    ? userPosition.usdPrice
    : currentAsset.market === "private"
    ? 250 // Approximate benchmark mark price
    : 150;
  const estimatedShares = Math.max(0.0001, amountUsd / estimatedPrice);

  const handleFundGift = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setExecutionError("Please connect your Solana wallet first.");
      return;
    }

    if (amountUsd < 1) {
      setExecutionError("Please enter a gift amount of at least $1.");
      return;
    }

    if (deliveryType === "direct" && !recipientAddress.trim()) {
      setExecutionError("Please enter a valid recipient Solana address.");
      return;
    }

    const minRequiredSol = deliveryType === "link" ? 0.004 : 0.002;
    if (solBalance < minRequiredSol) {
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
      const unlockTs = 0; // Immediately claimable!

      if (deliveryType === "link") {
        // 1. Generate ephemeral keypair for the Gift Vault
        const vaultKeypair = Keypair.generate();

        // 2. Build on-chain funding transaction
        const { transaction } = await buildFundGiftLinkTransaction({
          connection,
          senderPublicKey: wallet.publicKey,
          symbol: selectedSymbol,
          shareAmount: estimatedShares,
          vaultKeypair,
        });

        // 3. User signs and broadcasts
        const signedTx = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

        // 4. Construct Gift Payload
        const giftId = `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const payload: GiftClaimPayload = {
          id: giftId,
          symbol: selectedSymbol,
          shareAmount: estimatedShares,
          estimatedUsd: amountUsd,
          senderName: senderName.trim() || "A Friend",
          senderPublicKey: wallet.publicKey.toBase58(),
          note: note.trim() || `Enjoy your ${currentAsset.name} gift!`,
          unlockTimestamp: unlockTs,
          expiryTimestamp: expiryTs,
          theme,
          secretKeyBase58: bs58Encode(vaultKeypair.secretKey),
          vaultPublicKey: vaultKeypair.publicKey.toBase58(),
        };

        const claimUrl = generateGiftClaimUrl(payload);
        setGeneratedClaimUrl(claimUrl);
        setFundedTxSig(signature);

        // 5. Persist in sender's local sent gifts record
        const sentRecord: SentGiftRecord = {
          id: giftId,
          symbol: selectedSymbol,
          shareAmount: estimatedShares,
          estimatedUsd: amountUsd,
          senderName: senderName.trim() || "A Friend",
          senderPublicKey: wallet.publicKey.toBase58(),
          deliveryType: "link",
          claimUrl,
          vaultPublicKey: vaultKeypair.publicKey.toBase58(),
          secretKeyBase58: bs58Encode(vaultKeypair.secretKey),
          txSignature: signature,
          createdAt: Date.now(),
          unlockTimestamp: unlockTs,
          expiryTimestamp: expiryTs,
          status: "ready_to_claim",
          theme,
          note: note.trim(),
        };
        saveSentGift(sentRecord);

        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#F5A623", "#CDE06A", "#8D8AFF"],
        });

        setStep("completed");
        if (onSuccess) onSuccess();
      } else {
        // Direct transfer
        const recipientPk = new PublicKey(recipientAddress.trim());
        const { transaction } = await buildDirectGiftTransferTransaction({
          connection,
          senderPublicKey: wallet.publicKey,
          recipientPublicKey: recipientPk,
          symbol: selectedSymbol,
          shareAmount: estimatedShares,
        });

        const signedTx = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

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
      console.error("Gifting transaction error:", err);
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#161B26] border border-[#262D3D] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#262D3D] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[#F5A623]">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {step === "completed" ? "Gift Ready to Deliver!" : "Gift Tokenized Stocks"}
              </h3>
              <p className="text-[11px] text-[#8F9CAE]">
                {step === "completed"
                  ? "Share this link with your friend to claim"
                  : "Send public equities or private pre-IPO shares with an expiring claim link"}
              </p>
            </div>
          </div>
          {!isExecuting && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {executionError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{executionError}</span>
            </div>
          )}

          {step === "configure" && (
            <>
              {/* Delivery Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0E14] rounded-xl border border-[#262D3D]">
                <button
                  type="button"
                  onClick={() => setDeliveryType("link")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    deliveryType === "link"
                      ? "bg-[#CDE06A] text-[#0B0E14] shadow-md"
                      : "text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Gift Claim Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("direct")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    deliveryType === "direct"
                      ? "bg-[#CDE06A] text-[#0B0E14] shadow-md"
                      : "text-[#8F9CAE] hover:text-white"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Direct to Wallet</span>
                </button>
              </div>

              {/* Stock Selector */}
              <div>
                <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block mb-1.5">
                  Select Stock or Pre-IPO Asset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(VERIFIED_STOCKS).map((stk) => {
                    const isSelected = selectedSymbol === stk.symbol;
                    const isPre = stk.market === "private";

                    return (
                      <button
                        key={stk.symbol}
                        type="button"
                        onClick={() => {
                          setSelectedSymbol(stk.symbol);
                          setTheme(isPre ? "gold" : "lime");
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? isPre
                              ? "bg-[#F5A623]/15 border-[#F5A623] shadow-md shadow-[#F5A623]/10"
                              : "bg-[#CDE06A]/15 border-[#CDE06A] shadow-md shadow-[#CDE06A]/10"
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
                          <span className={`text-[9px] font-semibold ${isPre ? "text-[#F5A623]" : "text-[#CDE06A]"}`}>
                            {isPre ? "Pre-IPO" : "xStock"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gift Amount Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase">
                    Gift Amount (USD)
                  </label>
                  <span className="text-xs text-[#8F9CAE] font-mono">
                    ~{estimatedShares.toFixed(4)} {currentAsset.underlying}
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountUsd(amt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        amountUsd === amt
                          ? "bg-[#CDE06A] text-[#0B0E14]"
                          : "bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] hover:text-white"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#CDE06A]"
                  placeholder="Custom amount..."
                />
              </div>

              {/* Timing Selector (Only for Link mode) */}
              {deliveryType === "link" ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span>Claim Link Expiration</span>
                    </label>
                    <span className="text-[10px] text-[#8F9CAE]">
                      Time until link expires
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                    {[
                      { id: "24hours", label: "⚡ 24 Hours" },
                      { id: "48hours", label: "⏱️ 48 Hours" },
                      { id: "7days", label: "📅 7 Days" },
                      { id: "30days", label: "🗓️ 30 Days" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setExpiryMode(opt.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-medium transition-all ${
                          expiryMode === opt.id
                            ? "bg-[#F5A623] text-[#0B0E14] font-bold"
                            : "bg-[#0B0E14] border border-[#262D3D] text-[#8F9CAE] hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {expiryMode === "custom" ? (
                    <input
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                      className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5A623]"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpiryMode("custom")}
                      className="text-[11px] text-[#F5A623] hover:underline font-medium block"
                    >
                      + Or pick a custom expiration date & time
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block mb-1.5">
                    Recipient Solana Wallet Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter base58 Solana address (e.g. 7xKX...)"
                    className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#CDE06A]"
                  />
                </div>
              )}

              {/* Personalization Note */}
              <div className="space-y-2 pt-1 border-t border-[#262D3D]">
                <div>
                  <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#CDE06A]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#8F9CAE] uppercase block mb-1">
                    Greeting Card Note
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write a message (e.g. Happy Birthday! Here is some SpaceX before the IPO 🚀)"
                    className="w-full bg-[#0B0E14] border border-[#262D3D] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CDE06A] resize-none"
                  />
                </div>
              </div>
            </>
          )}

          {step === "funding" && (
            <div className="text-center py-10 space-y-4">
              <Loader2 className="w-10 h-10 text-[#CDE06A] animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">Creating & Funding Gift Vault...</h4>
                <p className="text-xs text-[#8F9CAE] max-w-xs mx-auto">
                  Please approve the transaction in your Solana wallet to fund the tokenized shares and vault rent.
                </p>
              </div>
            </div>
          )}

          {step === "completed" && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1D1B13] to-[#0B0E14] border border-[#F5A623]/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="pill-badge pill-badge-purple text-[10px] mb-1">
                    {deliveryType === "link" ? "Shareable Claim Link" : "Direct Transfer"}
                  </span>
                  <h4 className="font-bold text-lg text-white">
                    ${amountUsd} in {currentAsset.name}
                  </h4>
                  <p className="text-xs text-[#8F9CAE]">
                    {deliveryType === "link"
                      ? "Ready for your friend to claim! Send them the link below."
                      : "Transferred directly to the recipient wallet."}
                  </p>
                </div>

                {/* Live Countdown Clock showing expiration */}
                {deliveryType === "link" && calculateExpiryTimestamp() > Math.floor(Date.now() / 1000) && (
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-[#F5A623] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Link Expires In:</span>
                    </div>
                    <GiftCountdownClock
                      targetTimestamp={calculateExpiryTimestamp()}
                      theme={theme}
                    />
                  </div>
                )}
              </div>

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

              {/* Social Sharing Shortcuts */}
              {generatedClaimUrl && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[#8F9CAE] uppercase block">
                    Share directly via:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `I just gifted someone tokenized ${currentAsset.name} on @useslyz! 🎁 Check out the gift claim vault:`
                      )}&url=${encodeURIComponent(generatedClaimUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-xs font-semibold text-[#8F9CAE] hover:text-white hover:border-[#1DA1F2] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Twitter / X</span>
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(
                        generatedClaimUrl
                      )}&text=${encodeURIComponent(
                        `You have a tokenized stock gift waiting on Slyz! 🚀`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-xs font-semibold text-[#8F9CAE] hover:text-white hover:border-[#0088cc] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Telegram</span>
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Here is your stock gift on Slyz: ${generatedClaimUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-xs font-semibold text-[#8F9CAE] hover:text-white hover:border-[#25D366] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>WhatsApp</span>
                    </a>
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
                className="btn-secondary text-xs !py-2.5 px-3.5 cursor-pointer"
              >
                Cancel
              </button>
              {!wallet.connected ? (
                <button
                  type="button"
                  onClick={() => setWalletModalVisible(true)}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm flex-1 justify-center !py-2.5 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>Connect Wallet to Fund</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFundGift}
                  disabled={isExecuting}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm flex-1 justify-center !py-2.5 disabled:opacity-50 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {deliveryType === "link"
                      ? `Create Gift Link ($${amountUsd})`
                      : `Transfer Gift ($${amountUsd})`}
                  </span>
                </button>
              )}
            </>
          ) : step === "completed" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full btn-primary !py-2.5 sm:!py-3 text-xs sm:text-sm font-bold cursor-pointer"
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

function bs58Encode(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
    digits[0] += bytes[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) digits.push(0);
  return digits
    .reverse()
    .map((d) => ALPHABET[d])
    .join("");
}
