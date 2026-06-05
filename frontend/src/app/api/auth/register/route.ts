import { NextRequest, NextResponse } from "next/server"
import { backendFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res  = await backendFetch("/auth/register", null, {
      method: "POST",
      body:   JSON.stringify(body),
    })
    const json = await res.json() as { success?: boolean; data?: { user: unknown; token: string }; message?: string }

    if (!res.ok) {
      return NextResponse.json(
        { error: json.message ?? "Erreur lors de l'inscription" },
        { status: res.status },
      )
    }

    const raw = (json.data ?? json) as { user: unknown; token?: string; accessToken?: string }
    const { user } = raw
    const token = raw.token ?? raw.accessToken ?? ""

    const response = NextResponse.json({ user }, { status: 201 })
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
