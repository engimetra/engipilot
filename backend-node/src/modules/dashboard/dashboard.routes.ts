import { Router, Response, NextFunction } from "express"
import { AuthRequest }   from "@/shared/types"
import { sendSuccess }   from "@/shared/utils/response"
import { authenticate }  from "@/middlewares/auth.middleware"
import { prisma }        from "../../config/database"

const router = Router()
router.use(authenticate)

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId
    const userId    = req.user!.sub

    const [projects, alerts, incidentCount, notifCount] = await Promise.all([
      prisma.project.findMany({
        where:   { companyId, isActive: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, reference: true, status: true, type: true,
          progress: true, startDate: true, endDate: true,
          budgetInitial: true, budgetActual: true,
          spi: true, cpi: true, city: true, country: true, clientName: true, createdAt: true,
          members: {
            include: { user: { select: { firstName: true, lastName: true } } },
            take: 1, orderBy: { joinedAt: "asc" },
          },
        },
      }),
      prisma.aiAlert.findMany({
        where:   { isResolved: false, project: { companyId } },
        orderBy: [{ level: "desc" }, { createdAt: "desc" }],
        take:    5,
        select: {
          id: true, type: true, level: true, message: true,
          value: true, confidence: true, isRead: true, createdAt: true,
          project: { select: { id: true, name: true, city: true, country: true } },
        },
      }),
      prisma.incident.count({
        where: { project: { companyId }, status: { in: ["OPEN","UNDER_INVESTIGATION"] } },
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ])

    const totalProjects   = projects.length
    const activeProjects  = projects.filter(p => p.status === "ACTIVE").length
    const withSpi         = projects.filter(p => p.spi !== null)
    const avgSpi          = withSpi.length > 0
      ? withSpi.reduce((s, p) => s + Number(p.spi), 0) / withSpi.length : null
    const avgProgress     = projects.length > 0
      ? projects.reduce((s, p) => s + Number(p.progress), 0) / projects.length : 0
    const criticalDelays  = projects.filter(p => p.spi !== null && Number(p.spi) < 0.75).length
    const totalBudget     = projects.reduce((s, p) => s + Number(p.budgetInitial), 0)
    const actualBudget    = projects.reduce((s, p) => s + Number(p.budgetActual),  0)

    sendSuccess(res, {
      projects,
      alerts,
      kpis: {
        totalProjects, activeProjects,
        avgProgress:   Math.round(avgProgress),
        avgSpi:        avgSpi !== null ? Number(avgSpi.toFixed(2)) : null,
        criticalDelays,
        incidentCount, notifCount, totalBudget, actualBudget,
        budgetPct:     totalBudget > 0 ? Math.round((actualBudget / totalBudget) * 100) : 0,
      },
      portfolio: {
        onTrack:   projects.filter(p => p.spi === null || Number(p.spi) >= 0.9).length,
        atRisk:    projects.filter(p => p.spi !== null && Number(p.spi) >= 0.75 && Number(p.spi) < 0.9).length,
        critical:  projects.filter(p => p.spi !== null && Number(p.spi) < 0.75).length,
        ahead:     projects.filter(p => p.spi !== null && Number(p.spi) > 1.05).length,
        completed: projects.filter(p => p.status === "COMPLETED").length,
      },
    })
  } catch (err) { next(err) }
})

export { router as dashboardRouter }
