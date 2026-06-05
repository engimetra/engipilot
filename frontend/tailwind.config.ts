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
        background:       "var(--color-background)",
        card:             "var(--color-card)",
        muted:            "var(--color-muted)",
        border:           "var(--color-border)",
        foreground:       "var(--color-foreground)",
        "foreground-2":   "var(--color-foreground-2)",
        "muted-fg":       "var(--color-muted-fg)",
        "muted-fg-2":     "var(--color-muted-fg-2)",
        sidebar:          "var(--color-sidebar)",
        "sidebar-border": "var(--color-sidebar-border)",
        "sidebar-hover":  "var(--color-sidebar-hover)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover:   "var(--color-primary-hover)",
          light:   "var(--color-primary-light)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          light:   "var(--color-success-light)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          light:   "var(--color-warning-light)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          light:   "var(--color-danger-light)",
        },
        purple: {
          DEFAULT: "var(--color-purple)",
          light:   "var(--color-purple-light)",
        },
        teal: {
          DEFAULT: "var(--color-teal)",
          light:   "var(--color-teal-light)",
        },
        orange: "var(--color-orange)",
        blue:   "var(--color-blue)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm:   "0.25rem",
        md:   "0.375rem",
        lg:   "0.625rem",
        xl:   "0.875rem",
        "2xl":"1.125rem",
        "3xl":"1.5rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        xs:         "0 1px 2px 0 rgba(0,0,0,0.05)",
        sm:         "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)",
        card:       "var(--shadow-card)",
        "card-md":  "0 4px 8px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "card-lg":  "0 12px 20px -3px rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.05)",
        "card-hover": "var(--shadow-card-hover)",
        topbar:     "var(--shadow-topbar)",
        float:      "var(--shadow-float)",
        inset:      "inset 0 1px 0 0 rgba(255,255,255,0.08)",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      transitionTimingFunction: {
        spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth:  "cubic-bezier(0.4, 0, 0.2, 1)",
        "in-out":"cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "page-enter": "pageEnter 0.22s cubic-bezier(0.4,0,0.2,1) both",
        "fade-up":    "fadeUp 0.3s cubic-bezier(0.4,0,0.2,1) both",
        "fade-in":    "fadeIn 0.25s ease both",
        "slide-down": "slideDown 0.2s cubic-bezier(0.4,0,0.2,1) both",
        "pulse-dot":  "pulse-dot 2s ease-in-out infinite",
        shimmer:      "shimmer 2s linear infinite",
        float:        "float 4s ease-in-out infinite",
        "spin-slow":  "spinSlow 8s linear infinite",
      },
      keyframes: {
        pageEnter: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%":      { transform: "scale(1.4)", opacity: "0.7" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-18px)" },
        },
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
