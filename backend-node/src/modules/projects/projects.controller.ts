import { Response, NextFunction } from "express"
import { AuthRequest } from "@/shared/types"
import { sendSuccess, sendCreated, sendNotFound } from "@/shared/utils/response"
import { ProjectsService } from "./projects.service"
import { CreateProjectInput, UpdateProjectInput, ProjectFilterInput } from "./projects.dto"

export const ProjectsController = {

  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectsService.findAll(req.user!.companyId, req.query as unknown as ProjectFilterInput)
      sendSuccess(res, result.data, "Projets récupérés", 200, result.meta)
    } catch (err) { next(err) }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectsService.findById(req.params.id, req.user!.companyId)
      if (!project) { sendNotFound(res, "Projet"); return }
      sendSuccess(res, project)
    } catch (err) { next(err) }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectsService.create(req.user!.companyId, req.user!.sub, req.body as CreateProjectInput)
      sendCreated(res, project, "Projet créé avec succès")
    } catch (err) { next(err) }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectsService.update(req.params.id, req.user!.companyId, req.user!.sub, req.body as UpdateProjectInput)
      sendSuccess(res, project, "Projet mis à jour")
    } catch (err) { next(err) }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProjectsService.delete(req.params.id, req.user!.companyId, req.user!.sub)
      sendSuccess(res, null, "Projet supprimé")
    } catch (err) { next(err) }
  },

  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ProjectsService.getStats(req.params.id, req.user!.companyId)
      sendSuccess(res, stats)
    } catch (err) { next(err) }
  },
}
