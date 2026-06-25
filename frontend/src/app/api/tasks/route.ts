import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"
export const dynamic = "force-dynamic"

interface BackendTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  progress?: number | string
  endDate?: string
  createdAt?: string
  assignee?: { id: string; firstName: string; lastName: string }
}

const MEMBER_COLORS = ["#635BFF","#E2445C","#FDAB3D","#00C875","#8b5cf6","#0ea5e9","#f97316"]

function statusToFrontend(s: string): string {
  const map: Record<string, string> = { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminé", REVIEW: "En révision" }
  return map[s] ?? s
}

function priorityToFrontend(p: string): string {
  const map: Record<string, string> = { LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute", CRITICAL: "Critique" }
  return map[p] ?? p
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId") ?? ""
    const path = projectId ? `/projets/${projectId}/taches` : "/taches"
    const res = await backendFetch(path, token)
    const json = await res.json() as { success?: boolean; data?: BackendTask[]; message?: string }
    if (!res.ok) return NextResponse.json({ error: (json as { message?: string }).message ?? "Erreur backend" }, { status: res.status })
    const raw = (json.data ?? json) as BackendTask[] | { content?: BackendTask[] }
    const tasks: BackendTask[] = Array.isArray(raw) ? raw : (raw as { content?: BackendTask[] }).content ?? []
    const membersMap: Record<string, { name: string; initials: string; color: string }> = {}
    let colorIdx = 0
    for (const t of tasks) {
      if (t.assignee && !membersMap[t.assignee.id]) {
        membersMap[t.assignee.id] = {
          name: `${t.assignee.firstName} ${t.assignee.lastName}`,
          initials: `${t.assignee.firstName[0]}${t.assignee.lastName[0]}`.toUpperCase(),
          color: MEMBER_COLORS[colorIdx++ % MEMBER_COLORS.length],
        }
      }
    }
    const mapped = tasks.map(t => ({
      id: t.id, titre: t.title, description: t.description ?? undefined,
      statut: statusToFrontend(t.status), priorite: priorityToFrontend(t.priority),
      tags: [], avancement: Math.round(Number(t.progress ?? 0)),
      date_echeance: t.endDate ? new Date(t.endDate).toISOString().split("T")[0] : undefined,
      responsable: t.assignee?.id ?? null, projet_id: projectId, created_at: t.createdAt,
    }))
    return NextResponse.json({ tasks: mapped, members: membersMap })
  } catch (err) {
    console.error("[proxy GET /tasks]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const body = JSON.stringify(await req.json())
    const data = JSON.parse(body) as { projectId?: string; projetId?: string }
    const pid = data.projectId ?? data.projetId
    const path = pid ? `/projets/${pid}/taches` : "/taches"
    const res = await backendFetch(path, token, { method: "POST", body })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
