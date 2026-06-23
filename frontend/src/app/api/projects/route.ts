import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"
export const dynamic = "force-dynamic"
function mapProjet(p: Record<string, unknown>) {
  return {
    id:            p.id,
    name:          p.nom          ?? p.name,
    reference:     p.codeProjet   ?? p.reference ?? "",
    status:        p.statut       ?? p.status    ?? "ACTIVE",
    type:          p.type         ?? "CONSTRUCTION",
    progress:      p.avancement   ?? p.progress  ?? 0,
    startDate:     p.dateDebut    ?? p.startDate,
    endDate:       p.dateFinPrevue ?? p.endDate,
    budgetInitial: p.budgetPrevisionnel ?? p.budgetInitial ?? 0,
    budgetActual:  p.budgetReel   ?? p.budgetActual ?? 0,
    spi:           p.spi          ?? null,
    cpi:           p.cpi          ?? null,
    city:          p.ville        ?? p.city       ?? null,
    clientName:    p.client       ?? p.clientName ?? null,
    createdAt:     p.createdAt    ?? p.dateCreation,
    members:       p.members ?? (p.chefChantier ? [{
      user: {
        firstName: String(p.chefChantier).split(" ")[0] ?? "",
        lastName:  String(p.chefChantier).split(" ").slice(1).join(" ") ?? "",
      }
    }] : []),
  }
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const res = await backendFetch("/projets", token)
    const { payload, status } = await proxyResponse(res)
    if (status === 200 && Array.isArray(payload)) {
      return NextResponse.json((payload as Record<string, unknown>[]).map(mapProjet), { status })
    }
    return NextResponse.json(payload, { status })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const body = await req.json()
    const backendBody = {
      codeProjet:         body.reference ?? body.codeProjet,
      nom:                body.name      ?? body.nom,
      budgetPrevisionnel: body.budgetInitial ?? body.budgetPrevisionnel,
      dateDebut:          body.startDate ?? body.dateDebut,
      dateFinPrevue:      body.endDate   ?? body.dateFinPrevue,
      ville:              body.city      ?? body.ville,
      client:             body.clientName ?? body.client,
      description:        body.description,
      priorite:           body.priorite,
      chefChantier:       body.chefChantier,
    }
    const res = await backendFetch("/projets", token, {
      method: "POST",
      body:   JSON.stringify(backendBody),
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
