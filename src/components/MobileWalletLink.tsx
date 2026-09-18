"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ExternalLink, Smartphone, X } from "lucide-react";

/**
 * Mobile deep-link fallback banner.
 *
 * On a phone, a normal browser (Safari / Chrome) has NO injected Solana wallet,
 * so the standard wallet modal has nothing to list. Wallet Standard wallets only
 * register when the page is opened *inside* a wallet's own in-app browser.
 *
 * This renders a fixed bottom banner with universal links that re-open the
 * current URL inside Phantom or Solflare, where the wallet IS available.
 *
 * It renders nothing on desktop, when a wallet is already available, or when the
 * user is already connected — so it never interferes with the normal flow.
 */
export const MobileWalletLink: React.FC = () => {
  const { wallets, connected } = useWallet();
  const [target, setTarget] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && typeof window !== "undefined") {
      setTarget(window.location.href);
      setOrigin(window.location.origin);
    }
  }, []);

  // Not mobile, no URL yet, wallet detected, already connected, or dismissed
  if (!target || dismissed || connected || wallets.length > 0) return null;

  const encodedUrl = encodeURIComponent(target);
  const ref = encodeURIComponent(origin);

  const phantomUrl = `https://phantom.app/ul/browse/${encodedUrl}?ref=${ref}`;
  const solflareUrl = `https://solflare.com/ul/v1/browse/${encodedUrl}?ref=${ref}`;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#0B0E14]/95 backdrop-blur-xl border-t border-[#262D3D] md:hidden">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <Smartphone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#CDE06A]" />

        <div className="flex-1 space-y-2.5">
          <p className="text-[11px] text-[#8F9CAE] leading-relaxed">
            No Solana wallet detected in this browser. Open Slyz inside your wallet
            app to connect and invest.
          </p>

          <div className="flex flex-wrap gap-2">
            <a
              href={phantomUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CDE06A] text-[#0B0E14] text-[11px] font-bold transition-transform active:scale-95"
            >
              <span>Open in Phantom</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={solflareUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1D2332] border border-[#262D3D] text-white text-[11px] font-bold transition-transform active:scale-95"
            >
              <span>Open in Solflare</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="p-1 rounded-lg text-[#8F9CAE] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
