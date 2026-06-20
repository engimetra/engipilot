import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  const { id } = await params
  try {
    const res              = await backendFetch(`/projets/${id}`, token)
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy GET /projects/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const backendBody = {
      codeProjet:         body.reference   ?? body.codeProjet,
      nom:                body.name        ?? body.nom,
      budgetPrevisionnel: body.budgetInitial ?? body.budgetPrevisionnel,
      dateDebut:          body.startDate   ?? body.dateDebut,
      dateFinPrevue:      body.endDate     ?? body.dateFinPrevue,
      ville:              body.city        ?? body.ville        ?? null,
      client:             body.clientName  ?? body.client       ?? null,
      description:        body.description ?? null,
      chefChantier:       body.chefChantier ?? null,
      status:             body.status      ?? null,
      type:               body.type        ?? null,
    }
    const res = await backendFetch(`/projets/${id}`, token, {
      method: "PUT",
      body:   JSON.stringify(backendBody),
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy PUT /projects/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  const { id } = await params
  try {
    const res              = await backendFetch(`/projets/${id}`, token, { method: "DELETE" })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy DELETE /projects/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
