import { Router, Response, NextFunction } from "express"
import { ProjectsController }  from "./projects.controller"
import { authenticate }        from "@/middlewares/auth.middleware"
import { requirePermission }   from "@/middlewares/rbac.middleware"
import { validate }            from "@/middlewares/validate.middleware"
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from "./projects.dto"
import { AuthRequest }         from "@/shared/types"
import { sendSuccess, sendNotFound } from "@/shared/utils/response"
import { prisma }              from "../../config/database"

const router = Router()
router.use(authenticate)

// ── CRUD de base ──────────────────────────────────────────────
router.get(   "/",          validate(ProjectFilterDto, "query"), requirePermission("view",   "projects"), ProjectsController.findAll)
router.get(   "/:id/stats", requirePermission("view",   "projects"), ProjectsController.getStats)
router.post(  "/",          validate(CreateProjectDto), requirePermission("create", "projects"), ProjectsController.create)
router.patch( "/:id",       validate(UpdateProjectDto), requirePermission("update", "projects"), ProjectsController.update)
router.delete("/:id",       requirePermission("delete", "projects"), ProjectsController.delete)

// ── Gantt ─────────────────────────────────────────────────────
router.get("/:id/gantt", requirePermission("view", "projects"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where:  { id: req.params.id, companyId: req.user!.companyId, isActive: true, deletedAt: null },
      select: { id: true, name: true, startDate: true, endDate: true, progress: true, spi: true },
    })
    if (!project) return sendNotFound(res, "Projet")

    const tasks = await prisma.task.findMany({
      where:   { projectId: req.params.id, isActive: true, deletedAt: null },
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, title: true, status: true, progress: true,
        startDate: true, endDate: true,
        assignee: { select: { firstName: true, lastName: true } },
      },
    })

    const projStart = project.startDate.getTime()
    const projEnd   = project.endDate.getTime()
    const totalMs   = Math.max(projEnd - projStart, 1)
    const today     = Date.now()
    const todayPct  = Math.max(0, Math.min(100, Math.round(((today - projStart) / totalMs) * 100)))

    const ganttStatus = (status: string, endDate: Date | null) => {
      if (status === "DONE") return "TERMINE"
      if (endDate && endDate.getTime() < today) return "RETARD"
      if (status === "IN_PROGRESS" || status === "REVIEW") return "EN_COURS"
      return "PLANIFIE"
    }
    const ganttColor = (s: string) =>
      s === "TERMINE" ? "#00C875" : s === "RETARD" ? "#E2445C" : s === "EN_COURS" ? "#635BFF" : "#8b5cf6"

    const lots = tasks.map(t => {
      const tStart   = t.startDate?.getTime() ?? projStart
      const tEnd     = t.endDate?.getTime()   ?? projEnd
      const startPct = Math.max(0, Math.min(97, Math.round(((tStart - projStart) / totalMs) * 100)))
      const widthPct = Math.max(2, Math.min(100 - startPct, Math.round(((tEnd - tStart) / totalMs) * 100)))
      const gStatus  = ganttStatus(t.status, t.endDate)
      const retard   = gStatus === "RETARD" && t.endDate
        ? Math.floor((today - t.endDate.getTime()) / 86_400_000) : 0

      return {
        id: t.id, nom: t.title,
        emoji: "📋",
        statut: gStatus, startPct, widthPct,
        avancement: Math.round(Number(t.progress)),
        color: ganttColor(gStatus), retard,
        responsable: t.assignee
          ? `${t.assignee.firstName[0]}${t.assignee.lastName[0]}`.toUpperCase() : "—",
      }
    })

    const jalons = tasks
      .filter(t => t.status === "DONE" || t.endDate != null)
      .sort((a, b) => (a.endDate?.getTime() ?? 0) - (b.endDate?.getTime() ?? 0))
      .slice(0, 8)
      .map(t => ({ label: t.title, date: t.endDate ? t.endDate.toLocaleDateString("fr-FR") : "—", done: t.status === "DONE" }))

    const spi      = project.spi ? Number(project.spi) : 1
    const remaining = Math.max(0, projEnd - today)
    const predictedEnd = new Date(Math.max(spi > 0.01 ? today + remaining / spi : projEnd, projEnd))

    sendSuccess(res, {
      project: {
        id: project.id, name: project.name,
        startDate: project.startDate.toISOString(), endDate: project.endDate.toISOString(),
        progress: Math.round(Number(project.progress)), spi,
      },
      lots, jalons, todayPct,
      kpis: {
        dureeMois:        Math.ceil(totalMs / (30 * 86_400_000)),
        totalLots:        tasks.length,
        lotsEnRetard:     lots.filter(l => l.statut === "RETARD").length,
        jalonsAtteints:   tasks.filter(t => t.status === "DONE").length,
        totalJalons:      jalons.length,
        retardCumule:     lots.reduce((m, l) => Math.max(m, l.retard), 0),
        achevementPredit: predictedEnd.toLocaleDateString("fr-FR"),
      },
    })
  } catch (err) { next(err) }
})

