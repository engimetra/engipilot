import { Router } from "express"
import { ProjectsController } from "./projects.controller"
import { authenticate } from "@/middlewares/auth.middleware"
import { requirePermission } from "@/middlewares/rbac.middleware"
import { validate } from "@/middlewares/validate.middleware"
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from "./projects.dto"

const router = Router()

router.use(authenticate)

router.get(   "/",          validate(ProjectFilterDto, "query"), requirePermission("view",   "projects"), ProjectsController.findAll)
router.get(   "/:id",       requirePermission("view",   "projects"), ProjectsController.findById)
router.get(   "/:id/stats", requirePermission("view",   "projects"), ProjectsController.getStats)
router.post(  "/",          validate(CreateProjectDto), requirePermission("create", "projects"), ProjectsController.create)
router.patch( "/:id",       validate(UpdateProjectDto), requirePermission("update", "projects"), ProjectsController.update)
router.delete("/:id",       requirePermission("delete", "projects"), ProjectsController.delete)

export { router as projectsRouter }
