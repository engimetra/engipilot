import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8080/api/v1"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND}/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json() as { success?: boolean; data?: { user: unknown; token: string }; message?: string }

    if (!res.ok) {
      return NextResponse.json(
        { error: json.message ?? "Erreur lors de l'inscription" },
        { status: res.status },
      )
    }

    const { user, token } = (json.data ?? json) as { user: unknown; token: string }
    const plan = body.plan ?? null

    const response = NextResponse.json({ user, ...(plan ? { plan } : {}) }, { status: 201 })
    response.cookies.set("engipilot_session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   8 * 60 * 60,
    })
    return response
  } catch (err) {
    console.error("[proxy /auth/register]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
