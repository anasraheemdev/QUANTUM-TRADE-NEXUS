import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bluish-dark theme colors
        dark: {
          bg: "#0a0e27",
          card: "#0f1629",
          hover: "#151b2e",
          border: "#1a2332",
        },
        blue: {
          primary: "#3b82f6",
          secondary: "#60a5fa",
          accent: "#93c5fd",
          glow: "#3b82f6",
          dark: "#1e40af",
        },
        neon: {
          blue: "#00d9ff",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "blue-gradient": "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
      },
      boxShadow: {
        "blue-glow": "0 0 20px rgba(59, 130, 246, 0.5)",
        "neon-blue": "0 0 10px rgba(0, 217, 255, 0.8)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "bounce": "bounce 1s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;


