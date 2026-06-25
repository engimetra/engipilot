import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"
export const dynamic = "force-dynamic"

type IncidentRaw = Record<string, unknown>

function toUI(i: IncidentRaw) { return i }

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const path = projectId ? `/projets/${projectId}/hse/incidents` : "/hse/incidents"
    const res  = await backendFetch(path, token)
    const json = await res.json() as { success?: boolean; data?: IncidentRaw[]; content?: IncidentRaw[] }
    if (!res.ok) return NextResponse.json({ error: (json as { message?: string }).message ?? "Erreur backend" }, { status: res.status })
    const raw = json.data ?? json.content ?? json
    const items = Array.isArray(raw) ? raw : []
    return NextResponse.json(items.map(toUI))
  } catch (err) {
    console.error("[proxy GET /incidents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const data = await req.json() as { projectId?: string; projetId?: string }
    const pid = data.projectId ?? data.projetId
    const path = pid ? `/projets/${pid}/hse/incidents` : "/hse/incidents"
    const res = await backendFetch(path, token, { method: "POST", body: JSON.stringify(data) })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
