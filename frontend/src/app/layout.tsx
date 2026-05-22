import type { Metadata } from "next"
import { Inter, Noto_Sans_Arabic } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/layout/Providers"
import { headers } from "next/headers"

const inter = Inter({
  subsets:  ["latin"],
  display:  "swap",
  variable: "--font-inter",
})

const notoArabic = Noto_Sans_Arabic({
  subsets:  ["arabic"],
  display:  "swap",
  variable: "--font-arabic",
})

export const metadata: Metadata = {
  title: "ENGIPILOT — Supervision Intelligente des Chantiers",
  description: "Plateforme SaaS BTP · KPIs EVM · IA Prédictive · Gestion de performance",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const locale = headersList.get("x-next-intl-locale") ?? "fr"

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${inter.variable} ${notoArabic.variable}`}
    >
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
