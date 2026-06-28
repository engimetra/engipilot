import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken } from "@/lib/api-client"

export const dynamic = "force-dynamic"

function mapProjet(p: Record<string, unknown>) {
  return {
    id: p.id,
    name: p.nom ?? p.name ?? "",
    reference: p.codeProjet ?? p.reference ?? "",
    status: p.statut ?? p.status ?? "ACTIVE",
    type: p.type ?? "CONSTRUCTION",
    progress: p.avancementPhysique ?? p.avancement ?? p.progress ?? 0,
    startDate: p.dateDebut ?? p.startDate ?? null,
    endDate: p.dateFinPrevue ?? p.endDate ?? null,
    budgetInitial: p.budgetPrevisionnel ?? p.budgetInitial ?? 0,
    budgetActual: p.coutReel ?? p.budgetActual ?? 0,
    spi: p.spi ?? null,
    cpi: p.cpi ?? null,
    city: p.ville ?? p.city ?? null,
    clientName: p.client ?? p.clientName ?? null,
    createdAt: p.createdAt ?? p.dateCreation ?? null,
    members: Array.isArray(p.members)
      ? p.members
      : p.chefChantier
      ? [{ user: { firstName: String(p.chefChantier).split(" ")[0] ?? "", lastName: String(p.chefChantier).split(" ").slice(1).join(" ") ?? "" } }]
      : [],
  }
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  try {
    const res = await backendFetch("/projets", token)
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      return NextResponse.json({ error: err.message ?? "Erreur backend" }, { status: res.status })
    }

    const raw = await res.json() as unknown

    const rawList: Record<string, unknown>[] = Array.isArray(raw)
      ? raw as Record<string, unknown>[]
      : Array.isArray((raw as { content?: unknown }).content)
      ? (raw as { content: Record<string, unknown>[] }).content
      : (raw as { data?: Record<string, unknown>[] }).data ?? []

    const projects = rawList.map(mapProjet)

    const portfolio = { onTrack: 0, atRisk: 0, critical: 0, ahead: 0, completed: 0 }
    for (const p of projects) {
      const status = String(p.status ?? "")
      const spi    = p.spi !== null && p.spi !== undefined ? Number(p.spi) : null
      if (status === "COMPLETED") { portfolio.completed++; continue }
      if (spi !== null && spi > 1.02)  { portfolio.ahead++;    continue }
      if (spi !== null && spi < 0.80)  { portfolio.critical++; continue }
      if (spi !== null && spi < 0.90)  { portfolio.atRisk++;   continue }
      portfolio.onTrack++
    }

    const active = projects.filter(p => p.status !== "COMPLETED" && p.status !== "CANCELLED")
    const totalBudget  = projects.reduce((s, p) => s + (p.budgetInitial  != null ? Number(p.budgetInitial)  : 0), 0)
    const actualBudget = projects.reduce((s, p) => s + (p.budgetActual   != null ? Number(p.budgetActual)   : 0), 0)

    const [incidentRes, notifRes] = await Promise.allSettled([
      backendFetch("/incidents", token),
      backendFetch("/notifications", token),
    ])

    let incidentCount = 0
    let notifCount = 0

    if (incidentRes.status === "fulfilled" && incidentRes.value.ok) {
      const r = await incidentRes.value.json().catch(() => null)
      const list: unknown[] = Array.isArray(r) ? r : Array.isArray(r?.content) ? r.content : []
      incidentCount = list.filter((i: unknown) => (i as { statut?: string; status?: string }).statut !== "RESOLU" && (i as { statut?: string; status?: string }).status !== "RESOLVED").length
    }

    if (notifRes.status === "fulfilled" && notifRes.value.ok) {
      const r = await notifRes.value.json().catch(() => null)
      const list: unknown[] = Array.isArray(r) ? r : Array.isArray(r?.content) ? r.content : []
      notifCount = list.filter((n: unknown) => !(n as { lu?: boolean; isRead?: boolean }).lu && !(n as { lu?: boolean; isRead?: boolean }).isRead).length
    }

    const kpis = {
      totalProjects:  projects.length,
      activeProjects: active.length,
      avgProgress:    Math.round(projects.reduce((s, p) => s + (p.progress != null ? Number(p.progress) : 0), 0) / (projects.length || 1)),
      avgSpi:         projects.length ? projects.reduce((s, p) => s + (p.spi != null ? Number(p.spi) : 1), 0) / projects.length : null,
      criticalDelays: projects.filter(p => p.spi != null && Number(p.spi) < 0.80).length,
      incidentCount,
      notifCount,
      totalBudget,
      actualBudget,
      budgetPct:      totalBudget > 0 ? Math.round((actualBudget / totalBudget) * 100) : 0,
    }

    return NextResponse.json({ projects, alerts: [], kpis, portfolio })
  } catch (err) {
    console.error("[proxy GET /dashboard]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
