import { prisma } from "@/config/database"

export const AnalyticsService = {

  async getProjectKpis(projectId: string, companyId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId, isActive: true },
      select: {
        spi: true, cpi: true, progress: true, budgetInitial: true, budgetActual: true,
        tasks:     { where: { isActive: true }, select: { status: true } },
        incidents: { where: { isActive: true }, select: { severity: true, lostDays: true, injuredCount: true } },
        budgets:   { where: { isActive: true }, select: { amountPlanned: true, amountActual: true } },
        workers:   false,
      },
    })

    if (!project) throw Object.assign(new Error("Projet introuvable"), { status: 404 })

    const totalBudget = project.budgets.reduce((s, b) => s + Number(b.amountPlanned), 0)
    const spentBudget = project.budgets.reduce((s, b) => s + Number(b.amountActual), 0)
    const eac = project.cpi && Number(project.cpi) > 0 ? totalBudget / Number(project.cpi) : null

    const tasksByStatus = project.tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const criticalIncidents = project.incidents.filter(i => i.severity === "CRITICAL" || i.severity === "HIGH").length

    return {
      evm: {
        spi:      project.spi,
        cpi:      project.cpi,
        progress: project.progress,
        eac,
        vac:      eac ? totalBudget - eac : null,
      },
      budget: {
        planned:   totalBudget,
        actual:    spentBudget,
        remaining: totalBudget - spentBudget,
        usagePct:  totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0,
      },
      tasks:    { total: project.tasks.length, byStatus: tasksByStatus },
      hse:      { incidents: project.incidents.length, critical: criticalIncidents },
    }
  },

  async getGlobalKpis(companyId: string) {
    const [projectStats, incidentStats, taskStats] = await Promise.all([
      prisma.project.aggregate({
        where: { companyId, isActive: true },
        _count: true,
        _avg:   { spi: true, cpi: true, progress: true },
      }),
      prisma.incident.aggregate({
        where: { project: { companyId }, isActive: true },
        _count: true,
        _sum:   { lostDays: true, injuredCount: true },
      }),
      prisma.task.groupBy({
        by:    ["status"],
        where: { project: { companyId }, isActive: true },
        _count: true,
      }),
    ])

    return {
      projects:  { total: projectStats._count, avgSpi: projectStats._avg.spi, avgCpi: projectStats._avg.cpi, avgProgress: projectStats._avg.progress },
      incidents: { total: incidentStats._count, lostDays: incidentStats._sum.lostDays, injured: incidentStats._sum.injuredCount },
      tasks:     taskStats.map(t => ({ status: t.status, count: t._count })),
    }
  },

  async getHistory(projectId: string, companyId: string, period = "MONTHLY") {
    return prisma.analytic.findMany({
      where:   { projectId, project: { companyId }, period },
      orderBy: { date: "asc" },
      take:    12,
    })
  },

  async saveSnapshot(projectId: string, companyId: string) {
    const kpis = await AnalyticsService.getProjectKpis(projectId, companyId)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return prisma.analytic.upsert({
      where:  { projectId_period_date: { projectId, period: "DAILY", date: today } },
      update: { spi: kpis.evm.spi as never, cpi: kpis.evm.cpi as never, progress: kpis.evm.progress as never, incidents: kpis.hse.incidents },
      create: { projectId, period: "DAILY", date: today, spi: kpis.evm.spi as never, cpi: kpis.evm.cpi as never, progress: kpis.evm.progress as never, incidents: kpis.hse.incidents },
    })
  },
}
