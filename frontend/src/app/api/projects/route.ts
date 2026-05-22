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

// ── GET /api/projects — liste des projets de la company ──────────────────────
export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const projects = await prisma.project.findMany({
      where:   { companyId: payload.companyId, isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id:            true,
        name:          true,
        reference:     true,
        status:        true,
        type:          true,
        progress:      true,
        startDate:     true,
        endDate:       true,
        budgetInitial: true,
        budgetActual:  true,
        spi:           true,
        cpi:           true,
        city:          true,
        clientName:    true,
        createdAt:     true,
        members: {
          include: { user: { select: { firstName: true, lastName: true } } },
          take: 1,
          orderBy: { joinedAt: "asc" },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (err) {
    console.error("[GET /api/projects]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── POST /api/projects — créer un projet ─────────────────────────────────────
const CreateSchema = z.object({
  name:          z.string().min(2),
  reference:     z.string().optional(),
  startDate:     z.string(),
  endDate:       z.string(),
  budgetInitial: z.number().positive(),
  status:        z.enum(["DRAFT","ACTIVE","PAUSED","COMPLETED","CANCELLED","ARCHIVED"]).default("ACTIVE"),
  type:          z.enum(["CONSTRUCTION","RENOVATION","INFRASTRUCTURE","INDUSTRIAL","RESIDENTIAL","COMMERCIAL","OTHER"]).default("CONSTRUCTION"),
  city:          z.string().optional(),
  clientName:    z.string().optional(),
  description:   z.string().optional(),
})

export async function POST(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // Seuls ADMIN et MANAGER peuvent créer
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(payload.role)) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
    }

    const { name, reference, startDate, endDate, budgetInitial, status, type, city, clientName, description } = parsed.data

    // Générer une référence automatique si non fournie
    const year = new Date().getFullYear()
    const count = await prisma.project.count({ where: { companyId: payload.companyId } })
    const autoRef = reference ?? `P-${year}-NV-${String(count + 1).padStart(3, "0")}`

    const project = await prisma.project.create({
      data: {
        name,
        reference:     autoRef,
        description:   description ?? null,
        status,
        type,
        startDate:     new Date(startDate),
        endDate:       new Date(endDate),
        budgetInitial,
        city:          city ?? null,
        clientName:    clientName ?? null,
        companyId:     payload.companyId,
        isActive:      true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Référence projet déjà existante" }, { status: 409 })
    }
    console.error("[POST /api/projects]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
