"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Send, Bot, User, Sparkles, MessageSquare, FileText,
  BarChart3, AlertTriangle, Plus, Clock, Building2,
  ChevronRight, Zap, Shield, TrendingUp, WifiOff,
  AlertCircle, CheckCircle2, RefreshCw,
} from "lucide-react"
import type { ChatMode, ChatMessage, ChatResponse } from "@/types/chat"

/* ═══════════════════════ TYPES UI ══════════════════════════ */
interface UIMessage {
  id:         number
  role:       "user" | "ai"
  content:    string
  time:       string
  confidence?: number
  warning?:   string | null
  sources?:   string[]
  isError?:   boolean
}

/* ═══════════════════════ CONFIG ════════════════════════════ */
const MODES: { id: ChatMode; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: "chat",    label: "Chat libre",       icon: MessageSquare, color: "#635BFF", desc: "Assistant conversationnel"  },
  { id: "pv",      label: "Générer PV",       icon: FileText,      color: "#14b8a6", desc: "PV réunion automatique"     },
  { id: "rapport", label: "Résumé Rapport",   icon: BarChart3,     color: "#8b5cf6", desc: "Synthèse et analyse"        },
  { id: "risques", label: "Détection Risques",icon: AlertTriangle, color: "#E2445C", desc: "Scan risques en temps réel" },
]

const MODE_SUGGESTIONS: Record<ChatMode, string[]> = {
  chat:    ["Analyse SPI/CPI chantiers actifs", "Prévoir la livraison Bouskoura", "Risques budget Résidence", "NC urgentes à clôturer", "Plan de rattrapage Bouskoura"],
  pv:      ["PV réunion hebdo chantier", "PV réception partielle R+3", "PV levée de réserves", "PV coordination sous-traitants"],
  rapport: ["Rapport avancement mai 2025", "Synthèse mensuelle direction", "Rapport financier Q2", "Tableau de bord EVM"],
  risques: ["Risques retard chantiers critiques", "Alertes HSE actives", "Prédire dépassements budget", "Chemin critique bloqué"],
}

const MODE_INIT: Record<ChatMode, string> = {
  chat: `## Bonjour, je suis ENGIPILOT Copilot 👋

J'ai analysé vos **12 chantiers actifs**. Voici un résumé :

🔴 **Usine Bouskoura** — SPI=0.72 · Retard +46j prédit (confiance 88%)
🟠 **Station Énergie** — CPI=0.74 · Dépassement EAC +34.8%
✅ **Villas Ain Diab** — SPI=1.04 · Performance excellente

Posez-moi une question sur vos chantiers, KPIs ou plannings.`,

  pv: `## Mode Génération de PV activé 📝

Je génère des **Procès-Verbaux professionnels** pour vos réunions BTP.

Précisez :
• Le type de réunion (hebdo, réception, coordination...)
• Le chantier concerné
• Les points principaux discutés

Je structurerai un PV complet et signable.`,

  rapport: `## Mode Synthèse de Rapport activé 📊

Je génère des rapports d'avancement structurés avec :
• KPIs EVM (SPI, CPI, EAC)
• Analyse des écarts
• Recommandations direction

Indiquez le rapport ou la période souhaitée.`,

  risques: `## Scan de Risques activé ⚠️

**3 risques critiques** détectés sur vos chantiers :
1. 🔴 Électricité Bouskoura — Retard +28j · Probabilité 94%
2. 🟠 Budget Résidence Al Andalous — CPI 0.87 · EAC +14.8%
3. 🟡 RH Tour Hassan — Absentéisme 34%

Demandez une analyse approfondie d'un risque spécifique.`,
}

const HISTORY_ITEMS = [
  { id: "h1", title: "Analyse SPI Bouskoura",  time: "Il y a 2h",  mode: "chat"    },
  { id: "h2", title: "PV réunion 12/05",        time: "Il y a 1j",  mode: "pv"      },
  { id: "h3", title: "Risques budget Q2",        time: "Il y a 2j",  mode: "risques" },
  { id: "h4", title: "Rapport avril 2025",       time: "Il y a 3j",  mode: "rapport" },
]

