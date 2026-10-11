"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Send,
  HelpCircle,
  Bug,
  Gift,
  Compass,
  Mail,
} from "lucide-react";

interface FeedbackFormProps {
  onSuccess?: () => void;
  className?: string;
}

type CategoryKey = "technical_issue" | "transaction_inquiry" | "user_experience" | "general_inquiry";

const CATEGORIES: { key: CategoryKey; label: string; icon: React.ElementType; description: string }[] = [
  {
    key: "technical_issue",
    label: "Technical Issue / Bug",
    icon: Bug,
    description: "Errors, stuck screens, or broken functionality",
  },
  {
    key: "transaction_inquiry",
    label: "Transaction & Gifting",
    icon: Gift,
    description: "Questions about funding, claims, or token transfers",
  },
  {
    key: "user_experience",
    label: "Usability & Navigation",
    icon: Compass,
    description: "Challenges navigating screens or suggestions to improve UX",
  },
  {
    key: "general_inquiry",
    label: "General Inquiry",
    icon: HelpCircle,
    description: "Questions regarding tokenized stocks or protocol features",
  },
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess, className = "" }) => {
  const wallet = useWallet();

  const [category, setCategory] = useState<CategoryKey>("technical_issue");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [attachWallet, setAttachWallet] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const telegramSupportUrl =
    process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL?.trim() || "https://t.me/Useslyz";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subject.trim()) {
      setErrorMessage("Please enter a brief subject line.");
      return;
    }
    if (message.trim().length < 10) {
      setErrorMessage("Please provide a description of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          contact: contact.trim() || null,
          wallet: attachWallet && wallet.publicKey ? wallet.publicKey.toBase58() : null,
          pageUrl: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to submit feedback. Please try again.");
      }

      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit feedback. Please try again or reach out on Telegram.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubject("");
    setMessage("");
    setContact("");
    setIsSubmitted(false);
    setErrorMessage(null);
  };

  if (isSubmitted) {
    return (
      <div className={`p-8 rounded-2xl bg-[#161B26] border border-[#262D3D] text-center space-y-6 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-white tracking-tight">Feedback Received</h3>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            Thank you for sharing your experience. Your submission has been transmitted directly to our team channel on Telegram.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262D3D] max-w-md mx-auto text-left space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F9CAE] block">
            Direct Support Channels
          </span>
          <p className="text-xs text-slate-300">
            Need urgent assistance or have transaction questions? You can reach our team via official email or our Telegram group:
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 text-xs">
            <a
              href="mailto:support@useslyz.xyz"
              className="inline-flex items-center gap-1.5 text-[#CDE06A] hover:underline font-semibold"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@useslyz.xyz</span>
            </a>
            <span className="hidden sm:inline text-[#262D3D]">•</span>
            <a
              href={telegramSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#0088cc] hover:underline font-semibold"
            >
              <span>Telegram: @Useslyz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary !py-2.5 !px-5 text-xs"
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Category Selection */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-white block">
          Select Category
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isSelected
                    ? "bg-[#1E2536] border-[#CDE06A] text-white"
                    : "bg-[#0B0E14] border-[#262D3D] text-[#8F9CAE] hover:border-[#384358] hover:text-white"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                    isSelected ? "bg-[#CDE06A] text-[#0B0E14]" : "bg-[#161B26] text-[#8F9CAE]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block">{cat.label}</span>
                  <span className="text-[11px] text-[#8F9CAE] block leading-snug">
                    {cat.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Line */}
      <div className="space-y-1.5">
        <label htmlFor="feedback-subject" className="text-xs font-semibold text-white block">
          Subject / Brief Summary
        </label>
        <input
          id="feedback-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Issue connecting wallet on mobile, or feedback on gift expiry"
          maxLength={150}
          required
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-white placeholder-[#5E6B7E] text-xs focus:outline-none focus:border-[#CDE06A] transition-colors"
        />
      </div>

      {/* Detailed Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="feedback-message" className="text-xs font-semibold text-white">
            Details & Description
          </label>
          <span className="text-[10px] text-[#5E6B7E]">
            {message.length}/3000
          </span>
        </div>
        <textarea
          id="feedback-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please describe what occurred, the steps taken, or the feature you would like to see. Include any error codes if applicable."
          maxLength={3000}
          required
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-white placeholder-[#5E6B7E] text-xs focus:outline-none focus:border-[#CDE06A] transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Contact & Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label htmlFor="feedback-contact" className="text-xs font-semibold text-white block">
            Your Contact Handle <span className="text-[#8F9CAE] font-normal">(Optional)</span>
          </label>
          <input
            id="feedback-contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Telegram @username, email, or X handle"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] text-white placeholder-[#5E6B7E] text-xs focus:outline-none focus:border-[#CDE06A] transition-colors"
          />
        </div>

        {/* Wallet Address Context Option */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <label className="text-xs font-semibold text-white block">
            Diagnostic Context
          </label>
          <div className="h-[38px] px-3.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] flex items-center justify-between">
            <span className="text-xs text-[#8F9CAE]">
              {wallet.publicKey ? (
                <>
                  Attach wallet:{" "}
                  <code className="text-slate-300 font-mono text-[11px]">
                    {wallet.publicKey.toBase58().slice(0, 4)}...{wallet.publicKey.toBase58().slice(-4)}
                  </code>
                </>
              ) : (
                "No wallet connected"
              )}
            </span>
            {wallet.publicKey && (
              <input
                type="checkbox"
                checked={attachWallet}
                onChange={(e) => setAttachWallet(e.target.checked)}
                className="rounded border-[#262D3D] text-[#CDE06A] focus:ring-0 cursor-pointer"
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8F9CAE]">
          <a
            href="mailto:support@useslyz.xyz"
            className="hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-[#CDE06A]" />
            <span>support@useslyz.xyz</span>
          </a>
          <span className="text-[#262D3D]">•</span>
          <a
            href={telegramSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#0088cc]" />
            <span>@Useslyz</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary !py-2.5 !px-6 text-xs font-bold inline-flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Transmitting...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
