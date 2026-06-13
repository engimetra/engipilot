import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken } from "@/lib/api-client"

export const dynamic = "force-dynamic"

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
    const projects: unknown[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { content?: unknown[] }).content)
        ? (raw as { content: unknown[] }).content
        : (raw as { data?: unknown[] }).data ?? []

    const ps = projects as Array<Record<string, unknown>>
    const portfolio = { onTrack: 0, atRisk: 0, critical: 0, ahead: 0, completed: 0 }
    for (const p of ps) {
      const status = String(p.status ?? "")
      const spi = p.spi !== null && p.spi !== undefined ? Number(p.spi) : null
      if (status === "COMPLETED") { portfolio.completed++; continue }
      if (spi !== null && spi > 1.02) { portfolio.ahead++; continue }
      if (spi !== null && spi < 0.80) { portfolio.critical++; continue }
      if (spi !== null && spi < 0.90) { portfolio.atRisk++; continue }
      portfolio.onTrack++
    }

    const active = ps.filter(p => p.status !== "COMPLETED" && p.status !== "CANCELLED")
    const totalBudget = ps.reduce((s, p) => s + (p.budgetInitial != null ? Number(p.budgetInitial) : 0), 0)
    const actualBudget = ps.reduce((s, p) => s + (p.budgetActuel != null ? Number(p.budgetActuel) : 0), 0)
    const kpis = {
      totalProjects: ps.length,
      activeProjects: active.length,
      avgProgress: Math.round(ps.reduce((s, p) => s + (p.avancement != null ? Number(p.avancement) : 0), 0) / (ps.length || 1)),
      avgSpi: ps.length ? ps.reduce((s, p) => s + (p.spi != null ? Number(p.spi) : 1), 0) / ps.length : null,
      criticalDelays: ps.filter(p => p.spi != null && Number(p.spi) < 0.80).length,
      incidentCount: 0,
      notifCount: 0,
      totalBudget,
      actualBudget,
      budgetPct: totalBudget > 0 ? Math.round((actualBudget / totalBudget) * 100) : 0,
    }

    return NextResponse.json({ projects, alerts: [], kpis, portfolio })
  } catch (err) {
    console.error("[proxy GET /dashboard]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
