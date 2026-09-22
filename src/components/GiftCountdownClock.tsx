"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface GiftCountdownClockProps {
  targetTimestamp: number; // Unix timestamp in seconds
  onUnlock?: () => void;
  theme?: "gold" | "lime" | "purple";
  className?: string;
}

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function GiftCountdownClock({
  targetTimestamp,
  onUnlock,
  theme = "gold",
  className = "",
}: GiftCountdownClockProps) {
  const [mounted, setMounted] = useState(false);

  const calculateTimeRemaining = (): TimeParts => {
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, targetTimestamp - now);

    const days = Math.floor(diff / (24 * 3600));
    const hours = Math.floor((diff % (24 * 3600)) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return { days, hours, minutes, seconds, totalSeconds: diff };
  };

  const [timeLeft, setTimeLeft] = useState<TimeParts>(calculateTimeRemaining);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeLeft(remaining);

      if (remaining.totalSeconds <= 0) {
        clearInterval(timer);
        if (onUnlock) onUnlock();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp, onUnlock]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Clock className="w-5 h-5 text-[#8F9CAE] animate-pulse" />
        <span className="text-sm font-mono text-[#8F9CAE]">Calculating countdown...</span>
      </div>
    );
  }

  const themeStyles = {
    gold: {
      boxBg: "bg-[#1D1B13]/80 border-[#F5A623]/30 text-[#F5A623]",
      numberText: "text-[#FCD34D]",
      labelText: "text-[#D97706]",
      colonText: "text-[#F5A623]/60",
      glow: "shadow-[0_0_25px_rgba(245,166,35,0.15)]",
    },
    lime: {
      boxBg: "bg-[#161B12]/80 border-[#CDE06A]/30 text-[#CDE06A]",
      numberText: "text-[#E6F38E]",
      labelText: "text-[#CDE06A]",
      colonText: "text-[#CDE06A]/60",
      glow: "shadow-[0_0_25px_rgba(205,224,106,0.15)]",
    },
    purple: {
      boxBg: "bg-[#171426]/80 border-[#8D8AFF]/30 text-[#8D8AFF]",
      numberText: "text-[#B4B2FF]",
      labelText: "text-[#8D8AFF]",
      colonText: "text-[#8D8AFF]/60",
      glow: "shadow-[0_0_25px_rgba(141,138,255,0.15)]",
    },
  }[theme];

  const padZero = (n: number) => n.toString().padStart(2, "0");

  const units = [
    { label: "DAYS", value: padZero(timeLeft.days) },
    { label: "HOURS", value: padZero(timeLeft.hours) },
    { label: "MINS", value: padZero(timeLeft.minutes) },
    { label: "SECS", value: padZero(timeLeft.seconds) },
  ];

  return (
    <div className={`flex flex-col items-center justify-center space-y-2.5 ${className}`}>
      <div className={`flex items-center justify-center gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-2xl border ${themeStyles.boxBg} ${themeStyles.glow} backdrop-blur-md`}>
        {units.map((unit, idx) => (
          <React.Fragment key={unit.label}>
            <div className="flex flex-col items-center min-w-[52px] sm:min-w-[64px]">
              <div className="px-2 py-1.5 sm:py-2 rounded-xl bg-[#0B0E14]/90 border border-white/5 w-full flex items-center justify-center shadow-inner">
                <span className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight ${themeStyles.numberText}`}>
                  {unit.value}
                </span>
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider mt-1 uppercase ${themeStyles.labelText}`}>
                {unit.label}
              </span>
            </div>

            {idx < units.length - 1 && (
              <span className={`font-mono font-bold text-lg sm:text-xl pb-3 animate-pulse ${themeStyles.colonText}`}>
                :
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
