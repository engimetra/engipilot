import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

// ── GET /api/projects/[id]/kpis/hse ─────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const project = await prisma.project.findFirst({
      where: { id: id, companyId: payload.companyId, isActive: true },
      select: { id: true, startDate: true, members: { select: { id: true } } },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const incidents = await prisma.incident.findMany({
      where:  { projectId: id, isActive: true },
      select: { type: true, status: true, lostDays: true, injuredCount: true, date: true },
    })

    const accidents      = incidents.filter(i => i.type === "ACCIDENT")
    const presquAccidents = incidents.filter(i => i.type === "NEAR_MISS")
    const enCours        = incidents.filter(i => !["RESOLVED","CLOSED"].includes(i.status)).length
    const totalLostDays  = incidents.reduce((s, i) => s + (i.lostDays ?? 0), 0)

    // Estimation heures travaillées depuis le démarrage du projet
    const startDate = project.startDate ?? new Date()
    const joursEcoules = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / 86_400_000))
    const heuresEstimees = joursEcoules * 8 * Math.max(1, project.members.length)

    // TF = (accidents × 10^6) / heures
    const tf = accidents.length > 0
      ? Math.round((accidents.length * 1_000_000) / heuresEstimees * 10) / 10
      : 0

    // TG = (jours arrêt × 10^3) / heures
    const tg = totalLostDays > 0
      ? Math.round((totalLostDays * 1_000) / heuresEstimees * 100) / 100
      : 0

    // Heures sans accident = depuis dernier accident
    const lastAccident = accidents
      .map(a => a.date.getTime())
      .sort((a, b) => b - a)[0]
    const heuresSansAccident = lastAccident
      ? Math.floor((Date.now() - lastAccident) / 3_600_000)
      : heuresEstimees

    return NextResponse.json({
      tf,
      tg,
      accidents:          accidents.length,
      presquAccidents:    presquAccidents.length,
      enCours,
      heuresSansAccident,
    })
  } catch (err) {
    console.error("[GET /api/projects/[id]/kpis/hse]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
