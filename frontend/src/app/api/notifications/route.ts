import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"
import { z } from "zod"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

// ── GET /api/notifications ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const notifications = await prisma.notification.findMany({
      where:   { userId: payload.sub },
      orderBy: { createdAt: "desc" },
      take:    100,
      select: {
        id:        true,
        title:     true,
        message:   true,
        type:      true,
        isRead:    true,
        createdAt: true,
        project:   { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(notifications)
  } catch (err) {
    console.error("[GET /api/notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── POST /api/notifications — persister une notif reçue via STOMP ─────────────
const CreateSchema = z.object({
  title:     z.string().min(1).max(255),
  message:   z.string().min(1),
  type:      z.enum(["INFO","SUCCESS","WARNING","ERROR","AI_ALERT","SYSTEM"]).default("INFO"),
  projectId: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const body   = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
    }

    const { title, message, type, projectId } = parsed.data

    // Vérifier que le projet appartient à la company si fourni
    if (projectId) {
      const proj = await prisma.project.findFirst({
        where: { id: projectId, companyId: payload.companyId },
      })
      if (!proj) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })
    }

    const notif = await prisma.notification.create({
      data: { title, message, type, projectId: projectId ?? null, userId: payload.sub },
      select: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true,
                project: { select: { id: true, name: true } } },
    })

    return NextResponse.json(notif, { status: 201 })
  } catch (err) {
    console.error("[POST /api/notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── PATCH /api/notifications — marquer comme lu ───────────────────────────────
export async function PATCH(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const body = await req.json()
    const { id, all } = body as { id?: string; all?: boolean }

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: payload.sub, isRead: false },
        data:  { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ ok: true })
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: payload.sub },
        data:  { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "id ou all requis" }, { status: 400 })
  } catch (err) {
    console.error("[PATCH /api/notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── DELETE /api/notifications — supprimer une ou toutes ──────────────────────
export async function DELETE(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id  = searchParams.get("id")
    const all = searchParams.get("all") === "true"

    if (all) {
      await prisma.notification.deleteMany({ where: { userId: payload.sub } })
      return NextResponse.json({ ok: true })
    }

    if (id) {
      await prisma.notification.deleteMany({ where: { id, userId: payload.sub } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "id ou all=true requis" }, { status: 400 })
  } catch (err) {
    console.error("[DELETE /api/notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
