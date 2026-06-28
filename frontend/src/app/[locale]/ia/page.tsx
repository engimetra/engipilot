"use client"
import { useState } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import {
  Brain, Zap, Calendar, Wallet, AlertOctagon, CheckCircle2,
  Cpu, TrendingUp, Activity, ArrowUpRight, Loader2, WifiOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/Skeleton"

const AILivePredictiveSystem = dynamic(
  () => import("@/components/ia/AILivePredictiveSystem"),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-2xl" /> }
)

/* ── Types ── */
type SignalType = "RETARD" | "BUDGET" | "ANOMALIE" | "POSITIF" | "SYNC"

interface LiveSignal {
  id: string
  type: SignalType
  chantier: string
  message: string
  confiance: number
  ts: string
}

interface SignalsResponse {
  signals: LiveSignal[]
  metrics: {
    spi: number | null
    cpi: number | null
    signals: number
    uptime: number
  }
  isEmpty: boolean
}

/* ── Static config (règles métier, styles) — ce ne sont pas des données fictives ── */
const REGLES = [
  { cond: "SPI < 0.80",     action: "Alerte retard critique + notification chef projet" },
  { cond: "CPI < 0.85",     action: "Alerte dépassement + révision EAC automatique" },
  { cond: "Absence > 20%",  action: "Alerte RH + suggestion recrutement intérimaires" },
  { cond: "NC ouvertes > 3",action: "Blocage avancement + alerte contrôle qualité" },
  { cond: "Incident HSE",   action: "Arrêt tâches liées + rapport déclaratif automatique" },
]

const ML_MODULES = [
  { nom: "Prédiction retards",  type: "Gradient Boosting", color: "#635BFF" },
  { nom: "Prédiction coûts",    type: "Random Forest",     color: "#00C875" },
  { nom: "Détection anomalies", type: "Isolation Forest",  color: "#8b5cf6" },
  { nom: "Clustering perf.",    type: "K-Means",           color: "#FDAB3D" },
]

const NIVEAU_CONFIG: Record<string, { wrap: string; badge: string; dot: string }> = {
  CRITIQUE: { wrap: "border-danger/20 bg-danger/[0.04]",   badge: "bg-danger/10 text-danger",   dot: "bg-danger"  },
  MAJEUR:   { wrap: "border-warning/20 bg-warning/[0.04]", badge: "bg-warning/10 text-warning", dot: "bg-warning" },
  OK:       { wrap: "border-success/20 bg-success/[0.04]", badge: "bg-success/10 text-success", dot: "bg-success" },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  RETARD: Calendar, BUDGET: Wallet, ANOMALIE: AlertOctagon, POSITIF: CheckCircle2, SYNC: Activity,
}
const TYPE_COLOR: Record<string, string> = {
  RETARD: "#E2445C", BUDGET: "#E2445C", ANOMALIE: "#FDAB3D", POSITIF: "#00C875", SYNC: "#635BFF",
}

function signalNiveau(type: SignalType): "CRITIQUE" | "MAJEUR" | "OK" {
  if (type === "RETARD" || type === "BUDGET") return "CRITIQUE"
  if (type === "ANOMALIE") return "MAJEUR"
  if (type === "POSITIF") return "OK"
  return "MAJEUR"
}

/* ── Fetch ── */
async function fetchSignals(): Promise<SignalsResponse> {
  const res = await fetch("/api/intelligence/signals", { credentials: "include" })
  if (!res.ok) throw new Error(`signals ${res.status}`)
  return res.json() as Promise<SignalsResponse>
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="border border-border rounded-2xl p-4 animate-pulse space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-muted rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-4/5" />
    </div>
  )
}

