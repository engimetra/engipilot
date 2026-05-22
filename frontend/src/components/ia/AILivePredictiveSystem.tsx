"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Brain, Zap, Activity, AlertOctagon, CheckCircle2, TrendingDown, Cpu, Radio, Wifi } from "lucide-react"

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

interface Metrics {
  spi: number
  cpi: number
  signals: number
  uptime: number
}

/* ── Config ── */
const SIGNAL_CONFIG: Record<SignalType, { color: string; bg: string; text: string; icon: React.ElementType; dot: string }> = {
  RETARD:   { color: "#E2445C", bg: "bg-danger/10",  text: "text-danger",  icon: AlertOctagon, dot: "bg-danger"  },
  BUDGET:   { color: "#FDAB3D", bg: "bg-warning/10", text: "text-warning", icon: TrendingDown, dot: "bg-warning" },
  ANOMALIE: { color: "#8b5cf6", bg: "bg-violet-100", text: "text-violet-600", icon: Cpu,       dot: "bg-violet-500" },
  POSITIF:  { color: "#00C875", bg: "bg-success/10", text: "text-success", icon: CheckCircle2, dot: "bg-success" },
  SYNC:     { color: "#635BFF", bg: "bg-primary/10", text: "text-primary", icon: Wifi,         dot: "bg-primary" },
}

const SIGNAL_POOL: Omit<LiveSignal, "id" | "ts">[] = [
  { type: "RETARD",   chantier: "Usine Bouskoura",            message: "SPI=0.71 → retard critique détecté",          confiance: 88 },
  { type: "BUDGET",   chantier: "Station Énergie Mohammedia", message: "CPI=0.74 → dépassement EAC projeté +34%",     confiance: 91 },
  { type: "ANOMALIE", chantier: "Résidence Al Andalous",      message: "Béton Zone C ×1.34 vs norme",                 confiance: 84 },
  { type: "POSITIF",  chantier: "Villas Ain Diab",            message: "SPI=1.04 — livraison dans les délais",        confiance: 95 },
  { type: "SYNC",     chantier: "Système central",            message: "Resynchronisation modèles ML terminée",        confiance: 100 },
  { type: "RETARD",   chantier: "Centre Commercial Hay Riad", message: "Lot Plomberie : 12j d'écart sur planning",    confiance: 79 },
  { type: "BUDGET",   chantier: "Complexe Sportif Rabat",     message: "Matériaux acier +22% vs budget initial",      confiance: 86 },
  { type: "POSITIF",  chantier: "Éco-Quartier Témara",        message: "NC-031 levée — qualité conformée",            confiance: 93 },
  { type: "ANOMALIE", chantier: "Tour Business Casablanca",   message: "Présence équipe réduite de 31% détectée",     confiance: 81 },
  { type: "SYNC",     chantier: "Cluster Nord",               message: "12 chantiers recalibrés — prédictions à jour",confiance: 100 },
]

function makeId() { return Math.random().toString(36).slice(2) }
function nowStr() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}
function randomSignal(): LiveSignal {
  const base = SIGNAL_POOL[Math.floor(Math.random() * SIGNAL_POOL.length)]
  return { ...base, id: makeId(), ts: nowStr() }
}

