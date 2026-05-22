import { prisma } from "@/config/database"
import { env } from "@/config/env"
import { SendMessageInput, CreateAlertInput } from "./ai.dto"

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const TIMEOUT_MS = 30_000

const SYSTEM_PROMPT = `Tu es ENGIPILOT AI Copilot, un assistant spécialisé en BTP et ingénierie.

RÈGLES STRICTES :
- Ne jamais inventer de données, chiffres ou faits non fournis
- Si information inconnue : "information non disponible dans le contexte actuel"
- Réponse structurée : 1.Analyse 2.Réponse 3.Étapes 4.Conclusion
- Répondre en JSON : { "content": "...", "confidence": 0-100, "warning": null | "..." , "sources": [] }

DOMAINE : Génie civil, gestion chantier, EVM, HSE, planification BTP`

async function callOpenAI(messages: { role: string; content: string }[]): Promise<{ content: string; confidence: number; warning: string | null; sources: string[] }> {
  if (!env.OPENAI_API_KEY) {
    return {
      content:    "Service IA non configuré. Ajoutez OPENAI_API_KEY dans .env",
      confidence: 0,
      warning:    "Clé API manquante",
      sources:    [],
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(OPENAI_URL, {
      method:  "POST",
      signal:  controller.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model:           env.OPENAI_MODEL,
        messages:        [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature:     0.2,
        max_tokens:      1500,
        response_format: { type: "json_object" },
      }),
    })

    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`)

    const data = await res.json() as { choices: { message: { content: string } }[] }
    const raw  = data.choices?.[0]?.message?.content ?? "{}"

    try {
      const parsed = JSON.parse(raw) as { content?: string; confidence?: number; warning?: string; sources?: string[] }
      return {
        content:    parsed.content    ?? raw,
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 75)),
        warning:    parsed.warning    ?? null,
        sources:    Array.isArray(parsed.sources) ? parsed.sources : [],
      }
    } catch {
      return { content: raw, confidence: 70, warning: null, sources: [] }
    }
  } finally {
    clearTimeout(timer)
  }
}

export const AiService = {

  async getConversations(userId: string) {
    return prisma.aiConversation.findMany({
      where:   { userId },
      orderBy: { updatedAt: "desc" },
      select:  { id: true, mode: true, title: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } },
    })
  },

  async getConversation(id: string, userId: string) {
    const conv = await prisma.aiConversation.findFirst({
      where:   { id, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    })
    if (!conv) throw Object.assign(new Error("Conversation introuvable"), { status: 404 })
    return conv
  },

  async sendMessage(userId: string, input: SendMessageInput) {
    // Récupère ou crée la conversation
    let conversationId = input.conversationId
    if (!conversationId) {
      const conv = await prisma.aiConversation.create({
        data: { userId, mode: input.mode, projectId: input.projectId },
      })
      conversationId = conv.id
    }

    // Sauvegarde le message utilisateur
    await prisma.aiMessage.create({
      data: { conversationId, role: "user", content: input.content },
    })

    // Récupère l'historique (max 20 messages)
    const history = await prisma.aiMessage.findMany({
      where:   { conversationId },
      orderBy: { createdAt: "asc" },
      take:    20,
      select:  { role: true, content: true },
    })

    // Appel LLM
    const aiResp = await callOpenAI(history.map(m => ({ role: m.role, content: m.content })))

    // Sauvegarde la réponse IA
    const aiMessage = await prisma.aiMessage.create({
      data: {
        conversationId,
        role:       "assistant",
        content:    aiResp.content,
        confidence: aiResp.confidence,
        warning:    aiResp.warning,
        sources:    aiResp.sources,
      },
    })

    return { conversationId, message: aiMessage, response: aiResp }
  },

  async getAlerts(companyId: string, projectId?: string) {
    return prisma.aiAlert.findMany({
      where: {
        isResolved: false,
        project: { companyId },
        ...(projectId && { projectId }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, type: true, level: true, message: true,
        value: true, confidence: true, isRead: true, createdAt: true,
        project: { select: { id: true, name: true } },
      },
    })
  },

  async createAlert(data: CreateAlertInput) {
    return prisma.aiAlert.create({ data })
  },

  async markAlertRead(id: string, companyId: string) {
    const alert = await prisma.aiAlert.findFirst({ where: { id, project: { companyId } } })
    if (!alert) throw Object.assign(new Error("Alerte introuvable"), { status: 404 })
    return prisma.aiAlert.update({ where: { id }, data: { isRead: true } })
  },

  async resolveAlert(id: string, companyId: string) {
    const alert = await prisma.aiAlert.findFirst({ where: { id, project: { companyId } } })
    if (!alert) throw Object.assign(new Error("Alerte introuvable"), { status: 404 })
    return prisma.aiAlert.update({ where: { id }, data: { isResolved: true, resolvedAt: new Date() } })
  },

  async deleteConversation(id: string, userId: string) {
    const conv = await prisma.aiConversation.findFirst({ where: { id, userId } })
    if (!conv) throw Object.assign(new Error("Conversation introuvable"), { status: 404 })
    await prisma.aiConversation.delete({ where: { id } })
  },
}
