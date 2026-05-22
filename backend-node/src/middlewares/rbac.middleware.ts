import { Response, NextFunction } from "express"
import { prisma } from "@/config/database"
import { AuthRequest } from "@/shared/types"
import { sendForbidden, sendUnauthorized } from "@/shared/utils/response"

export function requirePermission(action: string, resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res)
      return
    }

    const permission = await prisma.rolePermission.findFirst({
      where: {
        roleId: req.user.roleId,
        permission: { action, resource },
      },
    })

    if (!permission) {
      sendForbidden(res, `Permission requise : ${action}:${resource}`)
      return
    }

    next()
  }
}

export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendUnauthorized(res)
      return
    }

    const role = await prisma.role.findUnique({ where: { id: req.user.roleId } })

    if (!role || !roles.includes(role.name)) {
      sendForbidden(res, `Rôle requis : ${roles.join(" | ")}`)
      return
    }

    next()
  }
}
