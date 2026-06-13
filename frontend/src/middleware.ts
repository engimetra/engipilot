import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)

const BYPASS_INTL = ["/login", "/register", "/reset-password", "/api", "/_next", "/favicon.ico"]
const PUBLIC_SEGMENTS = ["login", "landing", "register", "onboarding", "reset-password"]

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) return true
  const parts = pathname.split("/").filter(Boolean)
  const locales = routing.locales as readonly string[]
  const segment = locales.includes(parts[0] as "fr" | "ar" | "en") ? parts[1] : parts[0]
  return !segment || PUBLIC_SEGMENTS.includes(segment)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
