import { Response, NextFunction } from "express"
import { AuthRequest } from "@/shared/types"
import { sendSuccess, sendCreated, sendError } from "@/shared/utils/response"
import { AuthService } from "./auth.service"
import { RegisterInput, LoginInput, RefreshInput, ChangePassInput } from "./auth.dto"

export const AuthController = {

  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body as RegisterInput)
      sendCreated(res, result, "Compte créé avec succès")
    } catch (err) { next(err) }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body as LoginInput)
      sendSuccess(res, result, "Connexion réussie")
    } catch (err) {
      const e = err as { status?: number; message?: string }
      if (e.status === 401) { sendError(res, e.message ?? "Identifiants invalides", 401); return }
      next(err)
    }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshInput
      const result = await AuthService.refreshToken(refreshToken)
      sendSuccess(res, result)
    } catch (err) { next(err) }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.me(req.user!.sub)
      sendSuccess(res, user)
    } catch (err) { next(err) }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as ChangePassInput
      await AuthService.changePassword(req.user!.sub, currentPassword, newPassword)
      sendSuccess(res, null, "Mot de passe modifié avec succès")
    } catch (err) { next(err) }
  },

  async logout(_req: AuthRequest, res: Response): Promise<void> {
    sendSuccess(res, null, "Déconnexion réussie")
  },
}
