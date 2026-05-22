import { Router } from "express"
import { Response, NextFunction } from "express"
import { AuthRequest } from "@/shared/types"
import { sendSuccess, sendCreated } from "@/shared/utils/response"
import { authenticate } from "@/middlewares/auth.middleware"
import { validate } from "@/middlewares/validate.middleware"
import { TasksService } from "./tasks.service"
import { CreateTaskDto, UpdateTaskDto, CreateTaskInput, UpdateTaskInput } from "./tasks.dto"

const router = Router()
router.use(authenticate)

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await TasksService.findAll(req.query.projectId as string, req.user!.companyId, req.query as Record<string, string>)
    sendSuccess(res, result.data, "Tâches récupérées", 200, result.meta)
  } catch (err) { next(err) }
})

router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await TasksService.findById(req.params.id, req.user!.companyId)
    sendSuccess(res, task)
  } catch (err) { next(err) }
})

router.post("/", validate(CreateTaskDto), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await TasksService.create(req.user!.sub, req.body as CreateTaskInput)
    sendCreated(res, task, "Tâche créée")
  } catch (err) { next(err) }
})

router.patch("/:id", validate(UpdateTaskDto), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await TasksService.update(req.params.id, req.user!.companyId, req.user!.sub, req.body as UpdateTaskInput)
    sendSuccess(res, task, "Tâche mise à jour")
  } catch (err) { next(err) }
})

router.delete("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await TasksService.delete(req.params.id, req.user!.companyId, req.user!.sub)
    sendSuccess(res, null, "Tâche supprimée")
  } catch (err) { next(err) }
})

export { router as tasksRouter }
