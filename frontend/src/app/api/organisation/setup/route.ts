import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
export const dynamic = "force-dynamic"
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://engipilot-backend:8080/api/v1"
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "engipilot-dev-secret-change-in-production")
export async function POST(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
    const organisationId = payload.organisationId as string | undefined
    if (!organisationId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 })
    const body = await req.json() as { nom?: string; secteur?: string; taille?: string }
    if (!body.nom?.trim()) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 })
    const res = await fetch(`${BACKEND}/organisations/${organisationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nom: body.nom.trim(), secteur: body.secteur, taille: body.taille }),
    })
    if (!res.ok) return NextResponse.json({ ok: true })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }
}
