import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const payload = verifyJwt(token)
  if (!payload) return NextResponse.json({ error: "Session expirée" }, { status: 401 })
  const { id } = await params

  try {
    const project = await prisma.project.findFirst({
      where: { id, companyId: payload.companyId, isActive: true, deletedAt: null },
      select: {
        id:            true,
        name:          true,
        reference:     true,
        budgetInitial: true,
        budgetActual:  true,
        progress:      true,
        spi:           true,
        cpi:           true,
        startDate:     true,
        endDate:       true,
        status:        true,
      },
    })

    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const bac = Number(project.budgetInitial)   // Budget at Completion
    const ac  = Number(project.budgetActual)    // Actual Cost
    const pct = Number(project.progress) / 100  // Fraction avancement
    const ev  = bac * pct                       // Earned Value

    // PV via SPI stocké ou estimation temporelle
    let pv: number
    if (project.spi !== null && Number(project.spi) > 0) {
      pv = ev / Number(project.spi)
    } else {
      const start   = new Date(project.startDate).getTime()
      const end     = new Date(project.endDate).getTime()
      const elapsed = Math.max(0, Math.min(1, (Date.now() - start) / Math.max(end - start, 1)))
      pv = bac * elapsed
    }

    const cpi  = ac > 0    ? ev / ac  : null
    const spi  = pv > 0    ? ev / pv  : null
    const cv   = ev - ac                        // Cost Variance (+ = sous budget)
    const sv   = ev - pv                        // Schedule Variance (+ = en avance)
    const eac  = cpi && cpi > 0 ? bac / cpi : bac  // Estimate at Completion
    const vac  = bac - eac                      // Variance at Completion
    const tcpi = (bac - ac) > 0 ? (bac - ev) / (bac - ac) : null  // To-Complete PI

    return NextResponse.json({
      projectId:   project.id,
      projectName: project.name,
      reference:   project.reference,
      bac,
      pv:       Math.round(pv),
      ev:       Math.round(ev),
      ac:       Math.round(ac),
      cv:       Math.round(cv),
      sv:       Math.round(sv),
      spi:      spi  !== null ? Number(spi.toFixed(3))  : null,
      cpi:      cpi  !== null ? Number(cpi.toFixed(3))  : null,
      eac:      Math.round(eac),
      vac:      Math.round(vac),
      tcpi:     tcpi !== null ? Number(tcpi.toFixed(3)) : null,
      progress: Number(project.progress),
    })
  } catch (err) {
    console.error("[GET /api/projects/[id]/kpis/evm]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
