import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8080/api/v1"
export async function GET(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value ?? req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const res = await fetch(`${BACKEND}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: "Serveur inaccessible" }, { status: 503 })
  }
}
