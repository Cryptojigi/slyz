"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Scale,
  Globe2,
  FileText,
  AlertTriangle,
  Lock,
  ChevronRight,
  ArrowLeft,
  Coins,
  Cpu,
  CheckCircle2,
} from "lucide-react";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string>("acceptance");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-4 px-2 sm:px-0">
      {/* Top Breadcrumb / Back Link */}
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
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#CDE06A]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 text-[#CDE06A] text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal & Regulatory Framework</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-[#8F9CAE] leading-relaxed">
            Please review these Terms of Service carefully before utilizing the Slyz decentralized protocol,
            frontend interface, smart-routing mechanisms, or thematic asset basket tools.
          </p>
        </div>
      </div>

      {/* Quick Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#161B26]/80 border border-[#262D3D] p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-[#CDE06A]/10 text-[#CDE06A] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">100% Non-Custodial</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            Slyz never holds custody, deposits, or private keys. All assets reside in your own self-hosted Solana wallet.
          </p>
        </div>

        <div className="rounded-xl bg-[#161B26]/80 border border-[#262D3D] p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-[#8D8AFF]/10 text-[#8D8AFF] flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">No Financial Advice</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            Curated themes and allocation studio tools are algorithmic software templates, not investment recommendations.
          </p>
        </div>

        <div className="rounded-xl bg-[#161B26]/80 border border-[#262D3D] p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">PreStocks Disclosures</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            PreStocks provide synthetic economic exposure only. They are not corporate equity shares and confer no voting rights.
          </p>
        </div>

        <div className="rounded-xl bg-[#161B26]/80 border border-[#262D3D] p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
            <Globe2 className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">OFAC & Jurisdiction</h2>
          <p className="text-xs text-[#8F9CAE] leading-relaxed">
            Users located in sanctioned jurisdictions or on international embargo lists are strictly prohibited from access.
          </p>
        </div>
      </div>

      {/* Main Layout: Sticky Navigation (Desktop) + Document Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Table of Contents - Sidebar */}
        <div className="lg:col-span-4 hidden lg:block sticky top-24 space-y-2 bg-[#161B26] border border-[#262D3D] p-4 rounded-xl">
          <p className="text-xs font-bold text-[#CDE06A] uppercase tracking-wider px-3 py-1">
            Table of Contents
          </p>
          <nav className="space-y-1 text-xs">
            {[
              { id: "acceptance", label: "1. Acceptance & Eligibility" },
              { id: "non-custodial", label: "2. Non-Custodial Architecture" },
              { id: "asset-classes", label: "3. Dual-Sleeve Tokenized Assets" },
              { id: "sanctions", label: "4. Sanctions & Restricted Regions" },
              { id: "safe-harbor", label: "5. Safe Harbor & Financial Disclaimers" },
              { id: "risks", label: "6. Protocol & Market Risks" },
              { id: "fees", label: "7. Fees, Transaction Costs & Execution" },
              { id: "prohibited", label: "8. Prohibited Conduct" },
              { id: "liability", label: "9. Limitation of Liability" },
              { id: "amendments", label: "10. Modifications & Contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between ${
                  activeSection === item.id
                    ? "bg-[#CDE06A] text-[#0B0E14] font-bold"
                    : "text-[#8F9CAE] hover:text-white hover:bg-[#1D2332]"
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </nav>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-8 space-y-10 text-sm text-[#8F9CAE] leading-relaxed">
          {/* 1. Acceptance & Eligibility */}
          <section id="acceptance" className="scroll-mt-24 space-y-3 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">01.</span> Acceptance of Terms & Eligibility
            </h2>
            <p>
              By accessing, browsing, interacting with, or connecting a Solana digital asset wallet to the Slyz
              interface (accessible via <strong className="text-white">useslyz.vercel.app</strong> or related domains),
              you explicitly agree to be bound by these Terms of Service (“Terms”).
            </p>
            <p>
              To access or use Slyz, you must be of legal age in your jurisdiction (at least 18 years old or the age
              of majority) and possess the full legal capacity to enter into a binding agreement. If you do not agree
              to these Terms, you must immediately disconnect your wallet and cease using the interface.
            </p>
          </section>

          {/* 2. Non-Custodial Architecture */}
          <section id="non-custodial" className="scroll-mt-24 space-y-3 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">02.</span> Non-Custodial Protocol Architecture
            </h2>
            <p>
              Slyz is an open-source, non-custodial decentralized frontend interface. Slyz does not provide custody,
              escrow, brokerage, or clearing services. At no point does Slyz:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li>Take possession, ownership, or custody of your cryptocurrency, tokens, or private keys.</li>
              <li>Maintain the ability to initiate, freeze, revert, or cancel transactions on your behalf.</li>
              <li>Store, transmit, or have access to your wallet seed phrases or cryptographic credentials.</li>
            </ul>
            <p>
              All swaps, transfers, and liquidations are authorized directly by you through client-side wallet signatures
              (e.g., Phantom, Solflare, Backpack) and executed peer-to-peer on the public Solana blockchain. You are solely
              responsible for safeguarding your private keys and seed phrases.
            </p>
          </section>

          {/* 3. Dual-Sleeve Tokenized Assets */}
          <section id="asset-classes" className="scroll-mt-24 space-y-4 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">03.</span> Dual-Sleeve Tokenized Assets
            </h2>
            <p>
              Slyz facilitates routing for two distinct categories of on-chain assets engineered under the Solana
              Token-2022 program standard:
            </p>

            <div className="space-y-3">
              <div className="rounded-xl bg-[#0B0E14] border border-[#262D3D] p-4 space-y-2">
                <span className="text-xs font-bold text-[#CDE06A] uppercase tracking-wider block">
                  A. Public Equities Sleeve (Backed xStocks)
                </span>
                <p className="text-xs leading-relaxed">
                  Public equities (including NVDAx, AAPLx, MSFTx, TSLAx, AMZNx, METAx, GOOGLx, SPYx, QQQx, and COINx)
                  represent tokenized tracker certificates issued by Backed Finance under Swiss DLT legislation.
                  These tokens track the market value of public securities and are governed by the issuer’s respective
                  prospectus and terms.
                </p>
              </div>

              <div className="rounded-xl bg-[#0B0E14] border border-amber-500/20 p-4 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  B. Private Pre-IPO Sleeve (PreStocks) — Explicit Disclaimer
                </span>
                <p className="text-xs leading-relaxed text-slate-300">
                  PreStocks (including tokens tracking OpenAI, Anthropic, SpaceX, Anduril, Figure AI, Kalshi, Neuralink,
                  and Polymarket) are independent, synthetic, decentralized digital tokens providing economic price
                  tracking.
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 font-medium space-y-1">
                  <p><strong>CRITICAL LEGAL NOTICE:</strong></p>
                  <p>
                    PreStocks do NOT constitute registered equity, common shares, preferred stock, or legal ownership in
                    OpenAI, Anthropic, SpaceX, or any named company. Holding PreStocks does NOT confer voting rights,
                    information rights, dividends, liquidation preferences, or direct claims against the underlying companies.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Sanctions & Restricted Regions */}
          <section id="sanctions" className="scroll-mt-24 space-y-3 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">04.</span> Sanctions & Geographical Restrictions (OFAC)
            </h2>
            <p>
              You represent and warrant that you are not:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li>
                Located in, established under the laws of, or a resident of any country or region subject to comprehensive
                sanctions imposed by the United States Office of Foreign Assets Control (OFAC), the European Union, the
                United Kingdom, or the United Nations (including Cuba, Iran, North Korea, Syria, and the Crimea, Donetsk,
                and Luhansk regions of Ukraine).
              </li>
              <li>
                Listed on any international sanctions watch list, including the OFAC Specially Designated Nationals and
                Blocked Persons List (SDN List) or Consolidated Sanctions List.
              </li>
              <li>
                A person subject to legal restrictions or prohibitions from transacting in synthetic financial derivatives
                or decentralized real-world asset (RWA) tokens under the securities laws of your local jurisdiction.
              </li>
            </ul>
            <p>
              Slyz reserves the right to implement geo-blocking technologies or restrict interface availability to ensure
              full compliance with applicable international sanctions and regulatory mandates.
            </p>
          </section>

          {/* 5. Safe Harbor & Financial Disclaimers */}
          <section id="safe-harbor" className="scroll-mt-24 space-y-3 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">05.</span> Broker-Dealer Safe Harbor & No Financial Advice
            </h2>
            <p>
              <strong className="text-white">No Regulatory Registration:</strong> Slyz is not registered as a broker,
              dealer, investment advisor, investment company, futures commission merchant, commodity pool operator, or
              securities exchange with the U.S. Securities and Exchange Commission (SEC), Financial Industry Regulatory
              Authority (FINRA), Commodity Futures Trading Commission (CFTC), or any foreign securities authority.
            </p>
            <p>
              <strong className="text-white">Algorithmic Software Only:</strong> The curated thematic baskets (e.g.
              *The Mag 3*, *AI Frontier*, *The Index*, *Frontier*) and the Custom Studio sandbox are programmatic templates
              intended solely for technical routing convenience and educational demonstration. They do not constitute
              investment advice, financial planning, portfolio management, or solicitations to purchase or sell any security.
            </p>
            <p>
              All investment decisions are strictly self-directed. You are encouraged to conduct your own independent research
              and consult with qualified legal, financial, and tax advisors prior to executing digital asset transactions.
            </p>
          </section>

          {/* 6. Protocol & Market Risks */}
          <section id="risks" className="scroll-mt-24 space-y-4 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">06.</span> Protocol, Liquidity & Blockchain Risks
            </h2>
            <p>
              Engaging in tokenized stock basket trading involves significant financial and technical risk:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
                <span className="font-bold text-white block">Liquidity & Slippage Risk</span>
                <p>
                  On-chain automated market maker (AMM) pools for tokenized equities can experience low liquidity.
                  Trades may experience slippage. Slyz enforces a 5% price impact safety guard, but market depth can shift
                  rapidly during periods of market stress.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
                <span className="font-bold text-white block">Smart Contract & Network Risk</span>
                <p>
                  Interactions rely on the Solana blockchain, Token-2022 program extensions, and Jupiter DEX routing.
                  Network congestion, dropped RPC requests, and software vulnerabilities can cause delayed or failed fills.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
                <span className="font-bold text-white block">Price Discrepancy Risk</span>
                <p>
                  Tokens trade 24/7 on Solana, whereas traditional US equity markets trade during standard market hours.
                  On-chain token prices may decouple from real-world spot marks during market closures or high volatility.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262D3D] space-y-1">
                <span className="font-bold text-white block">Issuer & Regulatory Risk</span>
                <p>
                  Third-party token issuers (e.g. Backed Finance, PreStocks) may face corporate, regulatory, or operational
                  actions that impact secondary market redemption or transferability.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Fees, Transaction Costs & Execution */}
          <section id="fees" className="scroll-mt-24 space-y-3 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">07.</span> Fees, Transaction Costs & Execution Mechanics
            </h2>
            <p>
              <strong className="text-white">Protocol Fees:</strong> Slyz does not charge a platform commission or deposit
              fee for generating thematic baskets.
            </p>
            <p>
              <strong className="text-white">Network & DEX Fees:</strong> Each sequential swap transaction incurs standard
              Solana network transaction fees (paid in native SOL) and underlying liquidity provider fees charged by decentralized
              exchanges (e.g., Raydium, Orca, Whirlpools) routed via Jupiter.
            </p>
            <p>
              <strong className="text-white">Rent Exemption:</strong> When receiving a Token-2022 token for the first time,
              the Solana network requires a one-time rent-exemption deposit (~0.002 SOL per token account). Users must maintain
              at least 0.015 SOL in their wallet to ensure unhindered multi-leg execution.
            </p>
          </section>

          {/* 8. Prohibited Conduct */}
          <section id="prohibited" className="scroll-mt-24 space-y-3 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">08.</span> Prohibited Conduct
            </h2>
            <p>You agree not to engage in any of the following activities:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
              <li>Using automated bots or scraping tools to launch denial-of-service (DoS) attacks on Slyz RPC endpoints.</li>
              <li>Interacting with the protocol using funds derived from illicit activities, terrorist financing, or money laundering.</li>
              <li>Circumventing geographical access restrictions or IP-blocking controls via deceptive VPN or proxy tunneling.</li>
              <li>Reverse-engineering or attempting to exploit vulnerabilities in the interface or underlying routing logic.</li>
            </ul>
          </section>

          {/* 9. Limitation of Liability */}
          <section id="liability" className="scroll-mt-24 space-y-3 border-b border-[#262D3D] pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">09.</span> Limitation of Liability & “As-Is” Provision
            </h2>
            <p className="uppercase text-xs font-mono text-slate-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SLYZ INTERFACE AND PROTOCOL ARE PROVIDED ON AN “AS IS” AND
              “AS AVAILABLE” BASIS, WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. THE DEVELOPERS, CONTRIBUTORS, AND
              AFFILIATES DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT.
            </p>
            <p>
              IN NO EVENT SHALL SLYZ CONTRIBUTORS OR ASSOCIATED ENTITIES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              PUNITIVE, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR DIGITAL ASSETS
              RESULTING FROM SMART CONTRACT DEFECTS, RPC NODE DROPS, OR UNEXPECTED PRICE SLIPPAGE.
            </p>
          </section>

          {/* 10. Modifications & Contact */}
          <section id="amendments" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#CDE06A]">10.</span> Modifications & Governing Law
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Slyz interface following the
              publication of revised Terms constitutes your irrevocable acceptance of such changes.
            </p>
            <p>
              For developer inquiries, technical auditing, or compliance queries, please consult our official open-source
              repository on GitHub or reach out via official community channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
