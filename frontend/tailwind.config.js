/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070F",
          900: "#0A0F1E",
          800: "#0F1630",
          700: "#131B3A",
          600: "#1B2447",
          500: "#232E58",
        },
        hairline: "rgba(233,238,255,0.09)",
        paper: {
          50: "#F5F6FB",
          100: "#EDEFF9",
          400: "#B7BEDA",
          500: "#9AA3C1",
        },
        signal: {
          alert: "#F2545B",
          alertSoft: "#5A2530",
          warn: "#F2A93B",
          warnSoft: "#4A3820",
          safe: "#35C88E",
          safeSoft: "#1D4438",
        },
        brand: {
          400: "#8AA2FF",
          500: "#6D8CFF",
          600: "#4E6EE0",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(109,140,255,0.25), 0 0 32px -4px rgba(109,140,255,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(233,238,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(233,238,255,0.05) 1px, transparent 1px)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.25 },
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        scan: "scan 3.2s linear infinite",
        blink: "blink 1.6s ease-in-out infinite",
        rise: "rise 0.6s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};
