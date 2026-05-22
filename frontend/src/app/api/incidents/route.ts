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

// ── Mappings UI ↔ Prisma ─────────────────────────────────────────────────────
const UI_TYPE_TO_PRISMA: Record<string, string> = {
  PRESQU_ACCIDENT:      "NEAR_MISS",
  ACCIDENT_SANS_ARRET:  "ACCIDENT",
  ACCIDENT_ARRET:       "ACCIDENT",
  MALADIE_PRO:          "ENVIRONMENTAL",
  OBSERVATION:          "OBSERVATION",
  PROPERTY_DAMAGE:      "PROPERTY_DAMAGE",
}

const PRISMA_TYPE_TO_UI: Record<string, string> = {
  NEAR_MISS:       "PRESQU_ACCIDENT",
  ACCIDENT:        "ACCIDENT_ARRET",
  NON_CONFORMITY:  "PRESQU_ACCIDENT",
  OBSERVATION:     "PRESQU_ACCIDENT",
  ENVIRONMENTAL:   "MALADIE_PRO",
  PROPERTY_DAMAGE: "ACCIDENT_SANS_ARRET",
}

const UI_GRAVITE_TO_SEVERITY: Record<string, string> = {
  MINEUR:   "LOW",
  MAJEUR:   "HIGH",
  CRITIQUE: "CRITICAL",
  HAUT:     "HIGH",
}

const SEVERITY_TO_UI: Record<string, string> = {
  NEGLIGIBLE: "MINEUR",
  LOW:        "MINEUR",
  MEDIUM:     "MAJEUR",
  HIGH:       "MAJEUR",
  CRITICAL:   "CRITIQUE",
}

function toUIIncident(inc: {
  id: string; title: string; description: string; type: string; severity: string
  status: string; date: Date; location: string | null
  lostDays: number; injuredCount: number
  projectId: string; createdAt: Date
}) {
  return {
    id:                  inc.id,
    type:                PRISMA_TYPE_TO_UI[inc.type] ?? inc.type,
    description:         inc.description,
    dateIncident:        inc.date.toISOString(),
    lieu:                inc.location,
    gravite:             SEVERITY_TO_UI[inc.severity] ?? "MINEUR",
    statut:              ["RESOLVED","CLOSED"].includes(inc.status) ? "RESOLUE" : "EN_COURS",
    nombreJoursArret:    inc.lostDays,
    nombreBlesses:       inc.injuredCount,
    mesuresPrises:       null,
    projetId:            inc.projectId,
    createdAt:           inc.createdAt.toISOString(),
  }
}

// ── GET /api/incidents?projectId= ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  try {
    const incidents = await prisma.incident.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        project: { companyId: payload.companyId },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json(incidents.map(toUIIncident))
  } catch (err) {
    console.error("[GET /api/incidents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── POST /api/incidents — déclarer un incident ────────────────────────────────
const CreateSchema = z.object({
  projectId:         z.string().min(1),
  type:              z.string().default("PRESQU_ACCIDENT"),
  description:       z.string().min(2),
  dateIncident:      z.string().min(1),
  lieu:              z.string().optional().nullable(),
  gravite:           z.string().default("MINEUR"),
  nombreJoursArret:  z.number().int().min(0).optional().default(0),
  nombreBlesses:     z.number().int().min(0).optional().default(0),
  mesuresPrises:     z.string().optional().nullable(),
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

    const d = parsed.data

    // Vérifier que le projet appartient à la company
    const project = await prisma.project.findFirst({
      where: { id: d.projectId, companyId: payload.companyId, isActive: true },
      select: { id: true, name: true },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const prismaType     = UI_TYPE_TO_PRISMA[d.type]     ?? "ACCIDENT"
    const prismaSeverity = UI_GRAVITE_TO_SEVERITY[d.gravite] ?? "LOW"

    const typeLabels: Record<string, string> = {
      PRESQU_ACCIDENT:     "Presqu'accident",
      ACCIDENT_SANS_ARRET: "Accident sans arrêt",
      ACCIDENT_ARRET:      "Accident avec arrêt",
      MALADIE_PRO:         "Maladie professionnelle",
    }

    const incident = await prisma.incident.create({
      data: {
        title:        typeLabels[d.type] ?? d.type,
        description:  d.description,
        type:         prismaType as never,
        severity:     prismaSeverity as never,
        status:       "OPEN",
        date:         new Date(d.dateIncident),
        location:     d.lieu ?? null,
        lostDays:     d.nombreJoursArret ?? 0,
        injuredCount: d.nombreBlesses ?? 0,
        correctiveActions: d.mesuresPrises ?? null,
        reportedBy:   payload.sub,
        projectId:    d.projectId,
      },
    })

    // Créer notification HSE
    await prisma.notification.create({
      data: {
        title:     `Incident HSE — ${project.name}`,
        message:   `${typeLabels[d.type] ?? d.type} · ${d.gravite} · ${d.lieu ?? "localisation inconnue"}`,
        type:      "ERROR",
        userId:    payload.sub,
        projectId: d.projectId,
      },
    })

    return NextResponse.json(toUIIncident(incident), { status: 201 })
  } catch (err) {
    console.error("[POST /api/incidents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
