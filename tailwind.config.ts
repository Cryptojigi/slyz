import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slyz: {
          lime: "#CDE06A",
          limeHover: "#B5C856",
          periwinkle: "#8D8AFF",
          periwinkleDeep: "#6361CE",
          obsidian: "#0B0E14",
          card: "#161B26",
          cardHover: "#1D2332",
          border: "#262D3D",
          borderLight: "#E5E7EB",
          muted: "#8F9CAE",
          surfaceLight: "#F8F9FA",
        },
      },
      fontFamily: {
        sans: ["Aeonik", "var(--font-montserrat)", "Montserrat", "sans-serif"],
        heading: ["Aeonik", "var(--font-montserrat)", "Montserrat", "sans-serif"],
        mono: ["var(--font-montserrat)", "monospace"],
      },
      borderRadius: {
        pill: "9999px",
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
