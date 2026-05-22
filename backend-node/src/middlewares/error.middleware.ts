import { Request, Response, NextFunction } from "express"
import { Prisma } from "@prisma/client"
import { sendError, sendServerError } from "@/shared/utils/response"

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[ERROR]", err.message)

  // Prisma — record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      sendError(res, "Ressource introuvable", 404)
      return
    }
    if (err.code === "P2002") {
      sendError(res, "Conflit — donnée déjà existante (contrainte unique)", 409)
      return
    }
    sendError(res, `Erreur base de données (${err.code})`, 400)
    return
  }

  // Prisma — validation
  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, "Données invalides envoyées à la base", 400)
    return
  }

  sendServerError(res, err.message || "Erreur interne du serveur")
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route introuvable : ${req.method} ${req.path}`, 404)
}
