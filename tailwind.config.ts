import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        scan: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
      },
      animation: {
        scan: "scan 2s linear infinite",
      },
    },
  },
};

export default config;
