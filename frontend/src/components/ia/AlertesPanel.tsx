"use client"
import { useRouter } from "next/navigation"
import { XCircle, AlertTriangle, CheckCircle2, Info, ArrowRight, Brain, Zap } from "lucide-react"

export interface DashboardAlert {
  id:         string
  type:       string
  level:      string
  message:    string
  value:      string | null
  confidence: number
  isRead:     boolean
  createdAt:  string
  project:    { id: string; name: string; city: string | null; country: string }
}

const LEVEL_STYLE: Record<string, { wrap: string; icon: string; badge: string; badgeBg: string; label: string }> = {
  CRITICAL: { wrap: "border-danger/20 bg-danger/[0.04] hover:bg-danger/[0.07]",   icon: "text-danger",  badge: "text-danger",  badgeBg: "bg-danger/10",  label: "CRITICAL" },
  HIGH:     { wrap: "border-orange-400/20 bg-orange-400/[0.04] hover:bg-orange-400/[0.07]", icon: "text-orange-500", badge: "text-orange-500", badgeBg: "bg-orange-100", label: "HIGH" },
  MEDIUM:   { wrap: "border-warning/20 bg-warning/[0.04] hover:bg-warning/[0.07]", icon: "text-warning", badge: "text-warning", badgeBg: "bg-warning/10", label: "WARNING" },
  LOW:      { wrap: "border-success/20 bg-success/[0.04] hover:bg-success/[0.07]", icon: "text-success", badge: "text-success", badgeBg: "bg-success/10", label: "LOW" },
  INFO:     { wrap: "border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.07]", icon: "text-primary", badge: "text-primary", badgeBg: "bg-primary/10", label: "INFO" },
}

function alertIcon(level: string) {
  if (level === "CRITICAL" || level === "HIGH") return XCircle
  if (level === "MEDIUM")  return AlertTriangle
  if (level === "LOW")     return CheckCircle2
  return Info
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h    = Math.floor(diff / 3_600_000)
  const m    = Math.floor(diff / 60_000)
  if (h > 0)  return `${h}h ago`
  if (m > 0)  return `${m}m ago`
  return "Just now"
}

// Alertes statiques de fallback si pas encore de données DB
const FALLBACK_ALERTS = [
  { id: "f1", level: "CRITICAL", message: "SPI critique détecté — action requise", value: "0.72", confidence: 92, isRead: false, createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(), type: "SPI_CRITICAL", project: { id: "p1", name: "Usine Bouskoura", city: "Bouskoura", country: "MA" } },
  { id: "f2", level: "MEDIUM",   message: "Dépassement budgétaire prévu",          value: "+12%", confidence: 78, isRead: false, createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(), type: "BUDGET_OVERRUN", project: { id: "p2", name: "Résidence Al Andalous", city: "Casablanca", country: "MA" } },
  { id: "f3", level: "LOW",      message: "Avancement dans les prévisions",         value: "1.05", confidence: 95, isRead: true,  createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(), type: "DELAY_RISK",    project: { id: "p3", name: "Villas Ain Diab",        city: "Casablanca", country: "MA" } },
] as DashboardAlert[]

export function AlertesPanel({ alerts }: { alerts?: DashboardAlert[] }) {
  const router  = useRouter()
  const items   = alerts && alerts.length > 0 ? alerts : FALLBACK_ALERTS
  const critical = items.filter(a => a.level === "CRITICAL" || a.level === "HIGH").length

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground leading-none">AI Risk Monitor</h3>
            <p className="text-[10px] text-muted-fg mt-0.5">Real-time · All sites</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {critical > 0 ? (
            <span className="text-[10px] font-bold bg-danger/10 text-danger px-2 py-0.5 rounded-full">
              {critical} CRITICAL
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-success/10 text-success px-2 py-0.5 rounded-full">
              All clear
            </span>
          )}
          <div className="flex items-center gap-1 text-[9px] text-muted-fg">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live monitoring
          </div>
        </div>
      </div>

      {/* AI strip */}
      <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2 mb-4">
        <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <p className="text-[10px] text-primary/80 font-medium">
          AI analysed <span className="font-black text-primary">{items.length}</span> active alert{items.length !== 1 ? "s" : ""} across your projects
        </p>
      </div>

      {/* Alerts list */}
      <div className="space-y-2.5 flex-1">
        {items.map(a => {
          const style = LEVEL_STYLE[a.level] ?? LEVEL_STYLE.INFO
          const Icon  = alertIcon(a.level)
          return (
            <div
              key={a.id}
              className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 hover:shadow-sm ${style.wrap}`}
              onClick={() => router.push("/ia")}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.icon}`} strokeWidth={2.5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${style.badgeBg} ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="text-[9px] text-muted-fg truncate">
                    {a.project.city ?? a.project.country} · {a.project.name}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{a.message}</p>
                {a.value && (
                  <p className="text-[10px] text-muted-fg mt-0.5">
                    Valeur: {a.value} · Confiance: {a.confidence}%
                  </p>
                )}
              </div>
              <span className="text-[9px] text-muted-fg font-mono flex-shrink-0 mt-0.5">
                {timeAgo(a.createdAt)}
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => router.push("/ia")}
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-primary font-semibold hover:text-primary-hover transition-colors pt-3 border-t border-border"
      >
        View all alerts <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
