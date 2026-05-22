import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

// ── PATCH /api/incidents/[id] — changer statut ───────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const body = await req.json()
    const { statut } = body as { statut: "EN_COURS" | "RESOLUE" }

    const existing = await prisma.incident.findFirst({
      where: {
        id:      id,
        isActive: true,
        project: { companyId: payload.companyId },
      },
    })
    if (!existing) return NextResponse.json({ error: "Incident introuvable" }, { status: 404 })

    const prismaStatus = statut === "RESOLUE" ? "RESOLVED" : "OPEN"

    const updated = await prisma.incident.update({
      where: { id: id },
      data: {
        status:   prismaStatus as never,
        closedAt: statut === "RESOLUE" ? new Date() : null,
      },
    })

    return NextResponse.json({
      id:     updated.id,
      statut: statut,
    })
  } catch (err) {
    console.error("[PATCH /api/incidents/[id]]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── DELETE /api/incidents/[id] — soft delete ──────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(payload.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
  }

  try {
    const existing = await prisma.incident.findFirst({
      where: { id: id, isActive: true, project: { companyId: payload.companyId } },
    })
    if (!existing) return NextResponse.json({ error: "Incident introuvable" }, { status: 404 })

    await prisma.incident.update({
      where: { id: id },
      data:  { isActive: false, deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/incidents/[id]]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
