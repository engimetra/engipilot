import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken } from "@/lib/api-client"

export const dynamic = "force-dynamic"

const UI_TYPE_TO_PRISMA: Record<string, string> = {
  PRESQU_ACCIDENT:      "NEAR_MISS",
  ACCIDENT_SANS_ARRET:  "ACCIDENT",
  ACCIDENT_ARRET:       "ACCIDENT",
  MALADIE_PRO:          "ENVIRONMENTAL",
  OBSERVATION:          "OBSERVATION",
  PROPERTY_DAMAGE:      "PROPERTY_DAMAGE",
}

const PRISMA_TYPE_TO_UI: Record<string, string> = {
  NEAR_MISS:       "PRESQU_ACCIDENT",
  ACCIDENT:        "ACCIDENT_ARRET",
  NON_CONFORMITY:  "PRESQU_ACCIDENT",
  OBSERVATION:     "PRESQU_ACCIDENT",
  ENVIRONMENTAL:   "MALADIE_PRO",
  PROPERTY_DAMAGE: "ACCIDENT_SANS_ARRET",
}

const UI_GRAVITE_TO_SEVERITY: Record<string, string> = {
  MINEUR: "LOW", MAJEUR: "HIGH", CRITIQUE: "CRITICAL", HAUT: "HIGH",
}

const SEVERITY_TO_UI: Record<string, string> = {
  NEGLIGIBLE: "MINEUR", LOW: "MINEUR", MEDIUM: "MAJEUR", HIGH: "MAJEUR", CRITICAL: "CRITIQUE",
}

const TYPE_LABELS: Record<string, string> = {
  PRESQU_ACCIDENT:     "Presqu'accident",
  ACCIDENT_SANS_ARRET: "Accident sans arrêt",
  ACCIDENT_ARRET:      "Accident avec arrêt",
  MALADIE_PRO:         "Maladie professionnelle",
}

function toUI(inc: Record<string, unknown>) {
  return {
    id:               inc.id,
    type:             PRISMA_TYPE_TO_UI[inc.type as string] ?? inc.type,
    description:      inc.description,
    dateIncident:     inc.date,
    lieu:             inc.location,
    gravite:          SEVERITY_TO_UI[inc.severity as string] ?? "MINEUR",
    statut:           ["RESOLVED","CLOSED"].includes(inc.status as string) ? "RESOLUE" : "EN_COURS",
    nombreJoursArret: inc.lostDays,
    nombreBlesses:    inc.injuredCount,
    mesuresPrises:    null,
    projetId:         inc.projectId,
    createdAt:        inc.createdAt,
  }
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get("projectId")

  try {
    const qs  = new URLSearchParams()
    if (projectId) qs.set("projectId", projectId)

    const res  = await backendFetch("/hse", token, { searchParams: qs })
    const json = await res.json() as { success?: boolean; data?: Record<string, unknown>[] }

    if (!res.ok) return NextResponse.json({ error: (json as { message?: string }).message ?? "Erreur backend" }, { status: res.status })

    const items = (json.data ?? json) as Record<string, unknown>[]
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
    const d = await req.json()
    const body = JSON.stringify({
      title:             TYPE_LABELS[d.type] ?? d.type,
      description:       d.description,
      type:              UI_TYPE_TO_PRISMA[d.type] ?? "ACCIDENT",
      severity:          UI_GRAVITE_TO_SEVERITY[d.gravite] ?? "LOW",
      projectId:         d.projectId,
      date:              new Date(d.dateIncident).toISOString(),
      location:          d.lieu ?? null,
      lostDays:          d.nombreJoursArret ?? 0,
      injuredCount:      d.nombreBlesses ?? 0,
      correctiveActions: d.mesuresPrises ?? null,
    })

    const res  = await backendFetch("/hse", token, { method: "POST", body })
    const json = await res.json() as { success?: boolean; data?: Record<string, unknown>; message?: string }

    if (!res.ok) return NextResponse.json({ error: (json as { message?: string }).message ?? "Erreur backend" }, { status: res.status })

    return NextResponse.json(toUI((json.data ?? json) as Record<string, unknown>), { status: 201 })
  } catch (err) {
    console.error("[proxy POST /incidents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
