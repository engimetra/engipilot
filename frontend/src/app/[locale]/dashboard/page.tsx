"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { ChartSkeleton, KPICardSkeleton } from "@/components/ui/Skeleton"
import type { DashboardKpis } from "@/components/charts/KPIGrid"
import type { DashboardAlert } from "@/components/ia/AlertesPanel"

/* Recharts + heavy chart logic chargés en lazy */
const KPIGrid      = dynamic(() => import("@/components/charts/KPIGrid").then(m => m.KPIGrid),
  { ssr: false, loading: () => <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><KPICardSkeleton key={i}/>)}</div> })
const AvancementChart = dynamic(() => import("@/components/charts/AvancementChart").then(m => m.AvancementChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-full" /> })
const BudgetChart  = dynamic(() => import("@/components/charts/BudgetChart").then(m => m.BudgetChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-full" /> })
const AlertesPanel = dynamic(() => import("@/components/ia/AlertesPanel").then(m => m.AlertesPanel),
  { ssr: false, loading: () => <ChartSkeleton height="h-full" /> })

import { useStore } from "@/store/useStore"
import {
  LayoutDashboard, Building2, SquareKanban, CalendarDays, FileText,
  FolderOpen, ShieldCheck, ClipboardCheck, Users, BarChart3, Brain,
  MessageSquare, Bell, CreditCard, RefreshCw, Globe, ArrowUpRight,
  TrendingUp, TrendingDown, ChevronRight, Zap, Activity, Download,
} from "lucide-react"
import { exportEvmPDF, type EvmPDFData } from "@/lib/pdf-export"

// ── Types ────────────────────────────────────────────────────────────────────
interface ApiProject {
  id:            string
  name:          string
  reference:     string
  status:        string
  type:          string
  progress:      number | string
  startDate:     string
  endDate:       string
  budgetInitial: number | string
  spi:           number | string | null
  cpi:           number | string | null
  city:          string | null
  country:       string
  clientName:    string | null
  members:       { user: { firstName: string; lastName: string } }[]
}

interface DashboardData {
  projects:  ApiProject[]
  alerts:    DashboardAlert[]
  kpis:      DashboardKpis
  portfolio: { onTrack: number; atRisk: number; critical: number; ahead: number; completed: number }
}

interface EvmData {
  projectId:   string
  projectName: string
  reference:   string
  bac:         number
  pv:          number
  ev:          number
  ac:          number
  cv:          number
  sv:          number
  spi:         number | null
  cpi:         number | null
  eac:         number
  vac:         number
  tcpi:        number | null
  progress:    number
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard")
  if (!res.ok) throw new Error("Impossible de charger le dashboard")
  return res.json()
}

async function fetchEvmKpis(id: string): Promise<EvmData> {
  const res = await fetch(`/api/projects/${id}/kpis/evm`)
  if (!res.ok) throw new Error("Impossible de charger les KPIs EVM")
  return res.json()
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PALETTE = ["#635BFF","#E2445C","#FDAB3D","#00C875","#8b5cf6","#0ea5e9","#f97316"]
const pickColor = (id: string) => PALETTE[id.charCodeAt(0) % PALETTE.length]

function riskFromSpi(spi: number | string | null): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  const s = spi !== null ? Number(spi) : null
  if (s === null)  return "LOW"
  if (s < 0.70)   return "CRITICAL"
  if (s < 0.80)   return "HIGH"
  if (s < 0.90)   return "MEDIUM"
  return "LOW"
}

function statusLabel(project: ApiProject): string {
  const spi = project.spi !== null ? Number(project.spi) : null
  if (project.status === "COMPLETED") return "AHEAD"
  if (spi !== null && spi > 1.02)     return "AHEAD"
  if (spi !== null && spi < 0.80)     return "CRITICAL"
  if (spi !== null && spi < 0.90)     return "AT RISK"
  return "ON TRACK"
}

function formatBudget(val: number | string): string {
  const n = Number(val)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M MAD"
  if (n >= 1_000)     return (n / 1_000).toFixed(0)     + "K MAD"
  return n.toFixed(0) + " MAD"
}

// ── Module tiles ──────────────────────────────────────────────────────────────
function buildModules(d?: DashboardData) {
  return [
    {
      id: "strategic", label: "Strategic Control", color: "#635BFF", colorBg: "bg-primary/8",
      items: [
        { href: "/dashboard",  icon: LayoutDashboard, name: "Global KPI Center",   desc: "Real-time performance",    badge: undefined,          danger: false },
        { href: "/analytics",  icon: BarChart3,        name: "Data Intelligence",   desc: "Advanced analytics & EVM", badge: undefined,          danger: false },
        { href: "/ia",         icon: Brain,            name: "AI Risk Monitor",     desc: "Predictive alerts",        badge: d ? d.alerts.filter(a=>!a.isRead).length || undefined : 3, danger: false },
      ],
    },
    {
      id: "operations", label: "Project Operations", color: "#14b8a6", colorBg: "bg-teal/8",
      items: [
        { href: "/chantiers", icon: Building2,    name: "Project Management",  desc: d ? `${d.kpis.activeProjects} active sites` : "Sites",    badge: d ? d.kpis.activeProjects || undefined : 12, danger: false },
        { href: "/planning",  icon: CalendarDays, name: "Global Scheduling",   desc: "Gantt & timelines",   badge: undefined, danger: false },
        { href: "/kanban",    icon: SquareKanban, name: "Workflow Board",      desc: "Task orchestration",  badge: undefined, danger: false },
      ],
    },
    {
      id: "compliance", label: "Compliance & Quality", color: "#E2445C", colorBg: "bg-danger/8",
      items: [
        { href: "/hse",       icon: ShieldCheck,    name: "Safety Compliance",  desc: "HSE incidents",        badge: d ? d.kpis.incidentCount || undefined : 2, danger: true  },
        { href: "/qualite",   icon: ClipboardCheck, name: "Quality Assurance",  desc: "NC management",        badge: undefined, danger: false },
        { href: "/rapports",  icon: FileText,       name: "Auto Reporting",     desc: "AI-generated reports", badge: undefined, danger: false },
        { href: "/documents", icon: FolderOpen,     name: "Document Hub",       desc: "DWG/PDF files",        badge: undefined, danger: false },
      ],
    },
    {
      id: "admin", label: "Administration", color: "#8b5cf6", colorBg: "bg-purple/8",
      items: [
        { href: "/facturation",  icon: CreditCard,   name: "Billing & Plans",  desc: "Plan actif",         badge: undefined, danger: false },
        { href: "/equipes",      icon: Users,         name: "Access Control",   desc: "Équipe",             badge: undefined, danger: false },
        { href: "/notifications",icon: Bell,          name: "Alert Center",     desc: "Notifications",      badge: d ? d.kpis.notifCount || undefined : 6, danger: true },
        { href: "/chat",         icon: MessageSquare, name: "AI Copilot",       desc: "Chat assistant",     badge: undefined, danger: false },
      ],
    },
  ]
}

// ── Risk styles ───────────────────────────────────────────────────────────────
const RISK_STYLE = {
  CRITICAL: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20", dot: "bg-danger", bar: "#E2445C" },
  HIGH:     { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20", dot: "bg-orange-500", bar: "#f97316" },
  MEDIUM:   { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", dot: "bg-warning", bar: "#FDAB3D" },
  LOW:      { bg: "bg-success/10", text: "text-success", border: "border-success/20", dot: "bg-success", bar: "#00C875" },
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "ON TRACK": { bg: "bg-success/10", text: "text-success" },
  "AT RISK":  { bg: "bg-warning/10", text: "text-warning" },
  "CRITICAL": { bg: "bg-danger/10",  text: "text-danger"  },
  "AHEAD":    { bg: "bg-primary/10", text: "text-primary" },
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router    = useRouter()
  const { user }  = useStore()
  const now       = new Date()
  const timeStr   = now.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit", hour12: false })
  const dateStr   = now.toLocaleDateString("fr-MA", { weekday: "short", day: "numeric", month: "short", year: "numeric" })

  const [evmProjectId, setEvmProjectId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn:  fetchDashboard,
  })

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-danger" />
        </div>
        <div>
          <p className="font-bold text-foreground">Impossible de charger le dashboard</p>
          <p className="text-sm text-muted-fg mt-1">
            {error instanceof Error ? error.message : "Erreur de connexion au serveur"}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    )
  }

  const modules        = buildModules(data)
  const projects       = data?.projects ?? []
  const activeEvmId    = evmProjectId ?? projects[0]?.id ?? null

  const { data: evm, isLoading: evmLoading } = useQuery<EvmData>({
    queryKey:  ["evm", activeEvmId],
    queryFn:   () => fetchEvmKpis(activeEvmId!),
    enabled:   !!activeEvmId,
    staleTime: 2 * 60 * 1000,
  })

  return (
    <div className="space-y-6 page-enter">

      {/* ══════════ HEADER ══════════ */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(135deg, #635BFF08 0%, #ffffff 40%, #14b8a608 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(#635BFF 1px, transparent 1px), linear-gradient(90deg, #635BFF 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <Globe className="w-3 h-3" /> Multi-country support
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-purple/10 text-purple border border-purple/20 px-2.5 py-1 rounded-full">
                <Brain className="w-3 h-3" /> AI-powered analytics
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-teal/10 text-teal border border-teal/20 px-2.5 py-1 rounded-full">
                <Zap className="w-3 h-3" /> Enterprise-ready
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight leading-tight mb-1">
              Global Construction Intelligence Platform
            </h1>
            <p className="text-sm text-muted-fg max-w-xl leading-relaxed">
              Supervision IA unifiée pour vos projets de construction.
              {user?.prenom ? <span className="text-foreground font-medium"> · Bienvenue, {user.prenom}.</span> : ""}
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end flex-shrink-0">
            <div className="flex items-center gap-3 flex-wrap lg:justify-end">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live · {timeStr}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                <Activity className="w-3 h-3" />
                {isLoading ? "…" : `${projects.length} projets actifs`}
              </div>
              <div className="text-xs text-muted-fg font-medium">{dateStr}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/chantiers")}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                Gérer les chantiers <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push("/ia")}
                className="flex items-center gap-1.5 bg-white hover:bg-muted border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Brain className="w-3.5 h-3.5 text-primary" /> Analyse IA
              </button>
              <button
                onClick={() => refetch()}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-muted transition-colors text-muted-fg"
                title="Rafraîchir"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ KPI GRID ══════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-primary" />
            <h2 className="text-sm font-bold text-foreground">Indicateurs de Performance</h2>
          </div>
          <span className="text-[10px] text-muted-fg font-medium uppercase tracking-wider">
            {isLoading ? "Chargement…" : "Données réelles · Base de données"}
          </span>
        </div>
        <KPIGrid data={data?.kpis} />
      </div>

      {/* ══════════ EVM SECTION ══════════ */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-teal" />
              <h2 className="text-sm font-bold text-foreground">Analyse EVM par Chantier</h2>
              <span className="text-[10px] font-bold bg-teal/10 text-teal border border-teal/20 px-2 py-0.5 rounded-full">
                Earned Value Management
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={activeEvmId ?? ""}
                onChange={e => setEvmProjectId(e.target.value)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 bg-white outline-none focus:border-primary shadow-card text-foreground"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {evm && (
                <button
                  onClick={() => {
                    const pdfData: EvmPDFData = {
                      projectName: evm.projectName,
                      bac: evm.bac, pv: evm.pv, ev: evm.ev, ac: evm.ac,
                      spi: evm.spi ?? 1, cpi: evm.cpi ?? 1,
                      cv: evm.cv, sv: evm.sv,
                      eac: evm.eac, vac: evm.vac, tcpi: evm.tcpi ?? 1,
                      progress: evm.progress,
                    }
                    exportEvmPDF(pdfData)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground shadow-card"
                  title="Exporter EVM en PDF"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              )}
            </div>
          </div>

          {evmLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <KPICardSkeleton key={i} />)}
            </div>
          )}

          {evm && !evmLoading && (
            <div className="space-y-3">
              {/* Valeurs budgétaires */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "BAC", sub: "Budget at Completion",  val: formatBudget(evm.bac), color: "#635BFF" },
                  { label: "PV",  sub: "Planned Value",          val: formatBudget(evm.pv),  color: "#8b5cf6" },
                  { label: "EV",  sub: "Earned Value",           val: formatBudget(evm.ev),  color: "#14b8a6" },
                  { label: "AC",  sub: "Actual Cost",            val: formatBudget(evm.ac),  color: "#FDAB3D" },
                  { label: "EAC", sub: "Estimate at Completion", val: formatBudget(evm.eac), color: evm.eac <= evm.bac ? "#00C875" : "#E2445C" },
                ].map(k => (
                  <div key={k.label} className="bg-white border border-border rounded-xl p-4 shadow-card">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-fg mb-0.5">{k.label}</p>
                    <p className="text-[9px] text-muted-fg/60 mb-2 leading-tight">{k.sub}</p>
                    <p className="text-base font-black text-foreground leading-none">{k.val}</p>
                    <div className="mt-2 h-0.5 rounded-full" style={{ background: k.color, opacity: 0.5 }} />
                  </div>
                ))}
              </div>

              {/* Indices de performance */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "SPI", sub: "Schedule Performance Index",
                    val:   evm.spi !== null ? evm.spi.toFixed(2) : "—",
                    up:    evm.spi !== null && evm.spi >= 1,
                    color: evm.spi !== null && evm.spi >= 1 ? "#00C875" : "#E2445C",
                    badge: evm.spi !== null
                      ? evm.spi >= 1 ? "En avance" : evm.spi >= 0.9 ? "Léger retard" : "Retard critique"
                      : "—",
                  },
                  {
                    label: "CPI", sub: "Cost Performance Index",
                    val:   evm.cpi !== null ? evm.cpi.toFixed(2) : "—",
                    up:    evm.cpi !== null && evm.cpi >= 1,
                    color: evm.cpi !== null && evm.cpi >= 1 ? "#00C875" : "#E2445C",
                    badge: evm.cpi !== null
                      ? evm.cpi >= 1 ? "Sous budget" : evm.cpi >= 0.9 ? "Léger dépassement" : "Dépassement critique"
                      : "—",
                  },
                  {
                    label: "CV", sub: "Cost Variance",
                    val:   (evm.cv >= 0 ? "+" : "-") + formatBudget(Math.abs(evm.cv)),
                    up:    evm.cv >= 0,
                    color: evm.cv >= 0 ? "#00C875" : "#E2445C",
                    badge: evm.cv >= 0 ? "Économie" : "Dépassement",
                  },
                  {
                    label: "SV", sub: "Schedule Variance",
                    val:   (evm.sv >= 0 ? "+" : "-") + formatBudget(Math.abs(evm.sv)),
                    up:    evm.sv >= 0,
                    color: evm.sv >= 0 ? "#00C875" : "#E2445C",
                    badge: evm.sv >= 0 ? "En avance" : "En retard",
                  },
                ].map(k => (
                  <div key={k.label} className="bg-white border border-border rounded-xl p-4 shadow-card">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-fg">{k.label}</p>
                        <p className="text-[9px] text-muted-fg/60 leading-tight">{k.sub}</p>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${k.up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                        {k.badge}
                      </span>
                    </div>
                    <p className="text-lg font-black leading-none" style={{ color: k.color }}>{k.val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ MODULE TILES ══════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-teal" />
            <h2 className="text-sm font-bold text-foreground">Modules Plateforme</h2>
          </div>
          <span className="text-[10px] text-muted-fg font-medium uppercase tracking-wider">4 catégories · 13 modules</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {modules.map(cat => (
            <div key={cat.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-fg">{cat.label}</span>
              </div>
              <div className="p-2 space-y-1">
                {cat.items.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all duration-150 group"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: `${cat.color}15` }}
                      >
                        <Icon className="w-4 h-4 transition-colors" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight">{item.name}</p>
                        <p className="text-[10px] text-muted-fg leading-tight mt-0.5 truncate">{item.desc}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.badge !== undefined && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center
                            ${item.danger ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-fg/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ PROJETS RÉELS ══════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-purple" />
            <h2 className="text-sm font-bold text-foreground">Projets Actifs</h2>
            {!isLoading && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {projects.length} projet{projects.length !== 1 ? "s" : ""} · données réelles
              </span>
            )}
          </div>
          <button
            onClick={() => router.push("/chantiers")}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Voir tous <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white border border-border rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-fg text-sm">
            Aucun projet actif. <button onClick={() => router.push("/chantiers")} className="text-primary font-semibold hover:underline">Créez votre premier projet</button>.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => {
            const risk        = riskFromSpi(p.spi)
            const status      = statusLabel(p)
            const riskStyle   = RISK_STYLE[risk]
            const statusStyle = STATUS_STYLE[status] ?? { bg: "bg-muted", text: "text-muted-fg" }
            const progress    = Number(p.progress)
            const spi         = p.spi !== null ? Number(p.spi) : null
            const cpi         = p.cpi !== null ? Number(p.cpi) : null
            const spiUp       = spi !== null && spi >= 1
            const cpiUp       = cpi !== null && cpi >= 1
            const color       = pickColor(p.id)
            const responsable = p.members[0]
              ? `${p.members[0].user.firstName} ${p.members[0].user.lastName}`
              : "—"

            return (
              <div
                key={p.id}
                className="bg-white border border-border rounded-2xl p-4 hover:shadow-card-md hover:-translate-y-0.5 hover:border-primary/25 transition-all duration-200 cursor-pointer group"
                onClick={() => router.push("/chantiers")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[9px] font-mono font-bold text-muted-fg bg-muted px-1.5 py-0.5 rounded">
                        {p.reference}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-[10px] text-muted-fg mt-0.5">{p.city ?? p.country} · {responsable}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      {status}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${riskStyle.dot}`} />
                      {risk} RISK
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-muted-fg font-medium">Avancement global</span>
                    <span className="font-black text-foreground">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, background: riskStyle.bar }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-muted/50 rounded-xl p-2 text-center">
                    <p className="text-[8px] text-muted-fg mb-0.5">SPI</p>
                    <div className="flex items-center justify-center gap-0.5">
                      {spi !== null
                        ? <>{spiUp ? <TrendingUp className="w-2.5 h-2.5 text-success"/> : <TrendingDown className="w-2.5 h-2.5 text-danger"/>}
                            <span className={`text-xs font-black ${spiUp ? "text-success" : "text-danger"}`}>{spi.toFixed(2)}</span></>
                        : <span className="text-xs font-black text-muted-fg">—</span>
                      }
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-2 text-center">
                    <p className="text-[8px] text-muted-fg mb-0.5">CPI</p>
                    <div className="flex items-center justify-center gap-0.5">
                      {cpi !== null
                        ? <>{cpiUp ? <TrendingUp className="w-2.5 h-2.5 text-success"/> : <TrendingDown className="w-2.5 h-2.5 text-danger"/>}
                            <span className={`text-xs font-black ${cpiUp ? "text-success" : "text-danger"}`}>{cpi.toFixed(2)}</span></>
                        : <span className="text-xs font-black text-muted-fg">—</span>
                      }
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-2 text-center">
                    <p className="text-[8px] text-muted-fg mb-0.5">Type</p>
                    <span className="text-[9px] font-black text-foreground">{p.type.slice(0,4)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border">
                  <div>
                    <p className="text-[8px] text-muted-fg">Budget initial</p>
                    <p className="text-xs font-bold text-foreground">{formatBudget(p.budgetInitial)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-fg/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════════ CHARTS ROW ══════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-warning" />
          <h2 className="text-sm font-bold text-foreground">Analytics & Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <AvancementChart />
          </div>
          <div>
            <AlertesPanel alerts={data?.alerts} />
          </div>
        </div>
      </div>

      {/* ══════════ BUDGET + PORTFOLIO ══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BudgetChart />

        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-sm text-foreground">Statut du Portfolio</h3>
            <button
              onClick={() => router.push("/analytics")}
              className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              Rapport complet <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-muted-fg mb-5">Répartition de vos projets actifs</p>

          <div className="space-y-4">
            {[
              {
                label: "En bonne voie", count: data?.portfolio.onTrack ?? 0,
                color: "bg-primary", bar: "#635BFF", text: "text-primary",
                pct: data ? Math.round((data.portfolio.onTrack / Math.max(data.projects.length, 1)) * 100) : 0,
              },
              {
                label: "En avance",    count: data?.portfolio.ahead ?? 0,
                color: "bg-success",  bar: "#00C875", text: "text-success",
                pct: data ? Math.round((data.portfolio.ahead / Math.max(data.projects.length, 1)) * 100) : 0,
              },
              {
                label: "À risque",     count: data?.portfolio.atRisk ?? 0,
                color: "bg-warning",  bar: "#FDAB3D", text: "text-warning",
                pct: data ? Math.round((data.portfolio.atRisk / Math.max(data.projects.length, 1)) * 100) : 0,
              },
              {
                label: "Critique",     count: data?.portfolio.critical ?? 0,
                color: "bg-danger",   bar: "#E2445C", text: "text-danger",
                pct: data ? Math.round((data.portfolio.critical / Math.max(data.projects.length, 1)) * 100) : 0,
              },
            ].map(s => (
              <div key={s.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-foreground font-medium text-sm">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-sm ${s.text}`}>{s.count}</span>
                    <span className="text-[10px] text-muted-fg font-medium">
                      {isLoading ? "…" : `/ ${data?.projects.length ?? 0}`}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, background: s.bar }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-3">
            {[
              { val: data ? String(data.projects.length) : "—", label: "Projets total",    color: "text-primary" },
              { val: data ? `${data.kpis.avgProgress}%`  : "—", label: "Avancement moyen", color: "text-success" },
              { val: data?.kpis.avgSpi !== null && data?.kpis.avgSpi !== undefined ? data.kpis.avgSpi.toFixed(2) : "—", label: "SPI moyen", color: "text-teal" },
            ].map(m => (
              <div key={m.label} className="text-center bg-muted/50 rounded-xl py-2.5 px-2">
                <p className={`text-base font-black ${m.color}`}>{m.val}</p>
                <p className="text-[9px] text-muted-fg font-medium mt-0.5 uppercase tracking-wide">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
