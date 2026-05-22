import { Router } from "express"
import { Response, NextFunction } from "express"
import { AuthRequest } from "@/shared/types"
import { sendSuccess, sendCreated } from "@/shared/utils/response"
import { authenticate } from "@/middlewares/auth.middleware"
import { validate } from "@/middlewares/validate.middleware"
import { HseService } from "./hse.service"
import { CreateIncidentDto, UpdateIncidentDto, CreateIncidentInput, UpdateIncidentInput } from "./hse.dto"

const router = Router()
router.use(authenticate)

router.get("/stats", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await HseService.getHseStats(req.user!.companyId, req.query.projectId as string)
    sendSuccess(res, stats)
  } catch (err) { next(err) }
})

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await HseService.findAll(req.user!.companyId, req.query as Record<string, string>)
    sendSuccess(res, result.data, "Incidents récupérés", 200, result.meta)
  } catch (err) { next(err) }
})

router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await HseService.findById(req.params.id, req.user!.companyId))
  } catch (err) { next(err) }
})

router.post("/", validate(CreateIncidentDto), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    sendCreated(res, await HseService.create(req.user!.sub, req.body as CreateIncidentInput), "Incident déclaré")
  } catch (err) { next(err) }
})

router.patch("/:id", validate(UpdateIncidentDto), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await HseService.update(req.params.id, req.user!.companyId, req.user!.sub, req.body as UpdateIncidentInput))
  } catch (err) { next(err) }
})

export { router as hseRouter }
