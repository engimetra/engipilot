export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/register", "/landing", "/onboarding"]

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname.includes(".")) {
    return true
  }

  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = request.cookies.get("engipilot_session")?.value
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
