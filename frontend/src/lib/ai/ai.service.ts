/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — AI Service
   Abstraction LLM : OpenAI → facilement swappable vers Anthropic,
   Mistral, Azure OpenAI ou tout autre fournisseur.
───────────────────────────────────────────────────────────── */
import type { ChatMessage, ChatRequest, ChatResponse, LLMJsonResponse } from "@/types/chat"
import { buildSystemMessage, ENGIPILOT_CONTEXT } from "./prompt.engine"
import { ConversationMemory } from "./memory"

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const MODEL      = process.env.OPENAI_MODEL  ?? "gpt-4o-mini"
const TIMEOUT_MS = 30_000

/* ══════════════════════════════════════════════════════════════
   LLM CALL — compatible avec tout provider OpenAI-like
══════════════════════════════════════════════════════════════ */
async function callLLM(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw Object.assign(new Error("Clé API non configurée"), { code: "NO_API_KEY" })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(OPENAI_URL, {
      method:  "POST",
      signal:  controller.signal,
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           MODEL,
        messages,
        temperature:     0.3,       // bas = réponses déterministes, anti-hallucination
        max_tokens:      1500,
        response_format: { type: "json_object" },
      }),
    })

    if (res.status === 429) throw Object.assign(new Error("Rate limit OpenAI"), { code: "RATE_LIMIT" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw Object.assign(
        new Error(err?.error?.message ?? `OpenAI HTTP ${res.status}`),
        { code: "LLM_ERROR" }
      )
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ""
  } finally {
    clearTimeout(timer)
  }
}

