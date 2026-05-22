import { Router } from "express"
import { Response, NextFunction } from "express"
import { AuthRequest } from "@/shared/types"
import { sendSuccess } from "@/shared/utils/response"
import { authenticate } from "@/middlewares/auth.middleware"
import { AnalyticsService } from "./analytics.service"

const router = Router()
router.use(authenticate)

router.get("/global", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await AnalyticsService.getGlobalKpis(req.user!.companyId)) } catch (err) { next(err) }
})

router.get("/projects/:id/kpis", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await AnalyticsService.getProjectKpis(req.params.id, req.user!.companyId)) } catch (err) { next(err) }
})

router.get("/projects/:id/history", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await AnalyticsService.getHistory(req.params.id, req.user!.companyId, req.query.period as string)
    sendSuccess(res, data)
  } catch (err) { next(err) }
})

router.post("/projects/:id/snapshot", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await AnalyticsService.saveSnapshot(req.params.id, req.user!.companyId), "Snapshot enregistré") } catch (err) { next(err) }
})

export { router as analyticsRouter }
