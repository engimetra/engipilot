"use client"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import {
  BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  BarChart3, TrendingUp, Clock, AlertOctagon, Activity,
  ArrowUpRight, RefreshCw, Brain, Download,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { exportAnalyticsPDF, type AnalyticsPDFData } from "@/lib/pdf-export"

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  perfData:   { chantier: string; spi: number | null; cpi: number | null; score: number | null }[]
  budgetData: { chantier: string; prevu: number; reel: number }[]
  spiTrend:   { date: string; spi: number | null; cpi: number | null; progress: number | null }[]
  summary: {
    totalBudget:       number
    totalActual:       number
    budgetPct:         number
    avgProgress:       number
    avgSpi:            number | null
    totalProjects:     number
    incidentsByStatus: { status: string; count: number }[]
  }
}

async function fetchAnalytics(period: number): Promise<AnalyticsData> {
  const res = await fetch(`/api/analytics?period=${period}`)
  if (!res.ok) throw new Error("Impossible de charger les analytics")
  return res.json()
}

// ── Static fallbacks ───────────────────────────────────────────────────────────
const FALLBACK_SPI = [
  { m:"Jan", spi:0.98 }, { m:"Fév", spi:0.95 }, { m:"Mar", spi:0.91 },
  { m:"Avr", spi:0.89 }, { m:"Mai", spi:0.87 }, { m:"Jun", spi:0.94 },
]
const FALLBACK_BUDGET = [
  { chantier:"Résidence", prevu:1200, reel:1350 },
  { chantier:"Usine Bsk", prevu:2800, reel:3100 },
  { chantier:"Villas",    prevu:950,  reel:900  },
]
const FALLBACK_PERF = [
  { chantier:"Résidence", score:0.88 }, { chantier:"Usine Bsk", score:0.58 },
  { chantier:"Villas",    score:0.97 },
]

const INCIDENT_STATUS_MAP: Record<string, { label: string; fill: string }> = {
  OPEN:                { label:"En cours",    fill:"#E2445C" },
  UNDER_INVESTIGATION: { label:"Investigation", fill:"#FDAB3D" },
  ACTION_PENDING:      { label:"Action requis",  fill:"#8b5cf6" },
  RESOLVED:            { label:"Résolu",       fill:"#00C875" },
  CLOSED:              { label:"Clôturé",      fill:"#9CA3AF" },
}

const tooltipStyle = {
  background:"#fff", border:"1px solid #E5E7EB",
  borderRadius:10, fontSize:12, boxShadow:"0 4px 6px -1px rgba(0,0,0,0.07)",
}
const axisProps = { fill:"#9CA3AF", fontSize:11 }

const PERIODS: { label: string; value: 7 | 30 | 90 }[] = [
  { label: "7j",  value: 7  },
  { label: "30j", value: 30 },
  { label: "90j", value: 90 },
]

