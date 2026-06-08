import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)

const BYPASS_INTL = ["/login", "/register", "/reset-password", "/api", "/_next", "/favicon.ico"]
const PUBLIC_SEGMENTS = ["login", "landing", "register", "onboarding", "reset-password"]

const ALLOWED_ORIGINS = [
  "https://engipilot.ma",
  "https://www.engipilot.ma",
  "https://209.38.231.154",
  "http://209.38.231.154",
]

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) return true
  const parts = pathname.split("/").filter(Boolean)
  const locales = routing.locales as readonly string[]
  const segment = locales.includes(parts[0] as "fr" | "ar" | "en") ? parts[1] : parts[0]
  return !segment || PUBLIC_SEGMENTS.includes(segment)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin") ?? ""

  /* ── CORS preflight for API routes ── */
  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin":  ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    })
  }

  /* ── CORS headers for API routes ── */
  if (pathname.startsWith("/api")) {
    const response = NextResponse.next()
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
    response.headers.set("Access-Control-Allow-Credentials", "true")
    return response
  }

  /* ── Auth guard ── */
  if (!isPublicPath(pathname)) {
    const session    = request.cookies.get("engipilot_session")?.value
    const authHeader = request.headers.get("authorization")
    if (!session && !authHeader) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  if (BYPASS_INTL.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