/* ── SparkLine ── */
function SparkLine({ values, color }: { values: number[]; color: string }) {
  const w = 80
  const h = 28
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ")
  const lastX = w
  const lastY = h - ((values[values.length - 1] - min) / range) * (h - 4) - 2
  return (
    <svg width={w} height={h} className="overflow-visible flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  )
}

/* ── Main component ── */
export default function AILivePredictiveSystem() {
  const [signals, setSignals] = useState<LiveSignal[]>(() => [randomSignal(), randomSignal(), randomSignal()])
  const [tick, setTick]       = useState(0)
  const [pulse, setPulse]     = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({ spi: 0.87, cpi: 0.91, signals: 1847, uptime: 99.97 })
  const [sparkData, setSparkData] = useState({
    spi: [0.82, 0.83, 0.85, 0.84, 0.86, 0.87, 0.87],
    cpi: [0.88, 0.89, 0.90, 0.91, 0.90, 0.91, 0.91],
    sig: [1700, 1740, 1780, 1800, 1820, 1840, 1847],
  })

  /* Ref pour lire les métriques actuelles dans le callback sans stale closure */
  const metricsRef = useRef(metrics)
  useEffect(() => { metricsRef.current = metrics }, [metrics])

  const feedRef = useRef<HTMLDivElement>(null)

  const tick$ = useCallback(() => {
    setPulse(true)
    setTimeout(() => setPulse(false), 600)

    setSignals(prev => [randomSignal(), ...prev].slice(0, 12))
    setTick(t => t + 1)

    setMetrics(prev => {
      const next: Metrics = {
        spi:     Math.max(0.70, Math.min(1.05, prev.spi     + (Math.random() - 0.48) * 0.012)),
        cpi:     Math.max(0.70, Math.min(1.10, prev.cpi     + (Math.random() - 0.48) * 0.010)),
        signals: prev.signals + Math.floor(Math.random() * 8 + 2),
        uptime:  Math.min(100, prev.uptime + (Math.random() - 0.3) * 0.01),
      }
      /* Mettre à jour sparkData ici avec les valeurs fraîches */
      setSparkData(sp => ({
        spi: [...sp.spi.slice(-6), +next.spi.toFixed(2)],
        cpi: [...sp.cpi.slice(-6), +next.cpi.toFixed(2)],
        sig: [...sp.sig.slice(-6), next.signals],
      }))
      return next
    })
  }, [])

  /* Intervalle unique — ne se recrée jamais */
  useEffect(() => {
    const id = setInterval(tick$, 3500)
    return () => clearInterval(id)
  }, [tick$])

  /* Auto-scroll */
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [tick])

  const critiques = signals.filter(s => s.type === "RETARD" || s.type === "BUDGET").length
  const spiColor  = metrics.spi  >= 0.9 ? "#00C875" : metrics.spi  >= 0.8 ? "#FDAB3D" : "#E2445C"
  const cpiColor  = metrics.cpi  >= 0.95 ? "#00C875" : metrics.cpi >= 0.85 ? "#FDAB3D" : "#E2445C"

  return (
    <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #635BFF08 0%, #ffffff 100%)" }}>
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          {pulse && (
            <span className="absolute -inset-1 rounded-xl animate-ping bg-primary/20 pointer-events-none" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground tracking-tight">AI Live Predictive System</p>
          <p className="text-[10px] text-muted-fg">
            Flux temps réel · ML inference engine · {metrics.signals.toLocaleString("fr")} signaux traités
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            LIVE
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-2.5 py-1 rounded-full">
            <AlertOctagon className="w-3 h-3" />
            {critiques} critiques
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* ── Live feed ── */}
        <div className="lg:col-span-2">
          <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
            <p className="text-xs font-bold text-foreground">Flux de signaux temps réel</p>
            <span className="ml-auto text-[10px] text-muted-fg font-mono tabular-nums">{tick} événements</span>
          </div>
          <div ref={feedRef} className="divide-y divide-border/50 max-h-80 overflow-y-auto scroll-smooth">
            {signals.map((s, i) => {
              const cfg  = SIGNAL_CONFIG[s.type]
              const Icon = cfg.icon
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30 ${i === 0 ? "bg-primary/[0.025]" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.text}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-foreground truncate">{s.chantier}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                        {s.type}
                      </span>
                      {i === 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          NOUVEAU
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-fg mt-0.5 leading-snug">{s.message}</p>
                    <p className="text-[10px] text-muted-fg/50 mt-0.5 font-mono">{s.ts} · Confiance {s.confiance}%</p>
                  </div>
                  <div className="flex-shrink-0 w-0.5 h-12 rounded-full mt-0.5 opacity-30" style={{ background: cfg.color }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Live metrics ── */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-foreground flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Métriques live
          </p>

          {/* SPI */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end gap-2">
              <div>
                <p className="text-[10px] text-muted-fg font-semibold uppercase tracking-wider">SPI Moyen</p>
                <p className="text-lg font-black tabular-nums" style={{ color: spiColor }}>
                  {metrics.spi.toFixed(2)}
                </p>
              </div>
              <SparkLine values={sparkData.spi} color={spiColor} />
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(metrics.spi * 100, 100)}%`, background: spiColor }} />
            </div>
          </div>

          {/* CPI */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end gap-2">
              <div>
                <p className="text-[10px] text-muted-fg font-semibold uppercase tracking-wider">CPI Moyen</p>
                <p className="text-lg font-black tabular-nums" style={{ color: cpiColor }}>
                  {metrics.cpi.toFixed(2)}
                </p>
              </div>
              <SparkLine values={sparkData.cpi} color={cpiColor} />
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(metrics.cpi * 100, 100)}%`, background: cpiColor }} />
            </div>
          </div>

          {/* Signals */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end gap-2">
              <div>
                <p className="text-[10px] text-muted-fg font-semibold uppercase tracking-wider">Signaux / jour</p>
                <p className="text-lg font-black text-primary tabular-nums">
                  {metrics.signals.toLocaleString("fr")}
                </p>
              </div>
              <SparkLine values={sparkData.sig} color="#635BFF" />
            </div>
          </div>

          {/* Uptime */}
          <div className="pt-3 border-t border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-fg font-semibold uppercase tracking-wider">Uptime ML Engine</p>
              <p className="text-xs font-black text-success tabular-nums">{metrics.uptime.toFixed(2)}%</p>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-success transition-all duration-1000"
                style={{ width: `${metrics.uptime}%` }} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Modèles actifs", val: "3 / 4", color: "text-primary"  },
              { label: "Chantiers",      val: "12",     color: "text-teal"     },
              { label: "Alertes/h",      val: `${critiques * 2 + 3}`, color: "text-warning" },
              { label: "Précision moy.", val: "89%",    color: "text-success"  },
            ].map(s => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-2.5 text-center">
                <p className={`text-sm font-black ${s.color}`}>{s.val}</p>
                <p className="text-[9px] text-muted-fg mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Waveform */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-0.5 items-end h-6">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-primary"
                  style={{
                    height: `${40 + Math.sin((tick * 0.9 + i) * 0.7) * 35}%`,
                    opacity: 0.35 + Math.abs(Math.sin((tick * 0.9 + i) * 0.5)) * 0.55,
                    transition: "height 0.4s ease",
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-fg font-mono">inference active</p>
            <Zap className="w-3 h-3 text-primary ml-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
