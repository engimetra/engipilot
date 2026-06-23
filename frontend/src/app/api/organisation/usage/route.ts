import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
export const dynamic = "force-dynamic"

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://engipilot-backend:8080/api/v1"
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "engipilot-dev-secret-change-in-production"
)

export async function GET(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
    const organisationId = payload.organisationId as string | undefined
    if (!organisationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 })
    }
    const res = await fetch(`${BACKEND}/organisations/${organisationId}/usage`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return NextResponse.json({
        plan: (payload.plan as string) ?? "TRIAL",
        trialEndsAt: (payload.trialEndsAt as string) ?? null,
        chantiersCount: 0,
        usersCount: 1,
        storageGb: 0,
      })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 })
  }
}
