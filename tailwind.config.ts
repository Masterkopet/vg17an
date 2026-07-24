import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "secondary-container": "#dfe0e0", "on-error": "#ffffff", "surface-container": "#f0edee",
        "tertiary-fixed": "#ffe16d", "tertiary-container": "#c9a900", "outline": "#956d67",
        "on-primary-container": "#fffbff", "tertiary-fixed-dim": "#e9c400", "secondary-fixed": "#e2e2e2",
        "on-error-container": "#93000a", "surface": "#fcf8f9", "surface-container-lowest": "#ffffff",
        "primary-fixed": "#ffdad4", "on-tertiary-container": "#4c3f00", "primary": "#bc0100",
        "on-secondary-container": "#616363", "on-tertiary-fixed": "#221b00", "on-secondary-fixed-variant": "#454747",
        "on-primary-fixed-variant": "#930100", "on-tertiary": "#ffffff", "surface-container-low": "#f6f3f4",
        "surface-container-highest": "#e5e2e3", "background": "#fcf8f9", "inverse-primary": "#ffb4a8",
        "on-secondary": "#ffffff", "inverse-surface": "#303031", "primary-fixed-dim": "#ffb4a8",
        "surface-bright": "#fcf8f9", "on-tertiary-fixed-variant": "#544600", "secondary": "#5d5f5f",
        "on-surface-variant": "#603e39", "tertiary": "#705d00", "outline-variant": "#ebbbb4",
        "on-primary-fixed": "#410000", "surface-variant": "#e5e2e3", "primary-container": "#eb0000",
        "secondary-fixed-dim": "#c6c6c7", "error": "#ba1a1a", "surface-dim": "#dcd9da",
        "error-container": "#ffdad6", "inverse-on-surface": "#f3f0f1", "on-secondary-fixed": "#1a1c1c",
        "on-background": "#1b1b1c", "on-primary": "#ffffff", "on-surface": "#1b1b1c",
        "surface-tint": "#c00100", "surface-container-high": "#eae7e8",
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
      spacing: {
        "stack-lg": "32px", "stack-sm": "8px", "gutter": "24px", "container-max": "1200px",
        "margin-mobile": "16px", "base": "8px", "stack-md": "16px", "margin-desktop": "48px",
      },
      maxWidth: { "container-max": "1200px" },
      fontFamily: {
        "headline-xl-mobile": ["var(--font-montserrat)"], "headline-md": ["var(--font-montserrat)"],
        "label-md": ["var(--font-jakarta)"], "headline-xl": ["var(--font-montserrat)"],
        "body-lg": ["var(--font-jakarta)"], "body-md": ["var(--font-jakarta)"],
        "headline-lg": ["var(--font-montserrat)"], "headline-lg-mobile": ["var(--font-montserrat)"],
        "headline-sm": ["var(--font-montserrat)"],
      },
      fontSize: {
        "headline-xl-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "600" }],
        "headline-xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};

export default config;