// ── KPI EVM ───────────────────────────────────────────────────
router.get("/:id/kpis/evm", requirePermission("view", "projects"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where:  { id: req.params.id, companyId: req.user!.companyId, isActive: true, deletedAt: null },
      select: { id: true, name: true, reference: true, budgetInitial: true, budgetActual: true, progress: true, spi: true, startDate: true, endDate: true },
    })
    if (!project) return sendNotFound(res, "Projet")

    const bac = Number(project.budgetInitial)
    const ac  = Number(project.budgetActual)
    const pct = Number(project.progress) / 100
    const ev  = bac * pct

    let pv: number
    if (project.spi !== null && Number(project.spi) > 0) {
      pv = ev / Number(project.spi)
    } else {
      const start   = project.startDate.getTime()
      const end     = project.endDate.getTime()
      const elapsed = Math.max(0, Math.min(1, (Date.now() - start) / Math.max(end - start, 1)))
      pv = bac * elapsed
    }

    const cpi  = ac > 0 ? ev / ac  : null
    const spi  = pv > 0 ? ev / pv  : null
    const cv   = ev - ac
    const sv   = ev - pv
    const eac  = cpi && cpi > 0 ? bac / cpi : bac
    const vac  = bac - eac
    const tcpi = (bac - ac) > 0 ? (bac - ev) / (bac - ac) : null

    sendSuccess(res, {
      projectId: project.id, projectName: project.name, reference: project.reference,
      bac, pv: Math.round(pv), ev: Math.round(ev), ac: Math.round(ac),
      cv: Math.round(cv), sv: Math.round(sv),
      spi:  spi  !== null ? Number(spi.toFixed(3))  : null,
      cpi:  cpi  !== null ? Number(cpi.toFixed(3))  : null,
      eac:  Math.round(eac), vac: Math.round(vac),
      tcpi: tcpi !== null ? Number(tcpi.toFixed(3)) : null,
      progress: Number(project.progress),
    })
  } catch (err) { next(err) }
})