export default function IAPage() {
  const router = useRouter()
  const [activeRules, setActiveRules] = useState<boolean[]>(REGLES.map(() => true))

  const { data, isLoading, isError } = useQuery<SignalsResponse>({
    queryKey: ["ia-signals"],
    queryFn: fetchSignals,
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
  })

  /* Dériver les stats depuis les vraies données */
  const signals      = data?.signals.filter(s => s.type !== "SYNC") ?? []
  const critiques    = signals.filter(s => s.type === "RETARD" || s.type === "BUDGET").length
  const anomalies    = signals.filter(s => s.type === "ANOMALIE").length
  const positifs     = signals.filter(s => s.type === "POSITIF").length
  const totalSignals = data?.metrics.signals ?? 0
  const avgConfiance = signals.length > 0
    ? Math.round(signals.reduce((s, x) => s + x.confiance, 0) / signals.length)
    : null
  const chantiersUniques = new Set(signals.map(s => s.chantier)).size

  const kpiCards = [
    {
      icon: Zap,
      label: "Signaux actifs",
      sublabel: "Détectés en direct",
      value: isLoading ? "—" : String(totalSignals),
      accent: "#635BFF", accentBg: "bg-primary/10", accentText: "text-primary",
    },
    {
      icon: AlertOctagon,
      label: "Alertes critiques",
      sublabel: "Action requise",
      value: isLoading ? "—" : String(critiques),
      accent: "#E2445C", accentBg: "bg-danger/10", accentText: "text-danger",
    },
    {
      icon: Calendar,
      label: "Anomalies détectées",
      sublabel: "HSE + NC + budget",
      value: isLoading ? "—" : String(anomalies),
      accent: "#FDAB3D", accentBg: "bg-warning/10", accentText: "text-warning",
    },
    {
      icon: CheckCircle2,
      label: "Confiance moyenne",
      sublabel: "Tous signaux",
      value: isLoading ? "—" : avgConfiance !== null ? `${avgConfiance}%` : "N/A",
      accent: "#00C875", accentBg: "bg-success/10", accentText: "text-success",
    },
  ]

  return (
    <div className="space-y-6 page-enter">

      {/* ══ AI LIVE PREDICTIVE SYSTEM ══ */}
      <AILivePredictiveSystem />

      {/* ══ HEADER ══ */}
      <div className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(135deg, #8b5cf608 0%, #ffffff 40%, #635BFF08 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <Brain className="w-3 h-3" />
                {isLoading ? "Chargement…" : `${ML_MODULES.length} modules IA`}
              </span>
              {critiques > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-2.5 py-1 rounded-full">
                  <AlertOctagon className="w-3 h-3" /> {critiques} alerte{critiques > 1 ? "s" : ""} critique{critiques > 1 ? "s" : ""}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full">
                <Activity className="w-3 h-3" /> Live
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">AI Risk Monitor</h1>
            <p className="text-sm text-muted-fg mt-1">
              {isLoading
                ? "Analyse en cours…"
                : data?.isEmpty
                ? "Aucun projet actif — connectez un projet pour démarrer l'analyse"
                : `${chantiersUniques} chantier${chantiersUniques !== 1 ? "s" : ""} analysé${chantiersUniques !== 1 ? "s" : ""} · Alertes prédictives · Modèles ML en production`}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => router.push("/analytics")}
              className="flex items-center gap-2 bg-white hover:bg-muted border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Analytics
            </button>
            <button
              onClick={() => router.push("/notifications")}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Voir toutes les alertes <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="group relative bg-white border border-border rounded-2xl p-5 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
              <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: k.accent }} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.accentBg}`}>
                  <Icon className={`w-4 h-4 ${k.accentText}`} strokeWidth={2} />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider mb-0.5">{k.label}</p>
              <p className="text-[10px] text-muted-fg/60 mb-2">{k.sublabel}</p>
              {isLoading
                ? <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                : <p className="text-2xl font-black tracking-tight text-foreground">{k.value}</p>}
            </div>
          )
        })}
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Alertes intelligentes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-danger" />
            <h2 className="text-sm font-bold text-foreground">Alertes intelligentes</h2>
            <span className="ml-auto text-[10px] text-muted-fg font-medium">
              {isLoading ? "…" : `${signals.length} signal${signals.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {isError && (
            <div className="border border-border rounded-2xl p-8 flex flex-col items-center gap-3 bg-white shadow-card">
              <WifiOff className="w-8 h-8 text-muted-fg" />
              <p className="text-sm font-semibold text-foreground">Connexion backend indisponible</p>
              <p className="text-xs text-muted-fg text-center">Les alertes réapparaîtront dès la reconnexion.</p>
            </div>
          )}

          {!isLoading && !isError && signals.length === 0 && (
            <div className="border border-success/20 bg-success/[0.04] rounded-2xl p-8 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <p className="text-sm font-semibold text-foreground">Aucune alerte active</p>
              <p className="text-xs text-muted-fg text-center">
                {data?.isEmpty
                  ? "Aucun projet actif dans le système."
                  : "Tous les projets sont dans les normes."}
              </p>
            </div>
          )}

          {!isLoading && !isError && signals.length > 0 && (
            <div className="space-y-3">
              {signals.map(sig => {
                const niveau = signalNiveau(sig.type)
                const cfg = NIVEAU_CONFIG[niveau] ?? { wrap: "border-border bg-white", badge: "bg-muted text-muted-fg", dot: "bg-muted" }
                const Icon = TYPE_ICON[sig.type] ?? Activity
                const iconColor = TYPE_COLOR[sig.type] ?? "#635BFF"
                return (
                  <div key={sig.id} className={`border rounded-2xl p-4 shadow-card transition-all hover:shadow-card-md ${cfg.wrap}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: iconColor + "15" }}>
                        <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <p className="font-bold text-sm text-foreground truncate">{sig.chantier}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {niveau}
                            </span>
                            <span className="text-[10px] font-mono text-muted-fg">{sig.confiance}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-fg leading-relaxed">{sig.message}</p>
                        <p className="text-[9px] text-muted-fg/50 mt-1">{sig.ts}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-purple" />
              <h2 className="text-sm font-bold text-foreground">Modules ML actifs</h2>
            </div>
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="space-y-4">
                {ML_MODULES.map(m => (
                  <div key={m.nom} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{m.nom}</p>
                      <p className="text-[10px] text-muted-fg">{m.type}</p>
                    </div>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      Actif
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
                <div className="text-center bg-muted/50 rounded-xl py-2 px-1">
                  {isLoading
                    ? <div className="h-4 w-8 bg-muted rounded mx-auto animate-pulse" />
                    : <p className="text-sm font-black text-primary">{totalSignals}</p>}
                  <p className="text-[9px] text-muted-fg font-medium mt-0.5">Signaux</p>
                </div>
                <div className="text-center bg-muted/50 rounded-xl py-2 px-1">
                  {isLoading
                    ? <div className="h-4 w-8 bg-muted rounded mx-auto animate-pulse" />
                    : <p className="text-sm font-black text-success">{avgConfiance !== null ? `${avgConfiance}%` : "—"}</p>}
                  <p className="text-[9px] text-muted-fg font-medium mt-0.5">Confiance</p>
                </div>
                <div className="text-center bg-muted/50 rounded-xl py-2 px-1">
                  {isLoading
                    ? <div className="h-4 w-8 bg-muted rounded mx-auto animate-pulse" />
                    : <p className="text-sm font-black text-teal">{chantiersUniques || "—"}</p>}
                  <p className="text-[9px] text-muted-fg font-medium mt-0.5">Chantiers</p>
                </div>
              </div>
              {data?.metrics && (data.metrics.spi !== null || data.metrics.cpi !== null) && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {data.metrics.spi !== null && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl py-2 px-3 text-center">
                      <p className="text-xs font-black text-primary">SPI {data.metrics.spi.toFixed(2)}</p>
                      <p className="text-[9px] text-muted-fg">Schedule Perf.</p>
                    </div>
                  )}
                  {data.metrics.cpi !== null && (
                    <div className="bg-teal/5 border border-teal/10 rounded-xl py-2 px-3 text-center">
                      <p className="text-xs font-black text-teal">CPI {data.metrics.cpi.toFixed(2)}</p>
                      <p className="text-[9px] text-muted-fg">Cost Perf.</p>
                    </div>
                  )}
                </div>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-fg">
                  <Loader2 className="w-3 h-3 animate-spin" /> Récupération des métriques…
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-teal" />
              <h2 className="text-sm font-bold text-foreground">Règles IA actives</h2>
              <span className="ml-auto text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                {activeRules.filter(Boolean).length}/{REGLES.length} actives
              </span>
            </div>
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] text-muted-fg font-medium">Conditions Si/Alors déclenchant les alertes</p>
              </div>
              <div className="divide-y divide-border">
                {REGLES.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-bold text-primary">Si</span>{" "}
                        <span className="text-foreground font-medium">{r.cond}</span>
                      </p>
                      <p className="text-[10px] text-muted-fg mt-0.5 leading-relaxed">→ {r.action}</p>
                    </div>
                    <button
                      onClick={() => setActiveRules(prev => prev.map((a, j) => j === i ? !a : a))}
                      className={`w-9 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 ${activeRules[i] ? "bg-primary" : "bg-border"}`}
                    >
                      <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
                        style={{ left: activeRules[i] ? "calc(100% - 18px)" : "2px" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
