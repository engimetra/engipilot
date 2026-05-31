import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

function statusToDb(s: string) {
  if (s === "EN_COURS")         return "IN_PROGRESS"
  if (s === "CONTROLE_QUALITE") return "REVIEW"
  if (s === "TERMINE")          return "DONE"
  return "TODO"
}

function priorityToDb(p: string) {
  if (p === "CRITIQUE") return "CRITICAL"
  if (p === "HAUTE")    return "HIGH"
  if (p === "BASSE")    return "LOW"
  return "MEDIUM"
}

// PATCH /api/tasks/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const { titre, statut, priorite, responsable, avancement, date_echeance, description } = await req.json()

    const patch: Record<string, unknown> = {}
    if (titre         !== undefined) patch.title       = titre
    if (statut        !== undefined) patch.status      = statusToDb(statut)
    if (priorite      !== undefined) patch.priority    = priorityToDb(priorite)
    if (responsable   !== undefined) patch.assigneeId  = responsable || null
    if (avancement    !== undefined) patch.progress    = avancement
    if (date_echeance !== undefined) patch.endDate     = date_echeance ? new Date(date_echeance).toISOString() : null
    if (description   !== undefined) patch.description = description || null

    const res              = await backendFetch(`/tasks/${id}`, token, { method: "PATCH", body: JSON.stringify(patch) })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy PATCH /tasks/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const res              = await backendFetch(`/tasks/${id}`, token, { method: "DELETE" })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy DELETE /tasks/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
