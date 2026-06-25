import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"
export const dynamic = "force-dynamic"
export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const qs  = new URLSearchParams()
    if (projectId) qs.set("projectId", projectId)

    const res  = await backendFetch("/hse", token, { searchParams: qs })
    const json = await res.json() as { success?: boolean; data?: Record<string, unknown>[] }

    if (!res.ok) return NextResponse.json({ error: (json as { message?: string }).message ?? "Erreur backend" }, { status: res.status })

    const raw = (json.data ?? json) as Record<string, unknown>[] | { content?: Record<string, unknown>[] }
    const items = Array.isArray(raw) ? raw : (raw as { content?: Record<string, unknown>[] }).content ?? []
    return NextResponse.json(items.map(toUI))
  } catch (err) {
    console.error("[proxy GET /incidents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const body = JSON.stringify(await req.json())
    const res = await backendFetch("/incidents", token, { method: "POST", body })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
