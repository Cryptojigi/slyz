"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface DonutSlice {
  name: string;
  value: number; // percentage
  color: string;
  usdAmount?: number;
}

interface Props {
  data: DonutSlice[];
  centerLabel?: string;
  centerSublabel?: string;
  height?: number;
}

export const DONUT_COLORS = [
  "#CDE06A", // Volt Lime
  "#8D8AFF", // Electric Periwinkle
  "#6361CE", // Deep Periwinkle
  "#B5C856", // Pear Green
  "#4FACFE", // Electric Cyan
];

export const DonutChart: React.FC<Props> = ({
  data,
  centerLabel,
  centerSublabel,
  height = 240,
}) => {
  return (
    <div className="relative w-full flex items-center justify-center" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="92%"
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationDuration={600}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]}
                className="transition-opacity duration-150 hover:opacity-85 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DonutSlice;
                return (
                  <div className="bg-[#161B26] border border-[#262D3D] px-3 py-2 rounded-xl text-xs shadow-xl backdrop-blur-md">
                    <p className="font-bold text-white flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      {item.name}
                    </p>
                    <p className="text-[#CDE06A] font-mono mt-0.5 font-bold">
                      {item.value.toFixed(1)}%
                      {item.usdAmount !== undefined && (
                        <span className="text-[#8F9CAE] font-normal ml-1">
                          (${item.usdAmount.toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label Overlay */}
      {(centerLabel || centerSublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {centerLabel && (
            <span className="text-xl font-bold text-white tracking-tight font-mono">
              {centerLabel}
            </span>
          )}
          {centerSublabel && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#8F9CAE]">
              {centerSublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
