import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Scale, FileText, BookOpen } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-[#262D3D] pt-14 pb-8 space-y-10 mt-20 text-xs text-[#8F9CAE]">
      <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Brand Column */}
        <div className="col-span-2 md:col-span-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src="/slyzlogo.png"
                alt="Slyz Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-base text-white tracking-wider">SLYZ</span>
          </div>
          <p className="text-xs leading-relaxed max-w-sm text-[#8F9CAE]">
            Non-custodial, fractional thematic stock basket investing on Solana.
            Powered by Backed xStocks, PreStocks Token-2022, and Jupiter Swap Unified Lite routing.
          </p>
          <div className="pt-1">
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <Image
                src="/powered-by-solana.svg"
                alt="Powered by Solana"
                width={150}
                height={48}
                className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        </div>

        {/* Product Column */}
        <div className="col-span-1 md:col-span-2 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white block">
            Protocol
          </span>
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Curated Themes
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Custom Studio
              </Link>
            </li>
            <li>
              <Link href="/portfolio" className="hover:text-white transition-colors">
                My Portfolio
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources Column */}
        <div className="col-span-1 md:col-span-2 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white block">
            Resources
          </span>
          <ul className="space-y-2">
            <li>
              <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Documentation</span>
                <span className="text-[#CDE06A] text-[9px] font-bold tracking-wider">
                  NEW
                </span>
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-white transition-colors">
                Token Directory
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/Cryptojigi/slyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <span>GitHub Source</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </li>
            <li>
              <a
                href="https://jup.ag"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Jupiter DEX</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance Column */}
        <div className="col-span-2 md:col-span-3 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white block">
            Legal & Compliance
          </span>
          <ul className="space-y-2">
            <li>
              <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                <Scale className="w-3 h-3 text-[#CDE06A]" />
                <span>Terms of Service</span>
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#8D8AFF]" />
                <span>Privacy Policy</span>
              </Link>
            </li>
            <li>
              <Link href="/terms#risks" className="hover:text-white transition-colors">
                Protocol Risk Disclosures
              </Link>
            </li>
            <li>
              <Link href="/terms#sanctions" className="hover:text-white transition-colors">
                OFAC & Sanctions Compliance
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Sub-Footer */}
      <div className="border-t border-[#262D3D]/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#8F9CAE]">
        <div className="flex items-center gap-2">
          <span>© 2026 Slyz Protocol. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px]">
          <span>Solana Mainnet-Beta</span>
          <span>•</span>
          <span>Token-2022 Standard</span>
          <span>•</span>
          <span>Non-Custodial</span>
        </div>
      </div>
    </footer>
  );
};
