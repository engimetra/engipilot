import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const res              = await backendFetch("/projects", token)
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy GET /projects]", err)
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
    const res = await backendFetch("/projects", token, {
      method: "POST",
      body:   JSON.stringify(backendBody),
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy POST /projects]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
