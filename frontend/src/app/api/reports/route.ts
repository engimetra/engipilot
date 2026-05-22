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

// ── GET /api/reports — rapports de la company ─────────────────────────────────
export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  try {
    const reports = await prisma.report.findMany({
      where: {
        project: { companyId: payload.companyId },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id:          true,
        title:       true,
        type:        true,
        content:     true,
        summary:     true,
        period:      true,
        generatedBy: true,
        createdAt:   true,
        project: { select: { id: true, name: true, reference: true } },
        author:  { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(reports)
  } catch (err) {
    console.error("[GET /api/reports]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── POST /api/reports — créer un rapport journalier ───────────────────────────
const CreateSchema = z.object({
  projectId:   z.string().min(1),
  title:       z.string().min(2),
  content:     z.string().min(1),
  summary:     z.string().optional(),
  period:      z.string().optional(),
  type:        z.enum(["DAILY_PROGRESS","WEEKLY_SUMMARY","MONTHLY_KPI"]).default("DAILY_PROGRESS"),
  generatedBy: z.enum(["MANUAL","AI"]).default("MANUAL"),
})

export async function POST(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const body   = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
    }

    // Vérifier que le projet appartient à la company
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, companyId: payload.companyId, isActive: true },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const report = await prisma.report.create({
      data: {
        title:       parsed.data.title,
        type:        parsed.data.type,
        content:     parsed.data.content,
        summary:     parsed.data.summary ?? null,
        period:      parsed.data.period  ?? null,
        generatedBy: parsed.data.generatedBy,
        projectId:   parsed.data.projectId,
        authorId:    payload.sub,
      },
      include: {
        project: { select: { id: true, name: true, reference: true } },
        author:  { select: { firstName: true, lastName: true } },
      },
    })

    // Si le rapport signale un incident sécurité → créer automatiquement un incident HSE
    try {
      const contentData = JSON.parse(parsed.data.content) as Record<string, unknown>
      if (contentData.incidentsSecurite === true) {
        const dateRapport = parsed.data.period ?? new Date().toISOString().slice(0, 10)
        await prisma.incident.create({
          data: {
            title:       "Incident signalé via rapport journalier",
            description: parsed.data.summary ?? "Incident sécurité déclaré dans le rapport journalier",
            type:        "ACCIDENT",
            severity:    "MEDIUM",
            status:      "OPEN",
            date:        new Date(dateRapport),
            reportedBy:  payload.sub,
            projectId:   parsed.data.projectId,
          },
        })
        await prisma.notification.create({
          data: {
            title:     `Incident HSE — ${project.name}`,
            message:   `Incident sécurité signalé dans le rapport ${parsed.data.title}`,
            type:      "ERROR",
            userId:    payload.sub,
            projectId: parsed.data.projectId,
          },
        })
      }
    } catch {
      // Ne pas bloquer la réponse si la création d'incident échoue
    }

    return NextResponse.json(report, { status: 201 })
  } catch (err) {
    console.error("[POST /api/reports]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
