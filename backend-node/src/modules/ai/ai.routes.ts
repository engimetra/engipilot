import { Router } from "express"
import { Response, NextFunction } from "express"
import { AuthRequest } from "@/shared/types"
import { sendSuccess, sendCreated } from "@/shared/utils/response"
import { authenticate } from "@/middlewares/auth.middleware"
import { validate } from "@/middlewares/validate.middleware"
import { AiService } from "./ai.service"
import { SendMessageDto, CreateAlertDto, SendMessageInput, CreateAlertInput } from "./ai.dto"

const router = Router()
router.use(authenticate)

// ── Conversations ────────────────────────────────────────────
router.get("/conversations", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await AiService.getConversations(req.user!.sub)) } catch (err) { next(err) }
})

router.get("/conversations/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await AiService.getConversation(req.params.id, req.user!.sub)) } catch (err) { next(err) }
})

router.delete("/conversations/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await AiService.deleteConversation(req.params.id, req.user!.sub)
    sendSuccess(res, null, "Conversation supprimée")
  } catch (err) { next(err) }
})

// ── Chat ─────────────────────────────────────────────────────
router.post("/chat", validate(SendMessageDto), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await AiService.sendMessage(req.user!.sub, req.body as SendMessageInput)
    sendCreated(res, result)
  } catch (err) { next(err) }
})

// ── Alertes IA ───────────────────────────────────────────────
router.get("/alerts", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, await AiService.getAlerts(req.user!.companyId, req.query.projectId as string))
  } catch (err) { next(err) }
})

router.post("/alerts", validate(CreateAlertDto), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendCreated(res, await AiService.createAlert(req.body as CreateAlertInput)) } catch (err) { next(err) }
})

router.patch("/alerts/:id/read", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await AiService.markAlertRead(req.params.id, req.user!.companyId)) } catch (err) { next(err) }
})

router.patch("/alerts/:id/resolve", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await AiService.resolveAlert(req.params.id, req.user!.companyId)) } catch (err) { next(err) }
})

export { router as aiRouter }
