import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get("projectId")

  try {
    const qs = new URLSearchParams()
    if (projectId) qs.set("projectId", projectId)

    const res              = await backendFetch("/reports", token, { searchParams: qs })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy GET /reports]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const body             = await req.json()
    const res              = await backendFetch("/reports", token, {
      method: "POST",
      body:   JSON.stringify(body),
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy POST /reports]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
