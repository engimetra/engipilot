import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  /* ── Node.js packages for API routes (non-edge) ── */
  serverExternalPackages: ["minio"],

  /* ── Production compression ── */
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  /* ── Tree-shake heavy packages ── */
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "date-fns",
    ],
  },

  /* ── Image optimization ── */
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "http",  hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "cdn.engipilot.ma" },
    ],
  },

  /* ── Security + Cache headers ── */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff"                                       },
          { key: "X-Frame-Options",            value: "DENY"                                          },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin"               },
          { key: "X-DNS-Prefetch-Control",     value: "on"                                            },
          { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload"  },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()"      },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://cdn.engipilot.ma http://localhost:9000",
              "connect-src 'self' https://api.openai.com wss: ws:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      /* Aggressive cache for static assets */
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      /* Cache public fonts and images */
      {
        source: "/fonts/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
