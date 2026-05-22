import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F6FA",
        card:       "#FFFFFF",
        muted:      "#F3F4F6",
        border:     "#E5E7EB",
        foreground: "#1F2937",
        "muted-fg": "#6B7280",
        primary: {
          DEFAULT: "#635BFF",
          hover:   "#4F46E5",
        },
        success: "#00C875",
        warning: "#FDAB3D",
        danger:  "#E2445C",
        purple:  "#8b5cf6",
        teal:    "#14b8a6",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm:  "0.375rem",
        md:  "0.5rem",
        lg:  "1rem",
        xl:  "1.25rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card:       "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-md":  "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "card-lg":  "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
        topbar:     "0 1px 0 0 #E5E7EB",
      },
    },
  },
  plugins: [],
}

export default config
