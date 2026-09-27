import type { Metadata } from "next";
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
    description:
      "Non-custodial fractional US equities, 1-click curated baskets, and zero-fee stock gifting on Solana.",
    url: "https://useslyz.vercel.app",
    siteName: "Slyz",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Slyz — Thematic Stock Basket Investing on Solana",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@UseSlyz",
    creator: "@UseSlyz",
    title: "Slyz — Thematic Stock Basket Investing on Solana",
    description:
      "Non-custodial fractional US equities, 1-click curated baskets, and zero-fee stock gifting on Solana.",
    images: ["/og-image.png"],
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
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 pb-8 sm:pt-4 sm:pb-8 overflow-x-hidden">
            {children}
          </main>
        </WalletContextProvider>
      </body>
    </html>
  );
}
