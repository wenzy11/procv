import type { Config } from "tailwindcss";

/**
 * ProCV — Tailwind design tokens.
 *
 * The token surface intentionally mirrors a high-end dark SaaS:
 * - `surface.*`     : layered slate/zinc backgrounds (#09090b → elevated panels)
 * - `border.*`      : subtle, low-contrast hairlines
 * - `accent.*`      : the cyber-neon brand (electric-blue → violet)
 * - `state.*`       : semantic status colors (success/warn/danger/info)
 *
 * Components should consume these tokens via Tailwind utility classes rather
 * than re-declaring hex values; this keeps the look cohesive and themable.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        surface: {
          base: "#09090b",
          raised: "#0c0c10",
          panel: "#101014",
          card: "#13131a",
          elevated: "#1a1a22",
          inset: "#08080b",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          default: "rgba(255,255,255,0.09)",
          strong: "rgba(255,255,255,0.14)",
        },
        ink: {
          primary: "#f4f4f5",
          secondary: "#a1a1aa",
          tertiary: "#71717a",
          muted: "#52525b",
          disabled: "#3f3f46",
        },
        accent: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#b3d4ff",
          300: "#7fb3ff",
          400: "#4a8bff",
          500: "#2f6bff",
          600: "#1f4be0",
          700: "#1c3bb3",
          DEFAULT: "#3b82f6",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        state: {
          success: "#22c55e",
          successSoft: "rgba(34,197,94,0.12)",
          warn: "#f59e0b",
          warnSoft: "rgba(245,158,11,0.14)",
          danger: "#ef4444",
          dangerSoft: "rgba(239,68,68,0.14)",
          info: "#38bdf8",
          infoSoft: "rgba(56,189,248,0.14)",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #3b82f6 0%, #6366f1 45%, #a855f7 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(168,85,247,0.18) 100%)",
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(99,102,241,0.12), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.25), 0 8px 32px -8px rgba(99,102,241,0.45)",
        "glow-strong":
          "0 0 0 1px rgba(99,102,241,0.4), 0 12px 48px -8px rgba(168,85,247,0.55)",
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 40px -16px rgba(0,0,0,0.65)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        xs: "0.375rem",
        DEFAULT: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(99,102,241,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(99,102,241,0)" },
        },
        "border-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms cubic-bezier(.2,.7,.2,1) both",
        shimmer: "shimmer 1.8s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "border-spin": "border-spin 6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
