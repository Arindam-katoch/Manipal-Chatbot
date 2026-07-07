/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Brand orange ramp — anchored on Manipal orange at 500 */
        brand: {
          50: "#FFF8F1",
          100: "#FFEEDE",
          200: "#FFD9B8",
          300: "#FFBD8A",
          400: "#FB9552",
          500: "#F37021",
          600: "#E25A0F",
          700: "#BC450C",
          800: "#953810",
          900: "#78300F",
          950: "#411705",
        },
        /* Dark shell surfaces — shared by the sidebar and Interview Mode */
        ink: {
          800: "#1C2237",
          850: "#161B2E",
          900: "#111527",
          925: "#0E1220",
          950: "#0A0D18",
        },
        /* Legacy aliases kept for compatibility */
        manipal: {
          red: "#ed1c24",
          orange: "#f37021",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        "card-hover":
          "0 2px 4px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.10)",
        input:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px -12px rgba(15, 23, 42, 0.12)",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease both",
        shimmer: "shimmer 1.8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
