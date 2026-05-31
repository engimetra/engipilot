import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const period = req.nextUrl.searchParams.get("period") ?? "30"

  try {
    const qs               = new URLSearchParams({ period })
    const res              = await backendFetch("/analytics/global", token, { searchParams: qs })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy GET /analytics]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
