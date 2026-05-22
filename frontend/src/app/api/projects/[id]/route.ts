import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"
import { z } from "zod"

export const dynamic = "force-dynamic"

function getAuth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

// ── GET /api/projects/[id] ────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const project = await prisma.project.findFirst({
      where: { id, companyId: payload.companyId, isActive: true, deletedAt: null },
      include: {
        members: { include: { user: { select: { firstName: true, lastName: true } } }, take: 1 },
      },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })
    return NextResponse.json(project)
  } catch (err) {
    console.error("[GET /api/projects/[id]]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── PUT /api/projects/[id] ────────────────────────────────────────────────────
const UpdateSchema = z.object({
  name:          z.string().min(2).optional(),
  description:   z.string().optional(),
  status:        z.enum(["DRAFT","ACTIVE","PAUSED","COMPLETED","CANCELLED","ARCHIVED"]).optional(),
  type:          z.enum(["CONSTRUCTION","RENOVATION","INFRASTRUCTURE","INDUSTRIAL","RESIDENTIAL","COMMERCIAL","OTHER"]).optional(),
  startDate:     z.string().optional(),
  endDate:       z.string().optional(),
  budgetInitial: z.number().positive().optional(),
  city:          z.string().optional().nullable(),
  clientName:    z.string().optional().nullable(),
  progress:      z.number().min(0).max(100).optional(),
  spi:           z.number().optional().nullable(),
  cpi:           z.number().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(payload.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
  }

  try {
    const existing = await prisma.project.findFirst({
      where: { id: id, companyId: payload.companyId, isActive: true, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const body   = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
    }

    const { startDate, endDate, ...rest } = parsed.data
    const updated = await prisma.project.update({
      where: { id: id },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate   ? { endDate:   new Date(endDate)   } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[PUT /api/projects/[id]]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── DELETE /api/projects/[id] — soft delete ───────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  if (!["SUPER_ADMIN", "ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
  }

  try {
    const existing = await prisma.project.findFirst({
      where: { id: id, companyId: payload.companyId, isActive: true, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    await prisma.project.update({
      where: { id: id },
      data:  { isActive: false, deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/projects/[id]]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
