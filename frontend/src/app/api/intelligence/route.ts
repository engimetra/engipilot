/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — POST /api/intelligence
   Orchestration complète : Chat + Module IA + Analytics + Alertes
───────────────────────────────────────────────────────────── */
import { NextRequest, NextResponse } from "next/server"
import { intelligenceCore, type IntelligenceInput } from "@/lib/ai/intelligence"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Corps JSON invalide", code: "PARSE_ERROR" },
      { status: 400 }
    )
  }

  const input = body as Partial<IntelligenceInput>

  if (!input.message || typeof input.message !== "string") {
    return NextResponse.json(
      { error: "Champ 'message' requis (string)", code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  if (!input.data || typeof input.data !== "object") {
    return NextResponse.json(
      { error: "Champ 'data' requis (ProjectData)", code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  if (!input.project || typeof input.project !== "object") {
    return NextResponse.json(
      { error: "Champ 'project' requis (ProjectAnalyticsInput & AlertInput)", code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  try {
    const result = await intelligenceCore(input as IntelligenceInput)
    return NextResponse.json(result, { status: 200 })
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string }
    console.error("[/api/intelligence] Erreur:", e)
    return NextResponse.json(
      { error: "Erreur Intelligence Core", code: e?.code ?? "UNKNOWN" },
      { status: 500 }
    )
  }
}

/* Health check — liste les modules actifs */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status:  "ok",
    service: "ENGIPILOT Intelligence Core",
    version: "1.0",
    modules: {
      chat:      "active",
      module:    "active",
      analytics: "active",
      alerts:    "active",
    },
    hasAI: Boolean(process.env.OPENAI_API_KEY),
  })
}
