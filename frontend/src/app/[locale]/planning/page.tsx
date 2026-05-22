"use client"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { GanttChart, type GanttLot } from "@/components/gantt/GanttChart"
import { ImportMsProject } from "@/components/planning/ImportMsProject"
import { exportRapportPDF } from "@/lib/pdf-export"
import {
  Printer, CheckCircle2, X, CalendarDays,
  AlertTriangle, TrendingDown, Flag, Clock,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────
interface ApiProject {
  id:        string
  name:      string
  reference: string
  status:    string
  startDate: string
  endDate:   string
  progress:  number
}

interface GanttJalon {
  label: string
  date:  string
  done:  boolean
}

interface GanttData {
  project: { id: string; name: string; startDate: string; endDate: string; progress: number; spi: number }
  lots:    GanttLot[]
  jalons:  GanttJalon[]
  todayPct: number
  kpis: {
    dureeMois:        number
    totalLots:        number
    lotsEnRetard:     number
    jalonsAtteints:   number
    totalJalons:      number
    retardCumule:     number
    achevementPredit: string
  }
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease]">
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function PlanningPage() {
  const [projetId, setProjetId] = useState("")
  const [toast,    setToast]    = useState("")

  // ── Fetch projects list ───────────────────────────────────────────────────────
  const { data: projets = [] } = useQuery<ApiProject[]>({
    queryKey: ["projects"],
    queryFn:  () => fetch("/api/projects").then(r => r.json()),
  })

  useEffect(() => {
    if (!projetId && projets.length > 0) setProjetId(projets[0].id)
  }, [projets, projetId])

  // ── Fetch Gantt data for selected project ─────────────────────────────────────
  const { data: gantt, isLoading: ganttLoading } = useQuery<GanttData>({
    queryKey: ["gantt", projetId],
    queryFn:  () => fetch(`/api/projects/${projetId}/gantt`).then(r => r.json()),
    enabled:  !!projetId,
    staleTime: 2 * 60_000,
  })

  const projet  = projets.find(p => p.id === projetId)
  const kpis    = gantt?.kpis
  const jalons  = gantt?.jalons ?? []

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function exportPDF() {
    if (!projet || !gantt) return
    const win = window.open("", "_blank", "width=800,height=600")
    if (!win) return

    const jalonsRows = jalons.map(j =>
      `<tr><td>${j.label}</td><td>${j.date}</td><td class="${j.done ? "ok" : "ko"}">${j.done ? "✓ Atteint" : "En attente"}</td></tr>`
    ).join("")

    const content = `
      <html><head><title>Planning Gantt — ${projet.name}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:30px;color:#1F2937}
        h1{font-size:20px;border-bottom:2px solid #635BFF;padding-bottom:8px;color:#635BFF}
        h2{font-size:13px;color:#635BFF;margin-top:20px;text-transform:uppercase;letter-spacing:1px}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th{background:#F3F4F6;text-align:left;padding:6px 10px;font-size:11px;text-transform:uppercase;color:#6B7280}
        td{padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:12px}
        .ok{color:#00C875;font-weight:bold}.ko{color:#E2445C}.warn{color:#FDAB3D}
        .footer{margin-top:40px;font-size:10px;color:#9CA3AF}
      </style></head>
      <body>
        <h1>📅 Planning Gantt — ${projet.name}</h1>
        <p style="color:#9CA3AF;font-size:12px">Exporté le ${new Date().toLocaleDateString("fr-FR")} · Vue ${kpis?.dureeMois ?? "—"} mois</p>
        <h2>KPIs Planning</h2>
        <table><tr><th>Indicateur</th><th>Valeur</th></tr>
          <tr><td>Durée totale</td><td>${kpis?.dureeMois ?? "—"} mois</td></tr>
          <tr><td>Retard cumulé</td><td class="${(kpis?.retardCumule ?? 0) > 0 ? "warn" : "ok"}">${(kpis?.retardCumule ?? 0) > 0 ? "+" + kpis!.retardCumule + " jours" : "Aucun"}</td></tr>
          <tr><td>Lots en retard</td><td class="${(kpis?.lotsEnRetard ?? 0) > 0 ? "ko" : "ok"}">${kpis?.lotsEnRetard ?? 0} / ${kpis?.totalLots ?? 0}</td></tr>
          <tr><td>Jalons atteints</td><td class="warn">${kpis?.jalonsAtteints ?? 0} / ${kpis?.totalJalons ?? 0}</td></tr>
          <tr><td>Achèvement prédit</td><td class="ko">${kpis?.achevementPredit ?? "—"}</td></tr>
        </table>
        <h2>Jalons</h2>
        <table><tr><th>Jalon</th><th>Date</th><th>Statut</th></tr>
          ${jalonsRows || "<tr><td colspan='3' style='color:#9CA3AF'>Aucun jalon</td></tr>"}
        </table>
        <div class="footer">Généré par ENGIPILOT · ${new Date().toLocaleString("fr-FR")}</div>
      </body></html>
    `
    win.document.write(content)
    win.document.close()
    setTimeout(() => win.print(), 400)
    showToast("Export PDF prêt")
  }

  // ── KPI card config ───────────────────────────────────────────────────────────
  const KPI_CARDS = [
    {
      icon:      CalendarDays,
      label:     "Durée totale",
      value:     ganttLoading ? "…" : `${kpis?.dureeMois ?? "—"} mois`,
      accent:    "#635BFF", accentBg: "bg-primary/10", accentText: "text-primary",
    },
    {
      icon:      AlertTriangle,
      label:     "Retard cumulé",
      value:     ganttLoading ? "…" : (kpis?.retardCumule ?? 0) > 0 ? `+${kpis!.retardCumule}j` : "Aucun",
      accent:    "#FDAB3D", accentBg: "bg-warning/10", accentText: "text-warning",
    },
    {
      icon:      TrendingDown,
      label:     "Lots en retard",
      value:     ganttLoading ? "…" : `${kpis?.lotsEnRetard ?? 0} / ${kpis?.totalLots ?? 0}`,
      accent:    "#E2445C", accentBg: "bg-danger/10",  accentText: "text-danger",
    },
    {
      icon:      Flag,
      label:     "Jalons atteints",
      value:     ganttLoading ? "…" : `${kpis?.jalonsAtteints ?? 0} / ${kpis?.totalJalons ?? 0}`,
      accent:    "#FDAB3D", accentBg: "bg-warning/10", accentText: "text-warning",
    },
    {
      icon:      Clock,
      label:     "Tâches totales",
      value:     ganttLoading ? "…" : String(kpis?.totalLots ?? 0),
      accent:    "#8b5cf6", accentBg: "bg-purple/10",  accentText: "text-purple",
    },
    {
      icon:      CalendarDays,
      label:     "Achèvement prédit",
      value:     ganttLoading ? "…" : kpis?.achevementPredit ?? "—",
      accent:    "#E2445C", accentBg: "bg-danger/10",  accentText: "text-danger",
    },
  ]

  const retardLabel = (kpis?.retardCumule ?? 0) > 0
    ? `Retard +${kpis!.retardCumule}j`
    : "Dans les délais"
  const retardClass = (kpis?.retardCumule ?? 0) > 0 ? "danger" : "success"

  return (
    <div className="space-y-6 page-enter">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      {/* ══ HEADER ══ */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(135deg, #FDAB3D08 0%, #ffffff 40%, #635BFF08 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 rounded-full">
                <CalendarDays className="w-3 h-3" />
                {ganttLoading ? "…" : `${kpis?.dureeMois ?? "—"} mois`}
              </span>
              {(kpis?.retardCumule ?? 0) > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> {retardLabel}
                </span>
              )}
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">
              Planning Gantt — {projet?.name ?? "…"}
            </h1>
            <p className="text-sm text-muted-fg mt-1">
              {ganttLoading
                ? "Chargement…"
                : `${kpis?.lotsEnRetard ?? 0} lot(s) en retard · ${kpis?.jalonsAtteints ?? 0}/${kpis?.totalJalons ?? 0} jalons atteints`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <select
                value={projetId}
                onChange={e => setProjetId(e.target.value)}
                className="appearance-none bg-white border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-semibold outline-none
                           focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer shadow-card text-foreground"
              >
                {projets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {projetId && <ImportMsProject projectId={projetId} />}
            <button
              onClick={exportPDF}
              disabled={!gantt}
              className="flex items-center gap-2 bg-white hover:bg-muted border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-40"
            >
              <Printer className="w-3.5 h-3.5 text-primary" /> Exporter PDF
            </button>
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_CARDS.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="group relative bg-white border border-border rounded-2xl p-4 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
              <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: k.accent }} />
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${k.accentBg}`}>
                <Icon className={`w-3.5 h-3.5 ${k.accentText}`} strokeWidth={2} />
              </div>
              <p className="text-[9px] font-semibold text-muted-fg uppercase tracking-wider mb-0.5">{k.label}</p>
              <p className={`text-base font-black ${k.accentText}`}>{k.value}</p>
            </div>
          )
        })}
      </div>

      {/* ══ GANTT ══ */}
      <GanttChart
        lots={gantt?.lots ?? []}
        todayPct={gantt?.todayPct ?? 50}
        projectName={projet?.name}
      />

      {/* ══ JALONS ══ */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-4 rounded-full bg-primary" />
          <h3 className="font-bold text-sm text-foreground">Jalons du projet</h3>
          <span className="ml-auto text-[10px] text-muted-fg font-medium">
            {kpis?.jalonsAtteints ?? 0}/{kpis?.totalJalons ?? jalons.length} atteints
          </span>
        </div>

        {jalons.length === 0 ? (
          <p className="text-sm text-muted-fg text-center py-6">
            Aucun jalon — ajoutez le tag <code className="bg-muted px-1 rounded text-xs">jalon</code> à une tâche ou complétez des tâches
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-3 pl-6">
              {jalons.map((j, i) => (
                <div key={i} className="relative flex items-center gap-4">
                  <div className={`absolute -left-6 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center
                    ${j.done
                      ? "bg-success border-success"
                      : i === jalons.findIndex(jj => !jj.done)
                        ? "bg-white border-warning animate-pulse"
                        : "bg-white border-border"}`}>
                    {j.done && <span className="text-white text-[6px] font-black">✓</span>}
                  </div>
                  <div className={`flex-1 flex items-center justify-between p-3 rounded-xl border transition-all
                    ${j.done
                      ? "bg-success/[0.04] border-success/20"
                      : i === jalons.findIndex(jj => !jj.done)
                        ? "bg-warning/[0.04] border-warning/20"
                        : "bg-muted/30 border-border/50"}`}>
                    <div className="flex items-center gap-2">
                      {j.done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" strokeWidth={2.5} />
                        : <Clock className="w-3.5 h-3.5 text-muted-fg flex-shrink-0" strokeWidth={2} />
                      }
                      <span className={`text-sm font-semibold ${j.done ? "text-foreground" : "text-muted-fg"}`}>
                        {j.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className="text-xs font-mono text-muted-fg">{j.date}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full
                        ${j.done ? "bg-success/10 text-success" : "bg-muted text-muted-fg"}`}>
                        {j.done ? "Atteint" : "En attente"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