const INCIDENT_LABELS: Record<string, string> = {
  OPEN:                "En cours",
  UNDER_INVESTIGATION: "Investigation",
  ACTION_PENDING:      "Action requis",
  RESOLVED:            "Résolu",
  CLOSED:              "Clôturé",
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<7 | 30 | 90>(30)

  const { data, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["analytics", period],
    queryFn:  () => fetchAnalytics(period),
  })

  // ── Derived data ─────────────────────────────────────────────────────────────
  const spiChartData = data?.spiTrend?.length
    ? data.spiTrend.map(d => ({ m: d.date, spi: d.spi, alerte: 0.85, critique: 0.75 }))
    : FALLBACK_SPI.map(d => ({ ...d, alerte: 0.85, critique: 0.75 }))

  const budgetChartData = data?.budgetData?.length ? data.budgetData : FALLBACK_BUDGET
  const perfChartData   = data?.perfData?.length ? data.perfData : FALLBACK_PERF

  const ncData = data?.summary?.incidentsByStatus?.length
    ? data.summary.incidentsByStatus.map(i => ({
        name:  INCIDENT_STATUS_MAP[i.status]?.label ?? i.status,
        value: i.count,
        fill:  INCIDENT_STATUS_MAP[i.status]?.fill ?? "#9CA3AF",
      })).filter(d => d.value > 0)
    : [
        { name:"En cours",    value:38, fill:"#E2445C" },
        { name:"Résolu",      value:24, fill:"#00C875" },
        { name:"Clôturé",     value:20, fill:"#9CA3AF" },
        { name:"Investigation",value:11, fill:"#FDAB3D" },
        { name:"Action requis",value:7, fill:"#8b5cf6" },
      ]

  const totalIncidents = data?.summary?.incidentsByStatus?.reduce((s, i) => s + i.count, 0) ?? 14
  const avgProgress    = data?.summary?.avgProgress ?? 87
  const budgetPct      = data?.summary?.budgetPct ?? 87
  const avgSpi         = data?.summary?.avgSpi != null ? Number(data.summary.avgSpi).toFixed(2) : "—"

  function handleExportPDF() {
    if (!data) return
    const pdfData: AnalyticsPDFData = {
      period,
      totalProjects:  data.summary.totalProjects,
      avgProgress:    data.summary.avgProgress,
      avgSpi:         data.summary.avgSpi,
      budgetPct:      data.summary.budgetPct,
      totalBudget:    data.summary.totalBudget,
      totalActual:    data.summary.totalActual,
      totalIncidents,
      projects: data.budgetData.map((b, i) => ({
        name:  b.chantier,
        spi:   data.perfData[i]?.spi  ?? null,
        cpi:   data.perfData[i]?.cpi  ?? null,
        prevu: b.prevu,
        reel:  b.reel,
      })),
      incidentsByStatus: data.summary.incidentsByStatus.map(i => ({
        label: INCIDENT_LABELS[i.status] ?? i.status,
        count: i.count,
      })),
    }
    exportAnalyticsPDF(pdfData)
  }

  const KPIS = [
    {
      icon: TrendingUp,   label: "Avancement moyen",   value: isLoading ? "—" : `${avgProgress}%`,
      delta: "+4pts", up: true, accent: "#00C875",
      accentBg: "bg-success/10", accentText: "text-success",
      spark: [40,55,50,70,65,80,avgProgress, avgProgress],
    },
    {
      icon: Clock,        label: "SPI moyen",           value: isLoading ? "—" : avgSpi,
      delta: "≥ 0.85 OK", up: (data?.summary?.avgSpi ?? 0) >= 0.85, accent: "#635BFF",
      accentBg: "bg-primary/10", accentText: "text-primary",
      spark: [75,80,78,85,80,88,87,87],
    },
    {
      icon: Activity,     label: "Budget consommé",     value: isLoading ? "—" : `${budgetPct}%`,
      delta: `${budgetPct > 100 ? "+" + (budgetPct - 100) + "% dépassement" : "Dans budget"}`,
      up: budgetPct <= 100, accent: "#FDAB3D",
      accentBg: "bg-warning/10", accentText: "text-warning",
      spark: [60,65,70,75,78,82,86,budgetPct > 100 ? 100 : budgetPct],
    },
    {
      icon: AlertOctagon, label: "Incidents cumulés",   value: isLoading ? "—" : String(totalIncidents),
      delta: "tous statuts", up: totalIncidents < 10, accent: "#14b8a6",
      accentBg: "bg-teal/10", accentText: "text-teal",
      spark: [60,80,40,55,70,45,30,totalIncidents],
    },
  ]

  return (
    <div className="space-y-6 page-enter">

      {/* ══ HEADER ══ */}
      <div className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background:"linear-gradient(135deg, #FDAB3D08 0%, #ffffff 40%, #635BFF08 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage:"linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="relative px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <BarChart3 className="w-3 h-3" />
                {isLoading ? "…" : `${data?.summary?.totalProjects ?? 0} projets analysés`}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 rounded-full">
                <Brain className="w-3 h-3" /> Données réelles
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">Data Intelligence</h1>
            <p className="text-sm text-muted-fg mt-1">KPI avancés · EVM · SPI/CPI · Tous chantiers actifs</p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => refetch()}
              className="p-2 border border-border rounded-xl bg-white hover:bg-muted transition-colors text-muted-fg shadow-card"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!data || isLoading}
              className="flex items-center gap-1.5 border border-border bg-white hover:bg-muted text-foreground text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-card disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={() => router.push("/ia")}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Voir IA Monitor <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map(k => {
          const Icon = k.icon
          const max  = Math.max(...k.spark, 1)
          return (
            <div key={k.label} className="group relative bg-white border border-border rounded-2xl p-5 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
              <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: k.accent }} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.accentBg}`}>
                  <Icon className={`w-4 h-4 ${k.accentText}`} strokeWidth={2} />
                </div>
                <div className="flex items-end gap-[2px] h-7 w-14">
                  {k.spark.map((v, i) => (
                    <div key={i} className="flex-1 rounded-sm"
                      style={{ height:`${(v/max)*100}%`, background:k.accent, opacity:0.35+(i/k.spark.length)*0.65 }} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider mb-2">{k.label}</p>
              <p className="text-2xl font-black tracking-tight text-foreground">{k.value}</p>
              <div className={`mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                ${k.up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                <TrendingUp className="w-3 h-3" />
                {k.delta}
              </div>
            </div>
          )
        })}
      </div>

      {/* ══ CHARTS GRID ══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* SPI / CPI evolution */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-primary" />
            <h3 className="font-bold text-sm text-foreground">Évolution SPI — {period} jours</h3>
            <div className="ml-auto flex items-center gap-1">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                    period === p.value
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-fg hover:bg-border"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-fg mb-3 ml-3">Tous chantiers · Snapshots analytiques</p>
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            {[["#635BFF","SPI réel"],["#FDAB3D","Seuil alerte (0.85)"],["#E2445C","Seuil critique (0.75)"]].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded-full inline-block" style={{ background:c }} />
                <span className="text-muted-fg">{l}</span>
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={spiChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="m" tick={axisProps} axisLine={false} tickLine={false} />
              <YAxis domain={[0.6, 1.1]} tick={axisProps} tickFormatter={v => v.toFixed(2)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="spi"      stroke="#635BFF" strokeWidth={2.5} dot={{ r:4, fill:"#635BFF", strokeWidth:0 }} name="SPI" />
              <Line dataKey="alerte"   stroke="#FDAB3D" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Alerte" />
              <Line dataKey="critique" stroke="#E2445C" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Critique" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Budget vs réalisé — par projet */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-danger" />
            <h3 className="font-bold text-sm text-foreground">Budget vs Réalisé — par projet</h3>
          </div>
          <p className="text-xs text-muted-fg mb-3 ml-3">En milliers MAD</p>
          <div className="flex gap-4 mb-4 text-xs">
            {[["rgba(99,91,255,0.5)","Budget prévu"],["rgba(226,68,92,0.5)","Coût réel"]].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded inline-block" style={{ background:c }} />
                <span className="text-muted-fg">{l}</span>
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={budgetChartData} layout="vertical" margin={{ left:4, right:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={axisProps} tickFormatter={v => `${v}k`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="chantier" tick={axisProps} width={80} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}k MAD`]} />
              <Bar dataKey="prevu" fill="rgba(99,91,255,0.5)" name="Prévu"   radius={[0,4,4,0]} maxBarSize={10} />
              <Bar dataKey="reel"  fill="rgba(226,68,92,0.5)" name="Réalisé" radius={[0,4,4,0]} maxBarSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents par statut */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-warning" />
            <h3 className="font-bold text-sm text-foreground">Incidents par statut</h3>
          </div>
          {ncData.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-xs text-muted-fg">
              Aucun incident enregistré
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={ncData} cx={75} cy={75} innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {ncData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "incidents"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {ncData.map(d => (
                  <div key={d.name} className="flex items-center gap-2.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background:d.fill }} />
                    <span className="flex-1 text-muted-fg">{d.name}</span>
                    <span className="font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance score par chantier */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-success" />
            <h3 className="font-bold text-sm text-foreground">Score SPI par chantier</h3>
          </div>
          <p className="text-xs text-muted-fg mb-4 ml-3">Schedule Performance Index</p>
          {perfChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[190px] text-xs text-muted-fg">
              Aucune donnée SPI disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={perfChartData} layout="vertical" margin={{ left:4, right:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 1.2]} tick={axisProps} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="chantier" tick={axisProps} width={74} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v != null ? v.toFixed(2) : "—", "SPI"]} />
                <Bar dataKey="score" radius={[0,6,6,0]} maxBarSize={14}>
                  {perfChartData.map((e, i) => (
                    <Cell key={i}
                      fill={e.score == null ? "#9CA3AF" : e.score >= 0.85 ? "#00C875" : e.score >= 0.70 ? "#FDAB3D" : "#E2445C"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  )
}
