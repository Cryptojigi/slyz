"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  EyeOff,
  Database,
  Server,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  HardDrive,
  Info,
  Cookie,
  ExternalLink,
} from "lucide-react";

export default function PrivacyPage() {
  const [cleared, setCleared] = useState(false);

  const handleClearLocalCache = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("slyz_prestocks_last_payload");
        localStorage.removeItem("slyz_investments");
        setCleared(true);
        setTimeout(() => setCleared(false), 4000);
      } catch (err) {
        console.error("Failed to clear local cache:", err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-4 px-2 sm:px-0">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#8F9CAE]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Slyz Home</span>
        </Link>
        <span className="text-[11px] font-mono bg-[#161B26] px-2.5 py-1 rounded-md border border-[#262D3D]">
          Effective Date: September 19, 2026
        </span>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#161B26] border border-[#262D3D] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8D8AFF]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-[#8D8AFF] text-xs font-bold uppercase tracking-wider">
            <EyeOff className="w-3.5 h-3.5" />
            <span>Decentralized Privacy Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[#8F9CAE] leading-relaxed">
            Slyz is built on a zero-knowledge, non-custodial foundation. We collect no personal identification,
            maintain no user database, and track zero off-chain behavioral profiles.
          </p>
        </div>
      </div>

      {/* 3 Pillars Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#161B26] border border-[#262D3D] p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#CDE06A]/10 text-[#CDE06A] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Zero KYC & Registration</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            No emails, no phone numbers, no passwords, and no legal identity documents required to use Slyz.
          </p>
        </div>

        <div className="rounded-xl bg-[#161B26] border border-[#262D3D] p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#8D8AFF]/10 text-[#8D8AFF] flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">No Centralized Database</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            We operate zero central user registries. Your portfolio positions exist strictly on the public Solana blockchain.
          </p>
        </div>

        <div className="rounded-xl bg-[#161B26] border border-[#262D3D] p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
            <Cookie className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Zero Tracking Cookies</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            We use zero advertising trackers, zero invasive tracking pixels, and do not monetize or sell behavioral traffic data.
          </p>
        </div>
      </div>

      {/* Structured Content Sections */}
      <div className="space-y-8 text-sm text-[#8F9CAE] leading-relaxed">
        {/* Section 1 */}
        <div className="rounded-2xl bg-[#161B26]/80 border border-[#262D3D] p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-[#CDE06A]">01.</span> Web3 Privacy Philosophy
          </h2>
          <p>
            At Slyz, we believe financial sovereignty begins with user privacy. Traditional platforms collect extensive
            personal identifying records (KYC), track browsing behaviors, and store confidential information in central
            vulnerable databases.
          </p>
          <p>
            Slyz replaces centralized account models with client-side cryptographic wallet authentication (Phantom, Solflare,
            Backpack). When you connect your wallet, Slyz merely reads your public on-chain balances to render your portfolio
            dashboard. We cannot identify who you are, where you live, or what other accounts you own.
          </p>
        </div>

        {/* Section 2 - Data Matrix Table */}
        <div className="rounded-2xl bg-[#161B26]/80 border border-[#262D3D] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-[#CDE06A]">02.</span> Data Transparency Matrix
          </h2>
          <p className="text-xs text-slate-300">
            Here is an honest, itemized breakdown of what Slyz processes versus what is never touched:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#262D3D] rounded-lg overflow-hidden">
              <thead className="bg-[#0B0E14] text-white uppercase text-[10px] font-bold border-b border-[#262D3D]">
                <tr>
                  <th className="p-3">Data Category</th>
                  <th className="p-3">Collection Status</th>
                  <th className="p-3">Purpose & Storage Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262D3D] text-slate-300">
                <tr>
                  <td className="p-3 font-semibold text-white">Name, Email, Phone, Address</td>
                  <td className="p-3 text-emerald-400 font-bold">NEVER COLLECTED</td>
                  <td className="p-3 text-[#8F9CAE]">No registration forms exist.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Private Keys & Seed Phrases</td>
                  <td className="p-3 text-emerald-400 font-bold">NEVER ACCESSED</td>
                  <td className="p-3 text-[#8F9CAE]">Safeguarded exclusively inside your wallet software.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Public Solana Wallet Address</td>
                  <td className="p-3 text-[#CDE06A] font-medium">Read-Only in Browser</td>
                  <td className="p-3 text-[#8F9CAE]">Used solely to query on-chain Token-2022 account balances.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Local Investment History</td>
                  <td className="p-3 text-[#8D8AFF] font-medium">Local Browser Cache</td>
                  <td className="p-3 text-[#8F9CAE]">Stored on your device (`localStorage`) for fast dashboard load.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">IP & Network Telemetry</td>
                  <td className="p-3 text-slate-400 font-medium">Transient RPC Level</td>
                  <td className="p-3 text-[#8F9CAE]">Processed ephemerally by Alchemy RPC nodes to broadcast blocks.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 - Local Storage Disclosures */}
        <div className="rounded-2xl bg-[#161B26]/80 border border-[#262D3D] p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-[#CDE06A]">03.</span> Local Device Storage (`localStorage`)
          </h2>
          <p>
            To deliver an instant, resilient user experience that survives offline network drops, Slyz saves minimal
            functional state directly within your browser’s local storage:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li>
              <code className="text-[#CDE06A] bg-[#0B0E14] px-1.5 py-0.5 rounded">slyz_prestocks_last_payload</code>:
              A cached snapshot of official PreStocks valuation marks so the app never shows blank quotes if the external
              API is slow.
            </li>
            <li>
              <code className="text-[#8D8AFF] bg-[#0B0E14] px-1.5 py-0.5 rounded">slyz_investments</code>:
              Your personalized target basket weights to calculate drift percentages when tracking rebalances.
            </li>
          </ul>

          {/* Direct Clear Cache Action */}
          <div className="pt-4 border-t border-[#262D3D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0B0E14]/60 p-4 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Exercise Your Right to Erasure</span>
              <span className="text-[11px] text-[#8F9CAE]">
                Clear all Slyz cached data and target allocations from this browser with one click.
              </span>
            </div>
            <button
              onClick={handleClearLocalCache}
              className="px-4 py-2 rounded-lg bg-[#1D2332] hover:bg-rose-500/20 text-xs font-bold text-[#8F9CAE] hover:text-rose-400 border border-[#262D3D] transition-colors flex items-center gap-2 shrink-0"
            >
              {cleared ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Local Cache Cleared!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Local Storage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 4 - Third-Party Services */}
        <div className="rounded-2xl bg-[#161B26]/80 border border-[#262D3D] p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-[#CDE06A]">04.</span> Third-Party Protocols & Infrastructure
          </h2>
          <p>
            When utilizing Slyz, certain requests route through decentralized infrastructure partners:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
              <strong className="text-white block">Alchemy Solana RPC</strong>
              <p className="text-[11px]">
                Queries account balances and broadcasts signed transactions. Subject to Alchemy’s privacy policy.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
              <strong className="text-white block">Jupiter DEX Aggregator</strong>
              <p className="text-[11px]">
                Calculates optimal route paths across Raydium and Orca. No personal user data is transmitted.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
              <strong className="text-white block">Reown Cloud (WalletConnect)</strong>
              <p className="text-[11px]">
                Encrypted peer-to-peer relay for mobile QR-code connections. Transmits zero unencrypted payload data.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5 - Rights & Contact */}
        <div className="rounded-2xl bg-[#161B26]/80 border border-[#262D3D] p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-[#CDE06A]">05.</span> User Rights & Ongoing Compliance
          </h2>
          <p>
            Because we hold no personal data records, traditional identity-based requests (e.g., GDPR Subject Access
            Requests) do not apply to Slyz. You maintain total technical autonomy:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
            <li>You can disconnect your wallet at any moment from your browser extension.</li>
            <li>You can purge your local browser cache at any time using the tool above.</li>
            <li>Your on-chain transactions remain permanent on the decentralized Solana ledger by design.</li>
          </ul>
          <p className="pt-2 text-xs">
            For questions regarding our privacy architecture, open an issue on our official GitHub repository.
          </p>
        </div>
      </div>
    </div>
  );
}
