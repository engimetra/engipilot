import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const payload = verifyJwt(token)
  if (!payload) return NextResponse.json({ error: "Session expirée" }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({
      where:   { id: payload.sub },
      include: { role: true, company: { select: { id: true, name: true, slug: true, plan: true } } },
    })

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 })
    }

    return NextResponse.json({
      id:        user.id,
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName,
      avatar:    user.avatar,
      role:      user.role.name,
      company:   user.company,
    })
  } catch (err) {
    console.error("[auth/me]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
