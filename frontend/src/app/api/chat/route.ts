/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — POST /api/chat
   Controller HTTP + persistance PostgreSQL via Prisma
───────────────────────────────────────────────────────────── */
import { NextRequest, NextResponse } from "next/server"
import { processChat } from "@/lib/ai/ai.service"
import type { ChatRequest } from "@/types/chat"

export const dynamic = "force-dynamic"

const ALLOWED_MODES = ["chat", "pv", "rapport", "risques"] as const

/* Tentative d'import Prisma — silencieuse si DB non configurée */
async function tryPersist(data: {
  conversationId?: string
  userId?: string
  mode: string
  userMessage: string
  assistantContent: string
  confidence: number
  warning: string | null
  sources: string[]
}): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null

  try {
    const { prisma } = await import("@/lib/db")

    // Crée ou récupère la conversation
    let convId = data.conversationId
    if (!convId && data.userId) {
      const conv = await prisma.aiConversation.create({
        data: {
          userId:    data.userId,
          mode:      data.mode.toUpperCase() as never,
          title:     data.userMessage.slice(0, 60),
        },
      })
      convId = conv.id
    }

    if (convId) {
      await prisma.aiMessage.createMany({
        data: [
          { conversationId: convId, role: "user",      content: data.userMessage },
          {
            conversationId: convId,
            role:           "assistant",
            content:        data.assistantContent,
            confidence:     data.confidence,
            warning:        data.warning,
            sources:        data.sources,
          },
        ],
      })
    }

    return convId ?? null
  } catch {
    // DB non accessible — le chat continue sans persistance
    return null
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide", code: "PARSE_ERROR" },
      { status: 400 }
    )
  }

  const { messages, mode, conversationId, userId } = body as Partial<ChatRequest> & {
    conversationId?: string
    userId?: string
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Le champ 'messages' est requis et doit être un tableau non vide", code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  if (!mode || !ALLOWED_MODES.includes(mode as typeof ALLOWED_MODES[number])) {
    return NextResponse.json(
      { error: `Mode invalide. Valeurs acceptées : ${ALLOWED_MODES.join(", ")}`, code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  const safeMessages = messages.slice(-30).map(m => ({
    role:    m.role    ?? "user",
    content: String(m.content ?? "").slice(0, 4000),
  }))

  try {
    const response = await processChat({ messages: safeMessages, mode })

    // Persistance asynchrone en DB (non-bloquante)
    const userMessage = safeMessages[safeMessages.length - 1]?.content ?? ""
    const savedConvId = await tryPersist({
      conversationId,
      userId,
      mode,
      userMessage,
      assistantContent: response.content,
      confidence:       response.confidence,
      warning:          response.warning,
      sources:          response.sources,
    })

    return NextResponse.json(
      { ...response, conversationId: savedConvId ?? conversationId },
      { status: 200 }
    )
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string }
    console.error("[/api/chat] Erreur:", e)
    return NextResponse.json(
      { error: "Erreur interne du service IA", code: e?.code ?? "UNKNOWN" },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  const hasDb = Boolean(process.env.DATABASE_URL)

  return NextResponse.json({
    status:   "ok",
    service:  "ENGIPILOT Chat IA",
    model:    process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    hasKey:   Boolean(process.env.OPENAI_API_KEY),
    database: hasDb ? "configured" : "not configured (offline mode)",
  })
}
