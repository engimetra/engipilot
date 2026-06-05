import type { Config } from "tailwindcss"

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
        background:   "var(--color-background)",
        card:         "var(--color-card)",
        muted:        "var(--color-muted)",
        border:       "var(--color-border)",
        foreground:   "var(--color-foreground)",
        "muted-fg":   "var(--color-muted-fg)",
        sidebar:      "var(--color-sidebar)",
        "sidebar-border": "var(--color-sidebar-border)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover:   "var(--color-primary-hover)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger:  "var(--color-danger)",
        purple:  "var(--color-purple)",
        teal:    "var(--color-teal)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm:  "0.25rem",
        md:  "0.375rem",
        lg:  "0.75rem",
        xl:  "1rem",
        "2xl": "1.25rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        xs:         "0 1px 2px 0 rgba(0,0,0,0.04)",
        card:       "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-md":  "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "card-lg":  "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
        topbar:     "0 1px 0 0 var(--color-border)",
        inset:      "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
}

export default config
