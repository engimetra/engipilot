import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

const EMOJI_MAP: [string, string][] = [
  ["fondation", "🏗️"], ["structure", "🧱"], ["maçonnerie", "🪟"],
  ["électricité", "⚡"], ["electric", "⚡"], ["plomberie", "🔧"],
  ["finition", "🎨"], ["vrd", "🌿"], ["toiture", "🏠"], ["béton", "🏗️"],
]

function pickEmoji(title: string): string {
  const lower = title.toLowerCase()
  for (const [k, e] of EMOJI_MAP) {
    if (lower.includes(k)) return e
  }
  return "📋"
}

function ganttStatus(status: string, endDate: Date | null): "TERMINE" | "EN_COURS" | "RETARD" | "PLANIFIE" {
  if (status === "DONE") return "TERMINE"
  if (endDate && endDate.getTime() < Date.now() && status !== "DONE") return "RETARD"
  if (status === "IN_PROGRESS" || status === "IN_REVIEW") return "EN_COURS"
  return "PLANIFIE"
}

function ganttColor(gStatus: string): string {
  switch (gStatus) {
    case "TERMINE":  return "#00C875"
    case "RETARD":   return "#E2445C"
    case "EN_COURS": return "#635BFF"
    default:         return "#8b5cf6"
  }
}

// GET /api/projects/[id]/gantt
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const project = await prisma.project.findFirst({
      where: { id, companyId: payload.companyId, isActive: true, deletedAt: null },
      select: { id: true, name: true, startDate: true, endDate: true, progress: true, spi: true },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const tasks = await prisma.task.findMany({
      where: { projectId: id, isActive: true, deletedAt: null, status: { notIn: ["CANCELLED"] } },
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, title: true, status: true, progress: true,
        startDate: true, endDate: true, tags: true,
        assignee: { select: { firstName: true, lastName: true } },
      },
    })

    const projStart = project.startDate.getTime()
    const projEnd   = project.endDate.getTime()
    const totalMs   = Math.max(projEnd - projStart, 1)
    const today     = Date.now()

    const todayPct = Math.max(0, Math.min(100, Math.round(((today - projStart) / totalMs) * 100)))

    const lots = tasks.map(t => {
      const tStart   = t.startDate?.getTime() ?? projStart
      const tEnd     = t.endDate?.getTime()   ?? projEnd
      const startPct = Math.max(0, Math.min(97, Math.round(((tStart - projStart) / totalMs) * 100)))
      const widthPct = Math.max(2, Math.min(100 - startPct, Math.round(((tEnd - tStart) / totalMs) * 100)))
      const gStatus  = ganttStatus(t.status, t.endDate)
      const retard   = gStatus === "RETARD" && t.endDate
        ? Math.floor((today - t.endDate.getTime()) / 86_400_000)
        : 0

      return {
        id:          t.id,
        nom:         t.title,
        emoji:       pickEmoji(t.title),
        statut:      gStatus,
        startPct,
        widthPct,
        avancement:  Math.round(Number(t.progress)),
        color:       ganttColor(gStatus),
        retard,
        responsable: t.assignee
          ? `${t.assignee.firstName[0]}${t.assignee.lastName[0]}`.toUpperCase()
          : "—",
      }
    })

    // Jalons = tasks with "jalon" tag + all DONE tasks + tasks with endDate (up to 8)
    const jalons = tasks
      .filter(t => t.tags.includes("jalon") || t.status === "DONE" || t.endDate != null)
      .sort((a, b) => (a.endDate?.getTime() ?? 0) - (b.endDate?.getTime() ?? 0))
      .slice(0, 8)
      .map(t => ({
        label: t.title,
        date:  t.endDate ? t.endDate.toLocaleDateString("fr-FR") : "—",
        done:  t.status === "DONE",
      }))

    const lotsEnRetard   = lots.filter(l => l.statut === "RETARD").length
    const jalonsAtteints = tasks.filter(t => t.status === "DONE").length
    const maxRetard      = lots.reduce((m, l) => Math.max(m, l.retard), 0)

    // Predicted end: if SPI < 1, remaining duration stretches
    const spi = project.spi ? Number(project.spi) : 1
    const remainingMs    = Math.max(0, projEnd - today)
    const predictedEndMs = spi > 0.01 ? today + remainingMs / spi : projEnd
    const predictedEnd   = new Date(Math.max(predictedEndMs, projEnd))

    const dureeMois = Math.ceil(totalMs / (30 * 86_400_000))

    return NextResponse.json({
      project: {
        id:       project.id,
        name:     project.name,
        startDate: project.startDate.toISOString(),
        endDate:   project.endDate.toISOString(),
        progress:  Math.round(Number(project.progress)),
        spi,
      },
      lots,
      jalons,
      todayPct,
      kpis: {
        dureeMois,
        totalLots:        tasks.length,
        lotsEnRetard,
        jalonsAtteints,
        totalJalons:      jalons.length,
        retardCumule:     maxRetard,
        achevementPredit: predictedEnd.toLocaleDateString("fr-FR"),
      },
    })
  } catch (err) {
    console.error("[GET /api/projects/[id]/gantt]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
