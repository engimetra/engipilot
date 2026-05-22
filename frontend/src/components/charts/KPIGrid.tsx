"use client"
import { Building2, TrendingUp, TrendingDown, Wallet, Clock, ShieldAlert, Bell } from "lucide-react"

export interface DashboardKpis {
  totalProjects:  number
  activeProjects: number
  avgProgress:    number
  avgSpi:         number | null
  criticalDelays: number
  incidentCount:  number
  notifCount:     number
  totalBudget:    number
  actualBudget:   number
  budgetPct:      number
}

interface KPICardProps {
  icon:       React.ElementType
  label:      string
  sublabel:   string
  value:      string
  delta?:     string
  deltaUp?:   boolean
  accent:     string
  accentBg:   string
  accentText: string
  sparkline?: number[]
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px] h-7 w-14">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height:     `${(v / max) * 100}%`,
            background: color,
            opacity:    i === data.length - 1 ? 1 : 0.35 + (i / data.length) * 0.55,
          }}
        />
      ))}
    </div>
  )
}

function KPICard({ icon: Icon, label, sublabel, value, delta, deltaUp, accent, accentBg, accentText, sparkline }: KPICardProps) {
  return (
    <div className="group relative bg-white border border-border rounded-2xl p-5 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: accent }} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBg}`}>
          <Icon className={accentText} strokeWidth={2} style={{ width: 18, height: 18 }} />
        </div>
        {sparkline && <Sparkline data={sparkline} color={accent} />}
      </div>
      <p className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[10px] text-muted-fg/60 mb-2 leading-none">{sublabel}</p>
      <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
      {delta && (
        <div className={`mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
          ${deltaUp ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {deltaUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta}
        </div>
      )}
    </div>
  )
}

function buildKpis(data?: DashboardKpis): KPICardProps[] {
  if (!data) {
    // Fallback statique si pas encore chargé
    return [
      { icon: Building2,  label: "Active Projects",  sublabel: "Company sites",      value: "—",   accent: "#635BFF", accentBg: "bg-primary/10", accentText: "text-primary",  sparkline: [1,1,1,1,1,1,1,1] },
      { icon: TrendingUp, label: "Global Progress",  sublabel: "Portfolio average",  value: "—",   accent: "#FDAB3D", accentBg: "bg-warning/10", accentText: "text-warning",  sparkline: [1,1,1,1,1,1,1,1] },
      { icon: Wallet,     label: "Budget Consumed",  sublabel: "Across all projects",value: "—",   accent: "#E2445C", accentBg: "bg-danger/10",  accentText: "text-danger",   sparkline: [1,1,1,1,1,1,1,1] },
      { icon: Clock,      label: "Critical Delays",  sublabel: "Sites requiring action",value: "—", accent: "#E2445C", accentBg: "bg-danger/10",  accentText: "text-danger",   sparkline: [1,1,1,1,1,1,1,1] },
      { icon: ShieldAlert,label: "HSE Incidents",    sublabel: "Open incidents",     value: "—",   accent: "#14b8a6", accentBg: "bg-teal/10",    accentText: "text-teal",     sparkline: [1,1,1,1,1,1,1,1] },
      { icon: Bell,       label: "Notifications",    sublabel: "Non lues",           value: "—",   accent: "#8b5cf6", accentBg: "bg-purple/10",  accentText: "text-purple",   sparkline: [1,1,1,1,1,1,1,1] },
    ]
  }

  const spiGood = data.avgSpi !== null && data.avgSpi >= 0.9
  return [
    {
      icon:       Building2,
      label:      "Active Projects",
      sublabel:   "Company sites",
      value:      String(data.activeProjects),
      delta:      `${data.totalProjects} total`,
      deltaUp:    true,
      accent:     "#635BFF",
      accentBg:   "bg-primary/10",
      accentText: "text-primary",
      sparkline:  [1, 1, 1, 2, 2, 2, 3, data.activeProjects].map(v => Math.max(v, 1)),
    },
    {
      icon:       TrendingUp,
      label:      "Global Progress",
      sublabel:   "Portfolio average",
      value:      `${data.avgProgress}%`,
      delta:      data.avgSpi !== null ? `SPI ${data.avgSpi.toFixed(2)}` : undefined,
      deltaUp:    spiGood,
      accent:     "#FDAB3D",
      accentBg:   "bg-warning/10",
      accentText: "text-warning",
      sparkline:  [data.avgProgress - 8, data.avgProgress - 6, data.avgProgress - 4, data.avgProgress - 2, data.avgProgress].map(v => Math.max(v, 1)),
    },
    {
      icon:       Wallet,
      label:      "Budget Consumed",
      sublabel:   "Across all projects",
      value:      `${data.budgetPct}%`,
      delta:      data.budgetPct > 75 ? "Attention budget" : "Dans les limites",
      deltaUp:    data.budgetPct <= 75,
      accent:     "#E2445C",
      accentBg:   "bg-danger/10",
      accentText: "text-danger",
      sparkline:  [data.budgetPct - 12, data.budgetPct - 9, data.budgetPct - 6, data.budgetPct - 3, data.budgetPct].map(v => Math.max(v, 1)),
    },
    {
      icon:       Clock,
      label:      "Critical Delays",
      sublabel:   "Sites requiring action",
      value:      String(data.criticalDelays),
      delta:      data.criticalDelays > 0 ? "Action requise" : "Tout en ordre",
      deltaUp:    data.criticalDelays === 0,
      accent:     "#E2445C",
      accentBg:   "bg-danger/10",
      accentText: "text-danger",
      sparkline:  [0, 0, 0, 0, 0, 0, 0, Math.max(data.criticalDelays, 0)].map(v => Math.max(v, 1)),
    },
    {
      icon:       ShieldAlert,
      label:      "HSE Incidents",
      sublabel:   "Open incidents",
      value:      String(data.incidentCount),
      delta:      data.incidentCount === 0 ? "No active incidents" : "Under investigation",
      deltaUp:    data.incidentCount === 0,
      accent:     "#14b8a6",
      accentBg:   "bg-teal/10",
      accentText: "text-teal",
      sparkline:  [0, 0, 0, 0, 0, 0, 0, Math.max(data.incidentCount, 0)].map(v => Math.max(v, 1)),
    },
    {
      icon:       Bell,
      label:      "Notifications",
      sublabel:   "Non lues",
      value:      String(data.notifCount),
      delta:      data.notifCount > 0 ? `${data.notifCount} en attente` : "Tout lu",
      deltaUp:    data.notifCount === 0,
      accent:     "#8b5cf6",
      accentBg:   "bg-purple/10",
      accentText: "text-purple",
      sparkline:  [0, 0, 0, 0, 0, 0, 0, Math.max(data.notifCount, 0)].map(v => Math.max(v, 1)),
    },
  ]
}

export function KPIGrid({ data }: { data?: DashboardKpis }) {
  const kpis = buildKpis(data)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map(kpi => <KPICard key={kpi.label} {...kpi} />)}
    </div>
  )
}
