import type { Config } from "tailwindcss";

/* Design System TAILÂNDIA — ciano neon (accent) e azul-marinho (superfícies) */
const brandCyan = {
  50: "#ECFEFF",
  100: "#CFFAFE",
  200: "#A5F6FF",
  300: "#6DEFFF",
  400: "#2EEBFF",
  500: "#00E5FF",
  600: "#00B8D4",
  700: "#008CA3",
  800: "#006478",
  900: "#0A3F52",
  950: "#062433",
};

const brandNavy = {
  50: "#F3F7FA",
  100: "#E4ECF2",
  200: "#CDD8E1",
  300: "#C0C8CE",
  400: "#A0AAB2",
  500: "#76838F",
  600: "#3D5069",
  700: "#1A3350",
  800: "#10253E",
  900: "#0A192F",
  950: "#050B14",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Paletas remapeadas para a identidade visual TAILÂNDIA
        slate: brandNavy,
        cyan: brandCyan,
        emerald: brandCyan,
        teal: brandCyan,
        green: brandCyan,
        amber: brandCyan,
        background: "#050B14",
        foreground: "#FFFFFF",
        card: {
          DEFAULT: "#0A192F",
          foreground: "#FFFFFF",
          border: "#10304A",
        },
        primary: {
          DEFAULT: "#00E5FF", // Ciano Neon
          hover: "#00B8D4",
          foreground: "#050B14",
        },
        secondary: {
          DEFAULT: "#6DEFFF",
          hover: "#2EEBFF",
          foreground: "#050B14",
        },
        accent: {
          DEFAULT: "#00E5FF",
          hover: "#00B8D4",
          foreground: "#050B14",
        },
        destructive: {
          DEFAULT: "#FF3366",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#10253E",
          foreground: "#A0AAB2",
        },
      },
      fontFamily: {
        sans: ["Poppins", "var(--font-inter)", "system-ui", "sans-serif"],
        display: ["Montserrat", "var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-sm": "0 0 10px rgba(0, 229, 255, 0.35)",
        "neon-md": "0 0 20px rgba(0, 229, 255, 0.55)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        glow: "pulseGlow 2.5s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