// ── KPI HSE ───────────────────────────────────────────────────
router.get("/:id/kpis/hse", requirePermission("view", "projects"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where:  { id: req.params.id, companyId: req.user!.companyId, isActive: true },
      select: { id: true, startDate: true, members: { select: { id: true } } },
    })
    if (!project) return sendNotFound(res, "Projet")

    const incidents = await prisma.incident.findMany({
      where:  { projectId: req.params.id, isActive: true },
      select: { type: true, status: true, lostDays: true, date: true },
    })

    const accidents       = incidents.filter(i => i.type === "ACCIDENT")
    const presquAccidents = incidents.filter(i => i.type === "NEAR_MISS")
    const enCours         = incidents.filter(i => !["RESOLVED","CLOSED"].includes(i.status)).length
    const totalLostDays   = incidents.reduce((s, i) => s + (i.lostDays ?? 0), 0)

    const joursEcoules  = Math.max(1, Math.floor((Date.now() - project.startDate.getTime()) / 86_400_000))
    const heuresEst     = joursEcoules * 8 * Math.max(1, project.members.length)

    const tf = accidents.length > 0 ? Math.round((accidents.length * 1_000_000) / heuresEst * 10) / 10 : 0
    const tg = totalLostDays > 0    ? Math.round((totalLostDays  * 1_000)      / heuresEst * 100) / 100 : 0

    const lastAccident        = accidents.map(a => a.date.getTime()).sort((a, b) => b - a)[0]
    const heuresSansAccident  = lastAccident ? Math.floor((Date.now() - lastAccident) / 3_600_000) : heuresEst

    sendSuccess(res, { tf, tg, accidents: accidents.length, presquAccidents: presquAccidents.length, enCours, heuresSansAccident })
  } catch (err) { next(err) }
})

// ── Members ───────────────────────────────────────────────────
router.get("/:id/members", requirePermission("view", "projects"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId, isActive: true },
    })
    if (!project) return sendNotFound(res, "Projet")

    const members = await prisma.projectMember.findMany({
      where:   { projectId: req.params.id },
      select: { role: true, user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { joinedAt: "asc" },
    })

    const COLORS = ["#635BFF","#FDAB3D","#E2445C","#00C875","#8b5cf6","#0ea5e9","#f97316"]
    sendSuccess(res, members.map((m, i) => ({
      id:       m.user.id,
      name:     `${m.user.firstName} ${m.user.lastName}`,
      initials: `${m.user.firstName[0]}${m.user.lastName[0]}`.toUpperCase(),
      color:    COLORS[i % COLORS.length],
      role:     m.role,
      avatar:   m.user.avatar,
    })))
  } catch (err) { next(err) }
})

// ── MS Project import ─────────────────────────────────────────
router.post("/:id/import/ms-project", requirePermission("create", "tasks"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId, isActive: true },
    })
    if (!project) return sendNotFound(res, "Projet")

    // Proxy raw multipart to Spring Boot for MPXJ parsing
    const SPRING_URL = process.env.SPRING_BOOT_URL ?? "http://localhost:8080"
    const incoming   = req as unknown as { body: Buffer; headers: Record<string, string> }

    // Re-stream the multipart body to Spring
    const springRes = await fetch(`${SPRING_URL}/api/v1/ms-project/parse`, {
      method:  "POST",
      headers: { "content-type": incoming.headers["content-type"] ?? "multipart/form-data" },
      body:    incoming.body,
    })

    if (!springRes.ok) {
      const err = await springRes.json().catch(() => ({ message: "Erreur Spring Boot" })) as { message?: string }
      res.status(springRes.status).json({ success: false, message: err.message ?? "Erreur Spring Boot" })
      return
    }

    const parsed = await springRes.json() as { projectName: string; tasks: { title: string; progress: number; startDate?: string; endDate?: string; notes?: string }[]; count: number }

    let importees = 0
    const erreurs: string[] = []
    for (const t of parsed.tasks) {
      try {
        await prisma.task.create({
          data: {
            title:       t.title,
            description: t.notes ?? null,
            progress:    t.progress,
            status:      "TODO",
            priority:    "MEDIUM",
            startDate:   t.startDate ? new Date(t.startDate) : null,
            endDate:     t.endDate   ? new Date(t.endDate)   : null,
            projectId:   req.params.id,
          },
        })
        importees++
      } catch (e) {
        erreurs.push(`"${t.title}": ${(e as Error).message}`)
      }
    }

    sendSuccess(res, { message: `${importees} tâche(s) importée(s)`, importees, erreurs, projectName: parsed.projectName })
  } catch (err) { next(err) }
})

// ── GET /:id (last, avoids shadowing sub-routes) ──────────────
router.get("/:id", requirePermission("view", "projects"), ProjectsController.findById)

export { router as projectsRouter }
