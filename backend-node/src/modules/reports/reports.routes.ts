import { Router, Response, NextFunction } from "express"
import { AuthRequest }  from "@/shared/types"
import { sendSuccess, sendCreated, sendNotFound } from "@/shared/utils/response"
import { authenticate } from "@/middlewares/auth.middleware"
import { prisma }       from "../../config/database"
import { z }            from "zod"

const router = Router()
router.use(authenticate)

const CreateReportDto = z.object({
  projectId:   z.string().uuid(),
  title:       z.string().min(2),
  content:     z.string().min(1),
  summary:     z.string().optional(),
  period:      z.string().optional(),
  type:        z.enum(["DAILY_PROGRESS","WEEKLY_SUMMARY","MONTHLY_KPI"]).default("DAILY_PROGRESS"),
  generatedBy: z.enum(["MANUAL","AI"]).default("MANUAL"),
})

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string | undefined

    const reports = await prisma.report.findMany({
      where: {
        project: { companyId: req.user!.companyId },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take:    50,
      select: {
        id: true, title: true, type: true, content: true,
        summary: true, period: true, generatedBy: true, createdAt: true,
        project: { select: { id: true, name: true, reference: true } },
        author:  { select: { firstName: true, lastName: true } },
      },
    })
    sendSuccess(res, reports)
  } catch (err) { next(err) }
})

router.post("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateReportDto.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0]?.message })
      return
    }
    const d = parsed.data

    const project = await prisma.project.findFirst({
      where: { id: d.projectId, companyId: req.user!.companyId, isActive: true },
    })
    if (!project) return sendNotFound(res, "Projet")

    const report = await prisma.report.create({
      data: {
        title:       d.title,
        type:        d.type,
        content:     d.content,
        summary:     d.summary  ?? null,
        period:      d.period   ?? null,
        generatedBy: d.generatedBy,
        projectId:   d.projectId,
        authorId:    req.user!.sub,
      },
      include: {
        project: { select: { id: true, name: true, reference: true } },
        author:  { select: { firstName: true, lastName: true } },
      },
    })

    // Auto-create HSE incident when report flags a security event
    try {
      const content = JSON.parse(d.content) as Record<string, unknown>
      if (content.incidentsSecurite === true) {
        await prisma.incident.create({
          data: {
            title:       "Incident signalé via rapport journalier",
            description: d.summary ?? "Incident sécurité déclaré dans le rapport journalier",
            type:        "ACCIDENT",
            severity:    "MEDIUM",
            status:      "OPEN",
            date:        new Date(d.period ?? new Date().toISOString().slice(0, 10)),
            reportedBy:  req.user!.sub,
            projectId:   d.projectId,
          },
        })
        await prisma.notification.create({
          data: {
            title:     `Incident HSE — ${project.name}`,
            message:   `Incident sécurité signalé dans le rapport ${d.title}`,
            type:      "ERROR",
            userId:    req.user!.sub,
            projectId: d.projectId,
          },
        })
      }
    } catch { /* ne pas bloquer la réponse si la création d'incident échoue */ }

    sendCreated(res, report, "Rapport créé")
  } catch (err) { next(err) }
})

export { router as reportsRouter }
