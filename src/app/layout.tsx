import type { Metadata } from "next";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import "@/styles/globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { Navbar } from "@/components/Navbar";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "Slyz — Thematic Stock Basket Investing on Solana",
  description:
    "Pick a theme, set a dollar amount, own the basket. Non-custodial fractional US equities on Solana powered by xStocks and Jupiter.",
  icons: {
    icon: "/slyzlogo.png",
    apple: "/slyzlogo.png",
  },
  openGraph: {
    title: "Slyz — Thematic Stock Basket Investing on Solana",
    description: "Slice the market. Own the theme. Non-custodial xStocks baskets.",
    images: ["/slyzlogo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} dark`}>
      <body className="min-h-screen flex flex-col bg-[#0B0E14] text-white selection:bg-[#CDE06A] selection:text-[#0B0E14]">
        <WalletContextProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-[#262D3D] py-8 bg-[#0B0E14] space-y-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8F9CAE]">
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
        </WalletContextProvider>
      </body>
    </html>
  );
}
