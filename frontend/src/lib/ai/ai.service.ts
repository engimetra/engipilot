import type { ChatMessage, ChatRequest, ChatResponse, LLMJsonResponse } from "@/types/chat"
import { buildSystemMessage, ENGIPILOT_CONTEXT } from "./prompt.engine"
import { ConversationMemory } from "./memory"

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const MODEL         = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8"
const TIMEOUT_MS    = 30_000

async function callLLM(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw Object.assign(new Error("Cle API non configuree"), { code: "NO_API_KEY" })

  const systemParts = messages.filter(m => m.role === "system").map(m => m.content)
  const conversation = messages.filter(m => m.role !== "system")

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method:  "POST",
      signal:  controller.signal,
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 1500,
        system:     systemParts.join("\n\n"),
        messages:   conversation,
      }),
    })

    if (res.status === 429) throw Object.assign(new Error("Rate limit Anthropic"), { code: "RATE_LIMIT" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw Object.assign(new Error(err?.error?.message ?? `Anthropic HTTP ${res.status}`), { code: "LLM_ERROR" })
    }

    const data = await res.json()
    return data.content?.[0]?.text ?? ""
  } finally {
    clearTimeout(timer)
  }
}

function parseLLMResponse(raw: string, mode: ChatRequest["mode"]): ChatResponse {
  try {
    const parsed: LLMJsonResponse = JSON.parse(raw)
    const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 75))
    const warning    = confidence < 70 ? (parsed.warning ?? "Niveau de confiance faible") : null
    return { content: parsed.content ?? raw, confidence, warning, sources: Array.isArray(parsed.sources) ? parsed.sources : [], mode }
  } catch {
    return { content: raw, confidence: 70, warning: null, sources: [], mode }
  }
}

function fallbackResponse(request: ChatRequest): ChatResponse {
  const last = request.messages[request.messages.length - 1]?.content?.toLowerCase() ?? ""
  const { mode } = request
  let content = ""

  if (mode === "pv") {
    const today = new Date().toLocaleDateString("fr-FR")
    content = `## PV — Reunion de chantier | ${today}\n\n**1. PARTICIPANTS**\n• Conducteur travaux · Chef de chantier\n\n**2. AVANCEMENT**\n• A completer selon vos donnees\n\n_PV genere en mode hors-ligne_`
  } else if (mode === "rapport") {
    content = "## Rapport — Mode hors-ligne\n\nConfigurez ANTHROPIC_API_KEY pour activer l'analyse IA complete."
  } else if (mode === "risques") {
    content = "## Analyse de Risques — Mode hors-ligne\n\nConfigurez l'API IA pour une analyse personnalisee."
  } else {
    content = "## ENGIPILOT Copilot — Mode hors-ligne\n\nConfigurez ANTHROPIC_API_KEY pour activer l'IA."
  }

  return {
    content,
    confidence: 65,
    warning:    "Mode hors-ligne — Configurez ANTHROPIC_API_KEY pour l'IA complete.",
    sources:    ["ENGIPILOT Offline"],
    mode,
  }
}

export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  const { messages, mode } = request

  if (!process.env.ANTHROPIC_API_KEY) return fallbackResponse(request)

  const systemMsg: ChatMessage  = buildSystemMessage(mode)
  const contextMsg: ChatMessage = { role: "user",      content: ENGIPILOT_CONTEXT }
  const contextAck: ChatMessage = { role: "assistant", content: '{"content":"Contexte ENGIPILOT recu. Pret a analyser.","confidence":100,"warning":null,"sources":[]}' }

  const history    = ConversationMemory.pruneToTokenBudget(messages)
  const fullStack: ChatMessage[] = [systemMsg, contextMsg, contextAck, ...history]

  try {
    const raw      = await callLLM(fullStack)
    const response = parseLLMResponse(raw, mode)

    const userMsg = messages[messages.length - 1]
    if (userMsg?.role === "user") {
      ConversationMemory.append("global", [userMsg, { role: "assistant", content: response.content }])
    }

    return response
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e?.code === "NO_API_KEY") return fallbackResponse(request)

    return {
      content:    `## Erreur IA\n\nImpossible de joindre le service IA : ${e?.message ?? "erreur inconnue"}`,
      confidence: 0,
      warning:    `Erreur service IA : ${e?.code ?? "UNKNOWN"}`,
      sources:    [],
      mode,
    }
  }
}