/* ══════════════════════════════════════════════════════════════
   PARSE — extrait le JSON retourné par le LLM
══════════════════════════════════════════════════════════════ */
function parseLLMResponse(raw: string, mode: ChatRequest["mode"]): ChatResponse {
  try {
    const parsed: LLMJsonResponse = JSON.parse(raw)

    const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 75))
    const warning    = confidence < 70
      ? (parsed.warning ?? "⚠️ Niveau de confiance faible — vérifiez les informations critiques")
      : null

    return {
      content:    parsed.content    ?? raw,
      confidence,
      warning,
      sources:    Array.isArray(parsed.sources) ? parsed.sources : [],
      mode,
    }
  } catch {
    /* Le LLM n'a pas respecté le format JSON → on retourne le texte brut */
    return {
      content:    raw,
      confidence: 70,
      warning:    null,
      sources:    [],
      mode,
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   FALLBACK — réponses offline si pas de clé API
══════════════════════════════════════════════════════════════ */
function fallbackResponse(request: ChatRequest): ChatResponse {
  const last = request.messages[request.messages.length - 1]?.content?.toLowerCase() ?? ""
  const { mode } = request

  let content = ""

  if (mode === "pv") {
    const today = new Date().toLocaleDateString("fr-FR")
    content = `## PV — Réunion de chantier | ${today}

**1. PARTICIPANTS**
• Conducteur travaux · Chef de chantier · Représentants sous-traitants

**2. AVANCEMENT GÉNÉRAL**
• Avancement physique : conforme au planning
• Points RH : effectifs présents

**3. POINTS CRITIQUES**
🟠 À compléter selon vos données de chantier

**4. DÉCISIONS PRISES**
✓ À compléter lors de la réunion

**5. PROCHAINE RÉUNION**
À définir

_PV généré en mode hors-ligne — Complétez avec vos données réelles_`
  } else if (mode === "rapport") {
    content = `## Rapport d'avancement — Synthèse

**SYNTHÈSE EXECUTIVE**
Rapport généré en mode hors-ligne. Connectez votre clé API pour une analyse complète.

**KPIs À RENSEIGNER**
• SPI : — · CPI : — · EAC : —

**RECOMMANDATION**
→ Configurez \`OPENAI_API_KEY\` dans \`.env.local\` pour activer l'analyse IA complète`
  } else if (mode === "risques") {
    content = `## Analyse de Risques

🟠 **Mode hors-ligne**
L'analyse de risques complète nécessite la connexion au service IA.

**Risques standards BTP à surveiller :**
• 🔴 Retards fournisseurs → SPI < 0.85
• 🟠 Dépassements budgétaires → CPI < 0.90
• 🟡 Absentéisme équipes → > 20%
• 🟡 Non-conformités ouvertes → > 3 simultanées

→ Configurez l'API IA pour une analyse personnalisée de vos chantiers`
  } else {
    /* chat générique */
    if (last.includes("spi") || last.includes("retard") || last.includes("planning")) {
      content = `## Analyse planning — Indicateurs EVM

**Rappel des seuils standards :**
• SPI ≥ 1.0 → En avance sur le planning ✅
• SPI 0.9–1.0 → Léger retard 🟡
• SPI 0.8–0.9 → Retard modéré 🟠
• SPI < 0.8 → Retard critique 🔴

**Pour Usine Bouskoura** (données ENGIPILOT) :
SPI = 0.72 → Retard critique · +46j prédit

**Recommandations :**
→ Recruter 4 électriciens intérimaires
→ Fixer planning béton 2×/semaine
→ Clôturer NC-047 et NC-046

_Mode hors-ligne — Connectez l'API pour une analyse personnalisée_`
    } else if (last.includes("budget") || last.includes("cpi") || last.includes("coût")) {
      content = `## Analyse budgétaire — EVM

**Indicateurs clés :**
• CPI ≥ 1.0 → Sous budget ✅
• CPI 0.9–1.0 → Dépassement léger 🟡
• CPI < 0.85 → Dépassement critique 🔴

**Station Énergie Mohammedia** :
CPI = 0.74 → EAC projeté 283M MAD vs BAT 210M (+34.8%)

**Actions recommandées :**
→ Audit matériaux Zone C
→ Révision BAT avec maître d'ouvrage
→ Gel des dépenses non critiques

_Mode hors-ligne — Configurez OPENAI_API_KEY pour l'analyse complète_`
    } else {
      content = `## ENGIPILOT Copilot — Mode hors-ligne

Je fonctionne actuellement sans connexion au service IA.

**Pour activer l'IA complète :**
1. Obtenez une clé API sur platform.openai.com
2. Ajoutez \`OPENAI_API_KEY=sk-...\` dans \`.env.local\`
3. Redémarrez le serveur

**En attendant, je peux vous aider sur :**
→ Analyse SPI/CPI · Retards · Budgets
→ Génération de PV (mode hors-ligne)
→ Détection de risques standards BTP`
    }
  }

  return {
    content,
    confidence: 65,
    warning:    "⚠️ Mode hors-ligne — Clé API non configurée. Configurez OPENAI_API_KEY pour l'IA complète.",
    sources:    ["ENGIPILOT Offline"],
    mode,
  }
}

/* ══════════════════════════════════════════════════════════════
   SERVICE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  const { messages, mode } = request

  /* Pas de clé API → fallback immédiat */
  if (!process.env.OPENAI_API_KEY) return fallbackResponse(request)

  /* Construction de la liste de messages envoyée au LLM :
     1. Message système (rôle + instructions + mode)
     2. Contexte ENGIPILOT (données de la plateforme)
     3. Historique conversationnel purgé si trop long
  */
  const systemMsg: ChatMessage   = buildSystemMessage(mode)
  const contextMsg: ChatMessage  = { role: "user",      content: ENGIPILOT_CONTEXT }
  const contextAck: ChatMessage  = { role: "assistant", content: '{"content":"Contexte ENGIPILOT reçu. Prêt à analyser.","confidence":100,"warning":null,"sources":[]}' }

  const history   = ConversationMemory.pruneToTokenBudget(messages)
  const fullStack: ChatMessage[] = [systemMsg, contextMsg, contextAck, ...history]

  try {
    const raw      = await callLLM(fullStack)
    const response = parseLLMResponse(raw, mode)

    /* Sauvegarde en mémoire : dernier user msg + réponse IA */
    const userMsg = messages[messages.length - 1]
    if (userMsg?.role === "user") {
      ConversationMemory.append("global", [
        userMsg,
        { role: "assistant", content: response.content },
      ])
    }

    return response
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e?.code === "NO_API_KEY") return fallbackResponse(request)

    /* Erreur LLM → fallback avec message d'erreur */
    return {
      content:    `## Erreur de connexion IA\n\nImpossible de joindre le service IA : ${e?.message ?? "erreur inconnue"}\n\n→ Réessayez dans quelques instants.`,
      confidence: 0,
      warning:    `Erreur service IA : ${e?.code ?? "UNKNOWN"}`,
      sources:    [],
      mode,
    }
  }
}
