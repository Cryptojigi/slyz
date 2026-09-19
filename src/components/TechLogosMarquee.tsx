"use client";

import React from "react";
import Image from "next/image";

interface PartnerCompany {
  id: string;
  name: string;
  logoSrc: string;
  width: number;
  height: number;
  className?: string;
}

const PARTNER_COMPANIES: PartnerCompany[] = [
  {
    id: "prestocks",
    name: "PreStocks",
    logoSrc: "/prestocks-logo.svg",
    width: 175,
    height: 42,
    className: "h-7 sm:h-8 w-auto object-contain brightness-110",
  },
  {
    id: "xstocks",
    name: "xStocks",
    logoSrc: "/xstocks-logo.svg",
    width: 140,
    height: 40,
    className: "h-7 sm:h-8 w-auto object-contain",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    logoSrc: "/jupiter2-logo.svg",
    width: 142,
    height: 48,
    className: "h-7 sm:h-8 w-auto object-contain",
  },
  {
    id: "solana",
    name: "Solana",
    logoSrc: "/solana-logo.svg",
    width: 180,
    height: 45,
    className: "h-6 sm:h-7 w-auto object-contain",
  },
  {
    id: "backed",
    name: "Backed Finance",
    logoSrc: "/backed-logo.svg",
    width: 155,
    height: 36,
    className: "h-5 sm:h-6 w-auto object-contain opacity-95",
  },
];

export const TechLogosMarquee: React.FC = () => {
  // Repeat list 4 times for a generous, seamless infinite sliding loop
  const marqueeList = [
    ...PARTNER_COMPANIES,
    ...PARTNER_COMPANIES,
    ...PARTNER_COMPANIES,
    ...PARTNER_COMPANIES,
  ];

  return (
    <div className="relative z-10 mt-10 pt-6 border-t border-[#262D3D]/60 overflow-hidden select-none">
      {/* Marquee Track with Left/Right Gradient Fade Masks */}
      <div className="marquee-wrapper relative overflow-hidden py-3 group">
        {/* Left Fade */}
        <div className="absolute left-0 inset-y-0 w-16 sm:w-28 bg-gradient-to-r from-[#161B26] via-[#161B26]/85 to-transparent z-10 pointer-events-none" />

        {/* Right Fade */}
        <div className="absolute right-0 inset-y-0 w-16 sm:w-28 bg-gradient-to-l from-[#161B26] via-[#161B26]/85 to-transparent z-10 pointer-events-none" />

        {/* Continuous Animated Track (stops on hover) */}
        <div className="animate-marquee-track flex items-center gap-14 sm:gap-20">
          {marqueeList.map((company, index) => (
            <div
              key={`${company.id}-${index}`}
              className="flex items-center shrink-0 opacity-80 hover:opacity-100 transition-all duration-200 transform hover:scale-105"
            >
              <Image
                src={company.logoSrc}
                alt={company.name}
                width={company.width}
                height={company.height}
                className={company.className}
                priority={index < 5}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
