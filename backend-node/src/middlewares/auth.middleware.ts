import { Response, NextFunction } from "express"
import { jwtConfig } from "@/config/jwt"
import { AuthRequest } from "@/shared/types"
import { sendUnauthorized } from "@/shared/utils/response"

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    sendUnauthorized(res, "Token manquant")
    return
  }

  const token = authHeader.slice(7)
  try {
    req.user = jwtConfig.verify(token)
    next()
  } catch {
    sendUnauthorized(res, "Token invalide ou expiré")
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.user = jwtConfig.verify(authHeader.slice(7))
    } catch {
      // token invalide ignoré en mode optionnel
    }
  }
  next()
}
