/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — POST /api/chat
   Proxy vers backend-node /api/v1/ai/chat
───────────────────────────────────────────────────────────── */
import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

const ALLOWED_MODES = ["chat", "pv", "rapport", "risques"] as const

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Corps JSON invalide", code: "PARSE_ERROR" }, { status: 400 })
  }

  const { messages, mode, conversationId } = body as {
    messages?: unknown[]; mode?: string; conversationId?: string
  }

  if (!Array.isArray(messages) || messages.length === 0)
    return NextResponse.json({ error: "'messages' requis et non vide", code: "VALIDATION_ERROR" }, { status: 400 })

  if (!mode || !ALLOWED_MODES.includes(mode as typeof ALLOWED_MODES[number]))
    return NextResponse.json({ error: `Mode invalide. Acceptés : ${ALLOWED_MODES.join(", ")}`, code: "VALIDATION_ERROR" }, { status: 400 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const res              = await backendFetch("/ai/chat", token, {
      method: "POST",
      body:   JSON.stringify({ messages, mode, conversationId }),
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy POST /chat]", err)
    return NextResponse.json({ error: "Erreur service IA", code: "UNKNOWN" }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok", service: "ENGIPILOT Chat IA (proxy)",
    hasKey: Boolean(process.env.OPENAI_API_KEY),
  })
}
