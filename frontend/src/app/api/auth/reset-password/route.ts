import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8080/api/v1"

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()
  if (!token || !newPassword) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }
  const res = await fetch(
    `${BACKEND}/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`,
    { method: "POST" }
  )
  if (res.status === 400) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 })
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
