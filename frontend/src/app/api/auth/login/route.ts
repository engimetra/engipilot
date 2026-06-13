import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://engipilot-backend:8080/api/v1"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message ?? data.error ?? "Erreur de connexion" }, { status: res.status })
    const token = data.token ?? ""
    const user  = data.user ?? null
    if (!token) return NextResponse.json({ error: "Token absent" }, { status: 502 })
    const response = NextResponse.json({ user })
    response.cookies.set("engipilot_session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   8 * 60 * 60,
    })
    return response
  } catch (e) {
    return NextResponse.json({ error: "Serveur inaccessible" }, { status: 503 })
  }
}
