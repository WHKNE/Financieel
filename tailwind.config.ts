import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b14",
        surface: "#0f1628",
        "surface-2": "#151e35",
        border: "#1a2744",
        "border-light": "#243558",
        primary: "#3b82f6",
        "primary-light": "#60a5fa",
        cyan: "#06b6d4",
        purple: "#8b5cf6",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        "text-primary": "#f1f5f9",
        "text-secondary": "#94a3b8",
        "text-muted": "#475569",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        "gradient-purple": "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
        "gradient-success": "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
        "gradient-danger": "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
        "gradient-bg": "radial-gradient(ellipse at top, #0f1e3d 0%, #080b14 70%)",
        "card-gradient": "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(6,182,212,0.02) 100%)",
      },
      animation: {
        "particle-float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow 2s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        slideIn: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
