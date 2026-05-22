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
    const [projects, alerts, incidentCount, notifCount] = await Promise.all([
      // Projets de la company
      prisma.project.findMany({
        where:   { companyId: payload.companyId, isActive: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id:            true,
          name:          true,
          reference:     true,
          status:        true,
          type:          true,
          progress:      true,
          startDate:     true,
          endDate:       true,
          budgetInitial: true,
          budgetActual:  true,
          spi:           true,
          cpi:           true,
          city:          true,
          country:       true,
          clientName:    true,
          createdAt:     true,
          members: {
            include: { user: { select: { firstName: true, lastName: true } } },
            take: 1,
            orderBy: { joinedAt: "asc" },
          },
        },
      }),
      // Alertes IA non résolues
      prisma.aiAlert.findMany({
        where:   { isResolved: false, project: { companyId: payload.companyId } },
        orderBy: [{ level: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id:         true,
          type:       true,
          level:      true,
          message:    true,
          value:      true,
          confidence: true,
          isRead:     true,
          createdAt:  true,
          project:    { select: { id: true, name: true, city: true, country: true } },
        },
      }),
      // Incidents actifs
      prisma.incident.count({
        where: { project: { companyId: payload.companyId }, status: { in: ["OPEN", "UNDER_INVESTIGATION"] } },
      }),
      // Notifications non lues
      prisma.notification.count({
        where: { userId: payload.sub, isRead: false },
      }),
    ])

    // KPIs agrégés
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === "ACTIVE").length

    const withSpi = projects.filter(p => p.spi !== null)
    const avgSpi = withSpi.length > 0
      ? withSpi.reduce((s, p) => s + Number(p.spi), 0) / withSpi.length
      : null

    const withProgress = projects.filter(p => p.progress !== null)
    const avgProgress = withProgress.length > 0
      ? withProgress.reduce((s, p) => s + Number(p.progress), 0) / withProgress.length
      : 0

    const criticalDelays = projects.filter(p => p.spi !== null && Number(p.spi) < 0.75).length

    const totalBudget  = projects.reduce((s, p) => s + Number(p.budgetInitial), 0)
    const actualBudget = projects.reduce((s, p) => s + Number(p.budgetActual),  0)
    const budgetPct    = totalBudget > 0 ? (actualBudget / totalBudget) * 100 : 0

    // Portfolio breakdown
    const portfolio = {
      onTrack:  projects.filter(p => p.spi === null || Number(p.spi) >= 0.9).length,
      atRisk:   projects.filter(p => p.spi !== null && Number(p.spi) >= 0.75 && Number(p.spi) < 0.9).length,
      critical: projects.filter(p => p.spi !== null && Number(p.spi) < 0.75).length,
      ahead:    projects.filter(p => p.spi !== null && Number(p.spi) > 1.05).length,
      completed:projects.filter(p => p.status === "COMPLETED").length,
    }

    return NextResponse.json({
      projects,
      alerts,
      kpis: {
        totalProjects,
        activeProjects,
        avgProgress:    Math.round(avgProgress),
        avgSpi:         avgSpi !== null ? Number(avgSpi.toFixed(2)) : null,
        criticalDelays,
        incidentCount,
        notifCount,
        totalBudget,
        actualBudget,
        budgetPct:      Math.round(budgetPct),
      },
      portfolio,
    })
  } catch (err) {
    console.error("[GET /api/dashboard]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
