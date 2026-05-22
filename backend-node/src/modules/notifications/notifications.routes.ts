import { Router } from "express"
import { Response, NextFunction } from "express"
import { AuthRequest } from "@/shared/types"
import { sendSuccess } from "@/shared/utils/response"
import { authenticate } from "@/middlewares/auth.middleware"
import { prisma } from "@/config/database"

const router = Router()
router.use(authenticate)

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1)
    const limit = Math.min(50,  Number(req.query.limit) || 20)
    const where = { userId: req.user!.sub, ...(req.query.unread === "true" ? { isRead: false } : {}) }

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.sub, isRead: false } }),
    ])

    sendSuccess(res, data, "Notifications", 200, { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount })
  } catch (err) { next(err) }
})

router.patch("/:id/read", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const n = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user!.sub } })
    if (!n) { sendSuccess(res, null, "Non trouvée"); return }
    sendSuccess(res, await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true, readAt: new Date() } }))
  } catch (err) { next(err) }
})

router.patch("/read-all", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.sub, isRead: false }, data: { isRead: true, readAt: new Date() } })
    sendSuccess(res, null, "Toutes les notifications marquées comme lues")
  } catch (err) { next(err) }
})

router.delete("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.user!.sub } })
    sendSuccess(res, null, "Notification supprimée")
  } catch (err) { next(err) }
})

export { router as notificationsRouter }
