import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { jwtVerify } from "jose"
import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)

const BYPASS_INTL = ["/login", "/register", "/reset-password", "/api", "/_next", "/favicon.ico"]
const PUBLIC_SEGMENTS = ["login", "landing", "accueil", "register", "onboarding", "reset-password", "pricing"]

const ALLOWED_ORIGINS = [
  "https://engipilot.ma",
  "https://www.engipilot.ma",
  "https://209.38.231.154",
  "http://209.38.231.154",
]

const ADMIN_ONLY_SEGMENTS = ["admin"]
const BILLING_SEGMENTS   = ["facturation"]

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) return true
  const parts = pathname.split("/").filter(Boolean)
  const locales = routing.locales as readonly string[]
  const segment = locales.includes(parts[0] as "fr" | "ar" | "en") ? parts[1] : parts[0]
  return !segment || PUBLIC_SEGMENTS.includes(segment)
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "engipilot-dev-secret-change-in-production"
  return new TextEncoder().encode(secret)
}

interface JwtPayload {
  sub?: string
  email?: string
  role?: string
  organisationId?: string
  plan?: string
  exp?: number
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] })
    return payload as JwtPayload
  } catch {
    return null
  }
}

function getRoleFromPayload(payload: JwtPayload): string {
  return payload.role ?? "UTILISATEUR_STANDARD"
}

function getDashboardPath(role: string, locale: string): string {
  const prefix = locale && locale !== "fr" ? `/${locale}` : ""
  switch (role) {
    case "SUPER_ADMIN":       return `${prefix}/admin`
    case "ADMIN_ENTREPRISE":
    case "ADMIN":             return `${prefix}/chantiers`
    case "CHEF_PROJET":       return `${prefix}/chantiers`
    case "CHEF_CHANTIER":     return `${prefix}/kanban`
    case "CONSULTANT":
    case "LECTEUR":           return `${prefix}/rapports`
    default:                  return `${prefix}/chantiers`
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin") ?? ""

  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin":      ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        "Access-Control-Allow-Methods":     "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":     "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    })
  }

  if (pathname.startsWith("/api")) {
    const response    = NextResponse.next()
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin)
    response.headers.set("Access-Control-Allow-Credentials", "true")
    return response
  }

  if (!isPublicPath(pathname)) {
    const token = request.cookies.get("engipilot_session")?.value

    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const payload = await verifyToken(token)
    if (!payload) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("expired", "1")
      const resp = NextResponse.redirect(loginUrl)
      resp.cookies.delete("engipilot_session")
      return resp
    }

    const role  = getRoleFromPayload(payload)
    const parts = pathname.split("/").filter(Boolean)
    const locales = routing.locales as readonly string[]
    const hasLocale = locales.includes(parts[0] as "fr" | "ar" | "en")
    const segment   = hasLocale ? parts[1] : parts[0]
    const locale    = hasLocale ? parts[0] : "fr"

    if (!segment) {
      return NextResponse.redirect(new URL(getDashboardPath(role, locale), request.url))
    }

    if (ADMIN_ONLY_SEGMENTS.includes(segment)) {
      if (role !== "SUPER_ADMIN" && role !== "ADMIN_ENTREPRISE" && role !== "ADMIN") {
        return NextResponse.redirect(new URL(getDashboardPath(role, locale), request.url))
      }
    }

    if (BILLING_SEGMENTS.includes(segment)) {
      const billingRoles = ["SUPER_ADMIN", "ADMIN_ENTREPRISE", "ADMIN", "CHEF_PROJET"]
      if (!billingRoles.includes(role)) {
        return NextResponse.redirect(new URL(getDashboardPath(role, locale), request.url))
      }
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
