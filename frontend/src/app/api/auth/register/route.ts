import { NextRequest, NextResponse } from "next/server"
import { backendFetch } from "@/lib/api-client"

export const dynamic = "force-dynamic"

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001"

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await req.json()

    // Build payload matching backend schema (full_name, organisation_id)
    const res = await backendFetch("/auth/register", null, {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        fullName:       `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        organisationId: DEFAULT_ORG_ID,
      }),
    })

    const json = await res.json() as {
      success?: boolean
      data?:    { user: unknown; token: string }
      user?:    unknown
      token?:   string
      message?: string
    }

    if (!res.ok) {
      const raw = json.message ?? "Erreur lors de l'inscription"
      const error =
        raw.toLowerCase().includes("exist") || raw.toLowerCase().includes("email")
          ? "Cet email existe déjà"
          : raw === "Erreur lors de l'inscription"
          ? "Erreur serveur"
          : raw
      return NextResponse.json({ error }, { status: res.status })
    }

    const { user, token } = (json.data ?? json) as { user: unknown; token: string }

    const response = NextResponse.json({ user }, { status: 201 })
    if (token) {
      response.cookies.set("engipilot_session", token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        path:     "/",
        maxAge:   8 * 60 * 60,
      })
    }
    return response
  } catch (err) {
    console.error("[proxy /auth/register]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
