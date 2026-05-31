import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const { statut } = await req.json() as { statut: "EN_COURS" | "RESOLUE" }
    const body = JSON.stringify({ status: statut === "RESOLUE" ? "RESOLVED" : "OPEN" })

    const res              = await backendFetch(`/hse/${id}`, token, { method: "PATCH", body })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy PATCH /incidents/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const res              = await backendFetch(`/hse/${id}`, token, { method: "DELETE" })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy DELETE /incidents/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
