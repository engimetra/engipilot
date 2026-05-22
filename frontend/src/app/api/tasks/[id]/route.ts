import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

function statusToDb(status: string): string {
  switch (status) {
    case "EN_COURS":         return "IN_PROGRESS"
    case "CONTROLE_QUALITE": return "IN_REVIEW"
    case "TERMINE":          return "DONE"
    default:                 return "TODO"
  }
}

function priorityToDb(priority: string): string {
  switch (priority) {
    case "CRITIQUE": return "URGENT"
    case "HAUTE":    return "HIGH"
    case "BASSE":    return "LOW"
    default:         return "MEDIUM"
  }
}

// PATCH /api/tasks/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.task.findFirst({
      where: { id, isActive: true, project: { companyId: payload.companyId } },
    })
    if (!existing) return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 })

    const body = await req.json()
    const { titre, statut, priorite, responsable, avancement, date_echeance, description, tags } = body

    await prisma.task.update({
      where: { id },
      data: {
        ...(titre         !== undefined && { title:       titre }),
        ...(statut        !== undefined && { status:      statusToDb(statut) as any }),
        ...(priorite      !== undefined && { priority:    priorityToDb(priorite) as any }),
        ...(responsable   !== undefined && { assigneeId:  responsable || null }),
        ...(avancement    !== undefined && { progress:    avancement }),
        ...(date_echeance !== undefined && { endDate:     date_echeance ? new Date(date_echeance) : null }),
        ...(description   !== undefined && { description: description || null }),
        ...(tags          !== undefined && { tags }),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[PATCH /api/tasks/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] — soft delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.task.findFirst({
      where: { id, isActive: true, project: { companyId: payload.companyId } },
    })
    if (!existing) return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 })

    await prisma.task.update({
      where: { id },
      data:  { isActive: false, deletedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/tasks/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
