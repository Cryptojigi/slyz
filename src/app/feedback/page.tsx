import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { FeedbackForm } from "@/components/FeedbackForm";
import {
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Clock,
  Send,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Feedback & Support | Slyz",
  description:
    "Share challenges, report technical issues, or submit product inquiries directly to the Slyz core team at support@useslyz.xyz or @Useslyz.",
};

export default function FeedbackPage() {
  const telegramSupportUrl =
    process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL?.trim() || "https://t.me/Useslyz";

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4 space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F9CAE] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Slyz</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="space-y-2 border-b border-[#262D3D] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Support & Feedback Portal
        </h1>
        <p className="text-xs sm:text-sm text-[#8F9CAE] max-w-2xl leading-relaxed">
          Encountered an issue navigating the site or have a suggestion? Share your experience with our team.
          Submissions are reviewed directly by our operations desk at <strong className="text-white">support@useslyz.xyz</strong> and synchronized with our community on Telegram.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Section */}
        <div className="lg:col-span-8 rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-8 shadow-sm">
          <FeedbackForm />
        </div>

        {/* Sidebar Assistance */}
        <div className="lg:col-span-4 space-y-4">
          {/* Direct Support Desk Box */}
          <div className="rounded-2xl bg-[#161B26] border border-[#262D3D] p-5 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-[#CDE06A]/10 text-[#CDE06A] flex items-center justify-center">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Official Support Desk
              </h3>
            </div>
            <p className="text-xs text-[#8F9CAE] leading-relaxed">
              For transaction inquiries, bug reports, or partnership proposals, email our operations desk directly:
            </p>
            <a
              href="mailto:support@useslyz.xyz"
              className="w-full btn-secondary !py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Mail className="w-3.5 h-3.5 text-[#CDE06A]" />
              <span>support@useslyz.xyz</span>
            </a>

            <div className="pt-3 border-t border-[#262D3D] space-y-2.5">
              <div className="flex items-center gap-2 text-white">
                <div className="w-6 h-6 rounded-lg bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center">
                  <Send className="w-3 h-3" />
                </div>
                <h4 className="font-bold text-xs">
                  Telegram Team Chat
                </h4>
              </div>
              <p className="text-[11px] text-[#8F9CAE] leading-relaxed">
                Connect directly with our core team and community on Telegram (<strong className="text-white">@Useslyz</strong>) for real-time inquiries.
              </p>
              <a
                href={telegramSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#0B0E14] border border-[#262D3D] hover:border-[#0088cc]/50 text-xs text-[#8F9CAE] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>Open @Useslyz on Telegram</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>

          {/* Quick Troubleshooting Guide */}
          <div className="rounded-2xl bg-[#0B0E14] border border-[#262D3D] p-5 space-y-3 text-xs text-[#8F9CAE]">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Quick Troubleshooting
            </h4>
            <ul className="space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#F5A623] shrink-0 mt-0.5" />
                <span>
                  <strong>Transaction delays:</strong> Solana network confirmation can occasionally take 15–30 seconds. Unconfirmed drafts remain saved.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#CDE06A] shrink-0 mt-0.5" />
                <span>
                  <strong>Gift claiming:</strong> Recipients never need SOL to claim equity gifts; the escrow vault sponsors all fees.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
