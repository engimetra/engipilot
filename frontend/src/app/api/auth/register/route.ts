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
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message ?? data.error ?? "Erreur inscription" }, { status: res.status })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Serveur inaccessible" }, { status: 503 })
  }
}
