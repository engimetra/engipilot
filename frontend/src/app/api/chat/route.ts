/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — POST /api/chat
   Appel direct à processChat (OpenAI si clé présente, fallback sinon)
───────────────────────────────────────────────────────────── */
import { NextRequest, NextResponse } from "next/server"
import { processChat } from "@/lib/ai/ai.service"
import type { ChatMessage, ChatMode } from "@/types/chat"

export const dynamic = "force-dynamic"

const ALLOWED_MODES = ["chat", "pv", "rapport", "risques"] as const

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Corps JSON invalide", code: "PARSE_ERROR" }, { status: 400 })
  }

  const { messages, mode } = body as {
    messages?: unknown[]; mode?: string; conversationId?: string
  }

  if (!Array.isArray(messages) || messages.length === 0)
    return NextResponse.json({ error: "'messages' requis et non vide", code: "VALIDATION_ERROR" }, { status: 400 })

  if (!mode || !ALLOWED_MODES.includes(mode as typeof ALLOWED_MODES[number]))
    return NextResponse.json({ error: `Mode invalide. Acceptés : ${ALLOWED_MODES.join(", ")}`, code: "VALIDATION_ERROR" }, { status: 400 })

  try {
    const response = await processChat({
      messages: messages as ChatMessage[],
      mode:     mode as ChatMode,
    })
    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    console.error("[POST /api/chat]", err)
    return NextResponse.json({ error: "Erreur service IA", code: "UNKNOWN" }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok", service: "ENGIPILOT Chat IA",
    hasKey: Boolean(process.env.OPENAI_API_KEY),
  })
}