const CONTEXT_STATS = [
  { label: "Chantiers",  value: "12",    color: "text-primary", bg: "bg-primary/10" },
  { label: "KPIs",       value: "1 847", color: "text-success", bg: "bg-success/10" },
  { label: "Alertes",    value: "3",     color: "text-danger",  bg: "bg-danger/10"  },
  { label: "Précision",  value: "88.4%", color: "text-warning", bg: "bg-warning/10" },
]

const HISTORY_ICON: Record<string, React.ElementType> = {
  chat: MessageSquare, pv: FileText, rapport: BarChart3, risques: AlertTriangle,
}
const HISTORY_COLOR: Record<string, string> = {
  chat: "text-primary", pv: "text-teal", rapport: "text-purple-500", risques: "text-danger",
}

/* ═══════════════════════ RENDU MARKDOWN ════════════════════ */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderContent(text: string, isUser: boolean) {
  const safe = escapeHtml(text)
  const html = safe
    .replace(/## (.*)/g,          "<h3 class=\"font-black text-[15px] mb-2 mt-1\">$1</h3>")
    .replace(/\*\*(.*?)\*\*/g,    "<strong>$1</strong>")
    .replace(/^(→|✓|•)/gm,       "<span class=\"opacity-70\">$1</span>")
  return (
    <div
      className={`text-sm leading-relaxed whitespace-pre-line ${isUser ? "text-white" : "text-foreground"}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/* ═══════════════════════ BADGE CONFIANCE ═══════════════════ */
function ConfidenceBadge({ confidence, warning }: { confidence: number; warning?: string | null }) {
  const color = confidence >= 90 ? "text-success bg-success/10 border-success/20"
              : confidence >= 70 ? "text-primary bg-primary/10 border-primary/20"
              : "text-warning bg-warning/10 border-warning/20"
  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${color}`}>
        {confidence >= 90 ? <CheckCircle2 className="w-3 h-3" />
        : confidence >= 70 ? <TrendingUp className="w-3 h-3" />
        : <AlertCircle className="w-3 h-3" />}
        Confiance {confidence}%
      </div>
      {warning && (
        <p className="text-[10px] text-warning font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {warning}
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════ PAGE ══════════════════════════════ */
export default function ChatPage() {
  const [mode, setMode]         = useState<ChatMode>("chat")
  const [conversations, setConversations] = useState<Record<ChatMode, UIMessage[]>>({
    chat:    [{ id: 1, role: "ai", content: MODE_INIT.chat,    time: "08:00" }],
    pv:      [{ id: 2, role: "ai", content: MODE_INIT.pv,      time: "08:00" }],
    rapport: [{ id: 3, role: "ai", content: MODE_INIT.rapport, time: "08:00" }],
    risques: [{ id: 4, role: "ai", content: MODE_INIT.risques, time: "08:00" }],
  })
  /* Historique OpenAI format — 1 par mode */
  const [apiHistory, setApiHistory] = useState<Record<ChatMode, ChatMessage[]>>({
    chat: [], pv: [], rapport: [], risques: [],
  })
  const [input, setInput]   = useState("")
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "offline">("unknown")
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const messages = conversations[mode]

  /* Vérification statut API */
  useEffect(() => {
    fetch("/api/chat").then(r => r.json()).then((d: { hasKey?: boolean }) => {
      setApiStatus(d.hasKey ? "ok" : "offline")
    }).catch(() => setApiStatus("offline"))
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])
  useEffect(() => { inputRef.current?.focus() }, [mode])

  const now = () => new Date().toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })

  const switchMode = (m: ChatMode) => { setMode(m); setInput(""); setLoading(false) }

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput("")

    const ts = now()
    const userMsg: UIMessage = { id: Date.now(), role: "user", content: msg, time: ts }

    setConversations(prev => ({ ...prev, [mode]: [...prev[mode], userMsg] }))
    setLoading(true)

    /* Historique API mis à jour */
    const newHistory: ChatMessage[] = [
      ...apiHistory[mode],
      { role: "user", content: msg },
    ]

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory, mode } satisfies { messages: ChatMessage[]; mode: ChatMode }),
      })

      const data: ChatResponse = await res.json()

      const aiMsg: UIMessage = {
        id:         Date.now() + 1,
        role:       "ai",
        content:    data.content,
        time:       now(),
        confidence: data.confidence,
        warning:    data.warning,
        sources:    data.sources,
        isError:    !res.ok,
      }

      setConversations(prev => ({ ...prev, [mode]: [...prev[mode], aiMsg] }))
      setApiHistory(prev => ({
        ...prev,
        [mode]: [...newHistory, { role: "assistant", content: data.content }],
      }))
    } catch {
      const errMsg: UIMessage = {
        id:      Date.now() + 1,
        role:    "ai",
        content: "## Erreur de connexion\n\nImpossible de joindre le service IA. Vérifiez votre connexion et réessayez.",
        time:    now(),
        confidence: 0,
        warning: "Service IA inaccessible",
        isError: true,
      }
      setConversations(prev => ({ ...prev, [mode]: [...prev[mode], errMsg] }))
    } finally {
      setLoading(false)
    }
  }, [input, loading, mode, apiHistory])

  const resetConversation = () => {
    setConversations(prev => ({
      ...prev,
      [mode]: [{ id: Date.now(), role: "ai", content: MODE_INIT[mode], time: now() }],
    }))
    setApiHistory(prev => ({ ...prev, [mode]: [] }))
  }

  const activeCfg = MODES.find(m => m.id === mode)!

  return (
    <div className="flex flex-col page-enter" style={{ height: "calc(100vh - 56px - 48px)" }}>

      {/* ══ HEADER ══ */}
      <div className="flex-shrink-0 relative rounded-2xl overflow-hidden border border-border mb-4"
        style={{ background: "linear-gradient(135deg, #635BFF08 0%, #ffffff 40%, #8b5cf608 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
              <Bot className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Copilot IA
                </span>
                {apiStatus === "ok" ? (
                  <span className="text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> IA connectée
                  </span>
                ) : apiStatus === "offline" ? (
                  <span className="text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <WifiOff className="w-2.5 h-2.5" /> Mode hors-ligne
                  </span>
                ) : null}
              </div>
              <h1 className="text-base font-black text-foreground">ENGIPILOT IA Copilot</h1>
              <p className="text-xs text-muted-fg">Analyse KPIs · Génère PV · Détecte risques · {activeCfg.desc}</p>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {MODES.map(m => {
              const Icon = m.icon
              const active = m.id === mode
              return (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150
                    ${active ? "text-white border-transparent shadow-sm" : "bg-white border-border text-muted-fg hover:text-foreground hover:bg-muted/50"}`}
                  style={active ? { background: m.color, borderColor: m.color } : {}}
                >
                  <Icon className="w-3 h-3" strokeWidth={2.5} />
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">

          {/* Context */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-card">
            <p className="text-[10px] font-bold text-muted-fg uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Contexte IA
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONTEXT_STATS.map(c => (
                <div key={c.label} className={`${c.bg} rounded-xl p-2 text-center`}>
                  <p className={`text-sm font-black ${c.color}`}>{c.value}</p>
                  <p className="text-[9px] text-muted-fg font-medium mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-card">
            <p className="text-[10px] font-bold text-muted-fg uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Suggestions
            </p>
            <div className="space-y-1.5">
              {MODE_SUGGESTIONS[mode].map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="w-full text-left text-[11px] leading-snug bg-muted/50 border border-border px-2.5 py-2 rounded-xl
                             hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all duration-150
                             text-foreground flex items-start gap-1.5 disabled:opacity-50"
                >
                  <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-fg" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-card">
            <p className="text-[10px] font-bold text-muted-fg uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Historique
            </p>
            <div className="space-y-1.5">
              {HISTORY_ITEMS.map(h => {
                const HIcon = HISTORY_ICON[h.mode]
                return (
                  <div key={h.id} className="flex items-start gap-2 p-2 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors">
                    <HIcon className={`w-3 h-3 flex-shrink-0 mt-0.5 ${HISTORY_COLOR[h.mode]}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{h.title}</p>
                      <p className="text-[10px] text-muted-fg mt-0.5">{h.time}</p>
                    </div>
                  </div>
                )
              })}
              <button
                onClick={resetConversation}
                className="w-full flex items-center gap-1.5 text-[11px] text-muted-fg hover:text-primary transition-colors pt-1"
              >
                <Plus className="w-3 h-3" /> Nouvelle conversation
              </button>
            </div>
          </div>
        </div>

        {/* ── CHAT AREA ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-border rounded-2xl shadow-card overflow-hidden">

          {/* Mode bar */}
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-border flex items-center gap-2"
            style={{ background: `${activeCfg.color}06` }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${activeCfg.color}20` }}>
              <activeCfg.icon className="w-3.5 h-3.5" style={{ color: activeCfg.color }} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold" style={{ color: activeCfg.color }}>{activeCfg.label}</span>
            <span className="text-xs text-muted-fg">— {activeCfg.desc}</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={resetConversation}
                title="Nouvelle conversation"
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-fg hover:text-foreground"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-muted-fg font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {apiStatus === "ok" ? "GPT-4o-mini · Anti-hallucination" : "Mode hors-ligne"}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-background/40">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                    ${m.role === "ai" ? "" : "bg-white border border-border"}`}
                  style={m.role === "ai" ? { background: m.isError ? "#E2445C" : activeCfg.color } : {}}
                >
                  {m.role === "ai"
                    ? <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                    : <User className="w-3.5 h-3.5 text-muted-fg" strokeWidth={2} />
                  }
                </div>
                <div
                  className={`max-w-[76%] rounded-2xl px-4 py-3 shadow-card
                    ${m.role === "ai" ? "bg-white border border-border rounded-tl-sm" : "rounded-tr-sm text-white"}`}
                  style={m.role === "user" ? { background: activeCfg.color } : {}}
                >
                  {renderContent(m.content, m.role === "user")}
                  {m.role === "ai" && m.confidence !== undefined && (
                    <ConfidenceBadge confidence={m.confidence} warning={m.warning} />
                  )}
                  {m.role === "ai" && m.sources && m.sources.length > 0 && (
                    <p className="text-[9px] text-muted-fg/60 mt-1.5">
                      Sources : {m.sources.join(" · ")}
                    </p>
                  )}
                  <p className={`text-[10px] mt-1.5 ${m.role === "ai" ? "text-muted-fg" : "text-white/60"}`}>
                    {m.time}
                  </p>
                </div>
              </div>
            ))}

            {/* Indicateur de frappe */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: activeCfg.color }}>
                  <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                </div>
                <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-card">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-muted-fg/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-white">
            <div className="flex gap-2.5 items-center">
              <div className="flex-1 flex items-center gap-2 bg-muted border border-border rounded-xl px-4 py-2.5
                              focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                  disabled={loading}
                  placeholder={
                    mode === "pv"      ? "Décrivez la réunion ou demandez un PV..." :
                    mode === "rapport" ? "Indiquez le rapport ou la période..." :
                    mode === "risques" ? "Demandez une analyse de risque..." :
                    "Posez votre question sur les chantiers, KPIs..."
                  }
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-fg min-w-0 disabled:opacity-50"
                />
                <Shield className="w-3.5 h-3.5 text-muted-fg/40 flex-shrink-0" />
              </div>
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                           transition-all hover:scale-105 disabled:opacity-40 shadow-sm"
                style={{ background: activeCfg.color }}
              >
                <Send className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
            </div>
            <p className="text-[10px] text-muted-fg mt-1.5 text-center">
              ENGIPILOT Copilot · Anti-hallucination activé · Vérifiez les informations critiques
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
