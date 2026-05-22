/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — Conversation Memory Manager
   Gestion de l'historique conversationnel côté serveur.
   En production → remplacer par Redis ou base de données.
───────────────────────────────────────────────────────────── */
import type { ChatMessage } from "@/types/chat"

const MAX_MESSAGES  = 20   // messages max par session (10 tours)
const MAX_SESSIONS  = 500  // sessions max en mémoire
const SESSION_TTL   = 60 * 60 * 1000  // 1h en ms

interface SessionEntry {
  messages:    ChatMessage[]
  lastAccess:  number
}

/* Map module-level : survit entre les requêtes dans le même processus.
   Pour serverless multi-instance → migrer vers Redis.            */
const store = new Map<string, SessionEntry>()

function evictExpired(): void {
  const now = Date.now()
  for (const [id, entry] of store.entries()) {
    if (now - entry.lastAccess > SESSION_TTL) store.delete(id)
  }
}

function evictOldest(): void {
  if (store.size < MAX_SESSIONS) return
  const oldest = [...store.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess)
  store.delete(oldest[0][0])
}

export const ConversationMemory = {
  /** Retourne l'historique d'une session (sans les messages système) */
  get(sessionId: string): ChatMessage[] {
    evictExpired()
    return store.get(sessionId)?.messages ?? []
  },

  /** Ajoute des messages à l'historique d'une session */
  append(sessionId: string, messages: ChatMessage[]): void {
    evictExpired()
    evictOldest()

    const entry = store.get(sessionId) ?? { messages: [], lastAccess: 0 }
    const updated = [...entry.messages, ...messages].slice(-MAX_MESSAGES)
    store.set(sessionId, { messages: updated, lastAccess: Date.now() })
  },

  /** Vide l'historique d'une session */
  clear(sessionId: string): void {
    store.delete(sessionId)
  },

  /** Nombre de messages stockés pour une session */
  size(sessionId: string): number {
    return store.get(sessionId)?.messages.length ?? 0
  },

  /** Prune les messages les plus anciens pour rester dans un budget de tokens.
   *  Garde toujours le premier message (contexte initial) + les N derniers.  */
  pruneToTokenBudget(messages: ChatMessage[], maxChars = 12_000): ChatMessage[] {
    let total = messages.reduce((acc, m) => acc + m.content.length, 0)
    if (total <= maxChars) return messages

    const result = [...messages]
    // Supprime depuis le début (messages les plus anciens, hors index 0)
    while (total > maxChars && result.length > 2) {
      const removed = result.splice(1, 1)[0]
      total -= removed.content.length
    }
    return result
  },
}
