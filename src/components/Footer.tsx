import React from "react";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="border-t border-[#262D3D] pt-12 pb-4 space-y-6 mt-16">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F9CAE]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white tracking-wider">SLYZ</span>
          <span>• Non-custodial xStocks baskets on Solana</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Unified Jupiter Lite API</span>
          <span>•</span>
          <span>Token-2022 Verified</span>
          <span>•</span>
          <span>Slyz 2026</span>
        </div>
      </div>
      <div className="flex justify-center items-center pt-2">
        <a
          href="https://solana.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-transform hover:scale-105"
        >
          <Image
            src="/powered-by-solana.svg"
            alt="Powered by Solana"
            width={176}
            height={56}
            className="h-9 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
        </a>
      </div>
    </footer>
  );
};
