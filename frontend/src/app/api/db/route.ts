/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — GET /api/db
   Proxy vers le health-check backend-node
───────────────────────────────────────────────────────────── */
import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = getToken(req)
  const start = Date.now()

  try {
    const res = await backendFetch("/health", token)
    const json = await res.json()
    return NextResponse.json({
      ...json,
      latencyMs:   Date.now() - start,
      proxy:       "frontend → backend-node",
      environment: process.env.NODE_ENV,
    }, { status: res.status })
  } catch (err) {
    console.error("[proxy GET /db]", err)
    return NextResponse.json({
      status:    "error",
      message:   "Backend injoignable",
      hint:      "Vérifiez NEXT_PUBLIC_API_URL et que backend-node est démarré",
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
