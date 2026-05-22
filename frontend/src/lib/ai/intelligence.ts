/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — Intelligence Core : Orchestrateur central
   Coordonne Chat IA, Module IA, Analytics et Alertes en parallèle
───────────────────────────────────────────────────────────── */
import { processChat }     from "./ai.service"
import { aiModule,         type ProjectData,           type AIInsight  } from "./module"
import { analyticsEngine,  type ProjectAnalyticsInput, type AnalyticsOutput } from "./analytics"
import { alertEngine,      type AlertInput,            type Alert      } from "./alerts"
import type { ChatMessage, ChatMode } from "@/types/chat"

/* ── Types ── */

export interface IntelligenceInput {
  message:  string
  mode?:    ChatMode
  context?: ChatMessage[]
  data:     ProjectData
  project:  ProjectAnalyticsInput & AlertInput
}

export interface IntelligenceSummary {
  totalInsights:  number
  criticalAlerts: number
  riskLevel:      string
  confidence:     number
}

export interface IntelligenceOutput {
  chat:      string
  insights:  AIInsight[]
  analytics: AnalyticsOutput
  alerts:    Alert[]
  summary:   IntelligenceSummary
}

/* ── Orchestrateur ── */

export async function intelligenceCore(input: IntelligenceInput): Promise<IntelligenceOutput> {
  const messages: ChatMessage[] = [
    ...(input.context ?? []),
    { role: "user", content: input.message },
  ]

  /* Toutes les analyses tournent en parallèle — seul le chat est async */
  const [chatResponse, insights, analytics, alerts] = await Promise.all([
    processChat({ messages, mode: input.mode ?? "chat" }),
    Promise.resolve(aiModule(input.data)),
    Promise.resolve(analyticsEngine(input.project)),
    Promise.resolve(alertEngine(input.project)),
  ])

  const criticalAlerts = alerts.filter(a => a.level === "HIGH").length

  return {
    chat:      chatResponse.content,
    insights,
    analytics,
    alerts,
    summary: {
      totalInsights:  insights.length,
      criticalAlerts,
      riskLevel:      analytics.riskLevel,
      confidence:     chatResponse.confidence,
    },
  }
}

/* ── Exports nommés pour usage indépendant des sous-modules ── */
export { aiModule }        from "./module"
export { analyticsEngine } from "./analytics"
export { alertEngine }     from "./alerts"
