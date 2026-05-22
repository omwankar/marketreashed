/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/pages/**/*.{js,jsx}",
    "./src/components/platform/**/*.{js,jsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        plt: {
          bg: "#020817",
          surface: "#0d1526",
          primary: "#2563eb",
          accent: "#7c3aed",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "plt-glow": "0 0 40px rgba(37, 99, 235, 0.4)",
        "plt-glow-accent": "0 0 40px rgba(124, 58, 237, 0.35)",
      },
      animation: {
        "plt-float": "plt-float 4s ease-in-out infinite",
        "plt-marquee": "plt-marquee 35s linear infinite",
        "plt-pulse-ring": "plt-pulse-ring 2s ease-out infinite",
      },
      keyframes: {
        "plt-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "plt-marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "plt-pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
