/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — Chat IA Types
   Compatible OpenAI Chat Completions API format
───────────────────────────────────────────────────────────── */

export type ChatMode = "chat" | "pv" | "rapport" | "risques"

export type MessageRole = "user" | "assistant" | "system"

/** Format OpenAI-compatible — envoyé à l'API */
export interface ChatMessage {
  role:    MessageRole
  content: string
}

/** Corps de la requête POST /api/chat */
export interface ChatRequest {
  messages: ChatMessage[]   // historique complet incl. nouveau msg
  mode:     ChatMode
}

/** Réponse structurée de l'API */
export interface ChatResponse {
  content:    string        // texte markdown de la réponse
  confidence: number        // 0-100
  warning:    string | null // affiché si confidence < 70
  sources:    string[]      // ex: ["EVM Standards", "ENGIPILOT Data"]
  mode:       ChatMode
}

/** Format JSON retourné par le LLM */
export interface LLMJsonResponse {
  content:    string
  confidence: number
  warning:    string | null
  sources:    string[]
}

/** Erreur API normalisée */
export interface ChatApiError {
  error:     string
  code:      "NO_API_KEY" | "LLM_ERROR" | "PARSE_ERROR" | "RATE_LIMIT" | "UNKNOWN"
  fallback?: string
}
