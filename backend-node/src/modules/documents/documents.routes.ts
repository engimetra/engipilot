import { Router, Response, NextFunction } from "express"
import { AuthRequest }  from "@/shared/types"
import { sendSuccess, sendCreated, sendNotFound } from "@/shared/utils/response"
import { authenticate } from "@/middlewares/auth.middleware"
import { prisma }       from "../../config/database"
import { z }            from "zod"

const router = Router()
router.use(authenticate)

const CreateDocDto = z.object({
  name:      z.string().min(1),
  type:      z.string().default("OTHER"),
  mimeType:  z.string().optional(),
  size:      z.number().int().positive().optional(),
  url:       z.string().url(),
  projectId: z.string().uuid().optional().nullable(),
})

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string | undefined

    const docs = await prisma.document.findMany({
      where: {
        isActive: true, deletedAt: null,
        ...(projectId
          ? { projectId }
          : { project: { companyId: req.user!.companyId } }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, type: true, mimeType: true,
        size: true, url: true, version: true, createdAt: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    })
    sendSuccess(res, docs)
  } catch (err) { next(err) }
})

router.post("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateDocDto.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0]?.message })
      return
    }
    const { name, type, mimeType, size, url, projectId } = parsed.data

    const doc = await prisma.document.create({
      data: {
        name, url,
        type:         type as never,
        mimeType:     mimeType ?? null,
        size:         size ?? null,
        uploadedById: req.user!.sub,
        ...(projectId ? { projectId } : {}),
      },
      select: {
        id: true, name: true, type: true, mimeType: true,
        size: true, url: true, version: true, createdAt: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    })
    sendCreated(res, doc, "Document créé")
  } catch (err) { next(err) }
})

router.delete("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, uploadedById: req.user!.sub, isActive: true },
    })
    if (!doc) return sendNotFound(res, "Document")

    await prisma.document.update({
      where: { id: req.params.id },
      data:  { isActive: false, deletedAt: new Date() },
    })
    sendSuccess(res, null, "Document supprimé")
  } catch (err) { next(err) }
})

export { router as documentsRouter }
