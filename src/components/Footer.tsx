import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Scale, FileText, BookOpen, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="slyz-footer border-t border-[#262D3D] pt-8 pb-3 space-y-6 mt-8 text-xs text-[#8F9CAE]">
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
          <div className="flex flex-wrap items-center gap-3 pt-1">
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
            <div className="h-5 w-[1px] bg-[#262D3D]" />
            <a
              href="https://x.com/UseSlyz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Slyz on X"
              className="w-8 h-8 rounded-lg border border-[#262D3D] bg-[#161B26] hover:bg-[#1C2230] hover:border-[#8D8AFF]/50 text-[#8F9CAE] hover:text-white transition-all flex items-center justify-center shadow-sm group"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="w-3.5 h-3.5 fill-current text-[#8F9CAE] group-hover:text-white transition-colors"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://t.me/Useslyz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Slyz Community & Team Chat on Telegram (@Useslyz)"
              className="w-8 h-8 rounded-lg border border-[#262D3D] bg-[#161B26] hover:bg-[#1C2230] hover:border-[#0088cc]/50 text-[#8F9CAE] hover:text-white transition-all flex items-center justify-center shadow-sm group"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="w-3.5 h-3.5 fill-current text-[#8F9CAE] group-hover:text-[#0088cc] transition-colors"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </a>
            <a
              href="mailto:support@useslyz.xyz"
              aria-label="Email Support (support@useslyz.xyz)"
              className="w-8 h-8 rounded-lg border border-[#262D3D] bg-[#161B26] hover:bg-[#1C2230] hover:border-[#CDE06A]/50 text-[#8F9CAE] hover:text-[#CDE06A] transition-all flex items-center justify-center shadow-sm group"
            >
              <Mail className="w-3.5 h-3.5" />
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
              <Link href="/docs" className="hover:text-white transition-colors">
                Documentation
              </Link>
            </li>
            <li>
              <Link href="/feedback" className="hover:text-white transition-colors">
                Feedback & Support
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-white transition-colors">
                Token Directory
              </Link>
            </li>
            <li>
              <a
                href="https://x.com/UseSlyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="w-3 h-3 fill-current opacity-70"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X (Twitter)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
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
            <li className="pt-1.5 border-t border-[#262D3D]/60">
              <a
                href="mailto:support@useslyz.xyz"
                className="hover:text-white transition-colors flex items-center gap-1.5 text-[#8F9CAE]"
              >
                <Mail className="w-3 h-3 text-[#CDE06A]" />
                <span>support@useslyz.xyz</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Sub-Footer */}
      <div className="border-t border-[#262D3D]/60 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8F9CAE]">
        <div className="flex flex-wrap items-center gap-3">
          <span>© 2026 Slyz Protocol. All rights reserved.</span>
          <span className="hidden sm:inline text-[#262D3D]">•</span>
          <a
            href="mailto:support@useslyz.xyz"
            className="hover:text-[#CDE06A] transition-colors"
          >
            support@useslyz.xyz
          </a>
          <span className="hidden sm:inline text-[#262D3D]">•</span>
          <a
            href="https://x.com/UseSlyz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Slyz on X"
            className="hover:text-white transition-colors inline-flex items-center text-[#8F9CAE] hover:opacity-100 opacity-80"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-3.5 h-3.5 fill-current"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
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
