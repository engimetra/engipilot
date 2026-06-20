import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken } from "@/lib/api-client"

export const dynamic = "force-dynamic"

const MEMBER_COLORS = ["#635BFF", "#FDAB3D", "#E2445C", "#00C875", "#8b5cf6"]

function statusToFrontend(s: string) {
  if (s === "IN_PROGRESS") return "EN_COURS"
  if (s === "IN_REVIEW" || s === "REVIEW") return "CONTROLE_QUALITE"
  if (s === "DONE") return "TERMINE"
  return "A_FAIRE"
}

function priorityToFrontend(p: string) {
  if (p === "URGENT" || p === "CRITICAL") return "CRITIQUE"
  if (p === "HIGH") return "HAUTE"
  if (p === "LOW") return "BASSE"
  return "NORMALE"
}

function priorityToDb(p: string) {
  if (p === "CRITIQUE") return "CRITICAL"
  if (p === "HAUTE") return "HIGH"
  if (p === "BASSE") return "LOW"
  return "MEDIUM"
}

// GET /api/tasks?projectId=xxx
export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "projectId requis" }, { status: 400 })

  try {
    const qs = new URLSearchParams({ projectId })
    const res = await backendFetch("/tasks", token, { searchParams: qs })
    const json = await res.json() as { success?: boolean; data?: BackendTask[]; message?: string }

    if (!res.ok) return NextResponse.json({ error: (json as { message?: string }).message ?? "Erreur backend" }, { status: res.status })

    const raw = (json.data ?? json) as BackendTask[] | { content?: BackendTask[] }
    const tasks: BackendTask[] = Array.isArray(raw) ? raw : (raw as { content?: BackendTask[] }).content ?? []

    const membersMap: Record<string, { name: string; initials: string; color: string }> = {}
    let colorIdx = 0
    for (const t of tasks) {
      if (t.assignee && !membersMap[t.assignee.id]) {
        membersMap[t.assignee.id] = {
          name:     `${t.assignee.firstName} ${t.assignee.lastName}`,
          initials: `${t.assignee.firstName[0]}${t.assignee.lastName[0]}`.toUpperCase(),
          color:    MEMBER_COLORS[colorIdx++ % MEMBER_COLORS.length],
        }
      }
    }

    const mapped = tasks.map(t => ({
      id:            t.id,
      titre:         t.title,
      description:   t.description ?? undefined,
      statut:        statusToFrontend(t.status),
      priorite:      priorityToFrontend(t.priority),
      tags:          [],
      avancement:    Math.round(Number(t.progress ?? 0)),
      date_echeance: t.endDate ? new Date(t.endDate).toISOString().split("T")[0] : undefined,
      responsable:   t.assignee?.id ?? null,
      projet_id:     projectId,
      created_at:    t.createdAt,
    }))

    return NextResponse.json({ tasks: mapped, members: membersMap })
  } catch (err) {
    console.error("[proxy GET /tasks]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const { projectId, titre, priorite, responsable, date_echeance, description } = await req.json()
    if (!projectId || !titre?.trim()) return NextResponse.json({ error: "projectId et titre requis" }, { status: 400 })

    const body = JSON.stringify({
      title:       titre.trim(),
      description: description || undefined,
      projectId,
      assigneeId:  responsable || undefined,
      priority:    priorityToDb(priorite ?? "NORMALE"),
      endDate:     date_echeance ? new Date(date_echeance).toISOString() : undefined,
    })

    const res  = await backendFetch("/tasks", token, { method: "POST", body })
    const json = await res.json() as { success?: boolean; data?: BackendTask; message?: string }

    if (!res.ok) return NextResponse.json({ error: (json as { message?: string }).message ?? "Erreur backend" }, { status: res.status })

    const t = (json.data ?? json) as BackendTask
    return NextResponse.json({
      id:            t.id,
      titre:         t.title,
      description:   t.description ?? undefined,
      statut:        "A_FAIRE",
      priorite:      priorityToFrontend(t.priority),
      tags:          [],
      avancement:    0,
      date_echeance: t.endDate ? new Date(t.endDate).toISOString().split("T")[0] : undefined,
      responsable:   t.assigneeId ?? null,
      projet_id:     projectId,
      created_at:    t.createdAt,
    }, { status: 201 })
  } catch (err) {
    console.error("[proxy POST /tasks]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

interface BackendTask {
  id: string; title: string; description?: string | null
  status: string; priority: string; progress?: number | string
  endDate?: string | null; createdAt: string
  assigneeId?: string | null
  assignee?: { id: string; firstName: string; lastName: string } | null
}
