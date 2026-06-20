import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  output: "standalone",


  /* ── Node.js packages for API routes (non-edge) ── */
  serverExternalPackages: ["minio", "@prisma/client", "@prisma/adapter-pg", "pg"],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "engipilot.ma",
        "www.engipilot.ma",
        "209.38.231.154",
        "localhost:3000",
      ],
    },
    optimizePackageImports: [
      "lucide-react","recharts","@dnd-kit/core","@dnd-kit/sortable",
      "@radix-ui/react-dialog","@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select","@radix-ui/react-tabs","date-fns",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "http",  hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "cdn.engipilot.ma" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control",    value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://cdn.engipilot.ma http://localhost:9000 https://images.unsplash.com https://plus.unsplash.com",
              "connect-src 'self' https://api.openai.com wss: ws:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
