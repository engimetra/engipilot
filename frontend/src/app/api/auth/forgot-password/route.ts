import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8080/api/v1"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 })

  const res = await fetch(
    `${BACKEND}/auth/forgot-password?email=${encodeURIComponent(email)}`,
    { method: "POST" }
  )

  if (!res.ok && res.status !== 200) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
