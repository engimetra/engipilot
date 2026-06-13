import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"
export const dynamic = "force-dynamic"
export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const body = JSON.stringify(await req.json())
    const res = await backendFetch("/ia/chat", token, { method: "POST", body })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
