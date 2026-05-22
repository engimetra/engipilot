"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { X, Plus, AlertTriangle, ShieldCheck, Users, ShieldAlert, Clock, TrendingDown, CheckCircle2 } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiProject { id: string; name: string; reference: string }

interface Incident {
  id:               string
  type:             string
  description:      string
  dateIncident:     string
  lieu:             string | null
  gravite:          "MINEUR" | "MAJEUR" | "CRITIQUE" | "HAUT"
  statut:           "EN_COURS" | "RESOLUE"
  nombreJoursArret: number | null
  nombreBlesses:    number | null
  projetId:         string
  createdAt:        string
}

interface KpisHSE {
  tf: number; tg: number
  accidents: number; presquAccidents: number
  enCours: number; heuresSansAccident: number
}

// ── UI config ─────────────────────────────────────────────────────────────────
const GRAVITE_STYLE: Record<string, { bg: string; text: string }> = {
  CRITIQUE: { bg: "bg-danger/10",  text: "text-danger"  },
  HAUT:     { bg: "bg-warning/10", text: "text-warning" },
  MAJEUR:   { bg: "bg-warning/10", text: "text-warning" },
  MOYEN:    { bg: "bg-primary/10", text: "text-primary" },
  MINEUR:   { bg: "bg-success/10", text: "text-success" },
}

const MATRIX_STYLE: Record<string, { bg: string; label: string }> = {
  critique: { bg: "bg-danger/30",  label: "C" },
  haut:     { bg: "bg-warning/25", label: "H" },
  moyen:    { bg: "bg-primary/15", label: "M" },
  faible:   { bg: "bg-success/15", label: "F" },
}

type MatrixLevel = keyof typeof MATRIX_STYLE
function matrixLevel(row: number, col: number): MatrixLevel {
  const l = row + col
  if (l >= 7) return "critique"
  if (l >= 5) return "haut"
  if (l >= 3) return "moyen"
  return "faible"
}

const TYPE_LABELS: Record<string, string> = {
  PRESQU_ACCIDENT:      "Presqu'accident",
  ACCIDENT_SANS_ARRET:  "Accident sans arrêt",
  ACCIDENT_ARRET:       "Accident avec arrêt",
  MALADIE_PRO:          "Maladie professionnelle",
}

const FORM_INIT = {
  type:    "PRESQU_ACCIDENT",
  desc:    "",
  lieu:    "",
  gravite: "MINEUR" as "MINEUR" | "MAJEUR" | "CRITIQUE",
  date:    new Date().toISOString().slice(0, 10),
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchProjects(): Promise<ApiProject[]> {
  const res = await fetch("/api/projects")
  if (!res.ok) return []
  return res.json()
}

async function fetchIncidents(projectId: string): Promise<Incident[]> {
  const res = await fetch(`/api/incidents?projectId=${projectId}`)
  if (!res.ok) throw new Error("Erreur chargement incidents")
  return res.json()
}

async function fetchKpis(projectId: string): Promise<KpisHSE> {
  const res = await fetch(`/api/projects/${projectId}/kpis/hse`)
  if (!res.ok) throw new Error("Erreur KPIs HSE")
  return res.json()
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease] ${ok ? "bg-success" : "bg-danger"}`}>
      {ok ? <ShieldCheck className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HSEPage() {
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState("")
  const [tab, setTab]             = useState("incidents")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(FORM_INIT)
  const [errors, setErrors]       = useState<Partial<typeof FORM_INIT>>({})
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  const { data: projects = [] } = useQuery<ApiProject[]>({
    queryKey: ["projects"],
    queryFn:  fetchProjects,
  })

  useEffect(() => {
    if (!projectId && projects.length > 0) setProjectId(projects[0].id)
  }, [projects, projectId])

  const activeProjectId = projectId || projects[0]?.id || ""

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents", activeProjectId],
    queryFn:  () => fetchIncidents(activeProjectId),
    enabled:  !!activeProjectId,
    staleTime: 30_000,
  })

  const { data: kpis } = useQuery({
    queryKey: ["kpis-hse", activeProjectId],
    queryFn:  () => fetchKpis(activeProjectId),
    enabled:  !!activeProjectId,
    staleTime: 60_000,
  })

  const declareMutation = useMutation({
    mutationFn: async (data: typeof FORM_INIT) => {
      const res = await fetch("/api/incidents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:    activeProjectId,
          type:         data.type,
          description:  data.desc,
          dateIncident: data.date,
          lieu:         data.lieu,
          gravite:      data.gravite,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur déclaration")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents", activeProjectId] })
      queryClient.invalidateQueries({ queryKey: ["kpis-hse", activeProjectId] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      setShowModal(false)
      setForm(FORM_INIT)
      setErrors({})
      showToast("Incident déclaré — notification HSE envoyée", true)
    },
    onError: (err: Error) => showToast(err.message, false),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: "EN_COURS" | "RESOLUE" }) => {
      const res = await fetch(`/api/incidents/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ statut }),
      })
      if (!res.ok) throw new Error("Erreur mise à jour statut")
    },
    onMutate: async ({ id, statut }) => {
      await queryClient.cancelQueries({ queryKey: ["incidents", activeProjectId] })
      const prev = queryClient.getQueryData<Incident[]>(["incidents", activeProjectId])
      queryClient.setQueryData<Incident[]>(["incidents", activeProjectId], old =>
        (old ?? []).map(i => i.id === id ? { ...i, statut } : i)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["incidents", activeProjectId], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["incidents", activeProjectId] }),
  })

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function validate() {
    const e: Partial<typeof FORM_INIT> = {}
    if (!form.desc.trim()) e.desc = "Description requise"
    if (!form.lieu.trim()) e.lieu = "Lieu requis"
    if (!form.date)        e.date = "Date requise"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const enCours = incidents.filter(i => i.statut === "EN_COURS").length

  return (
    <div className="space-y-6 page-enter">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* ══ HEADER ══ */}
      <div className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(135deg, #E2445C08 0%, #ffffff 40%, #14b8a608 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {enCours > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> {enCours} incidents en cours
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-teal/10 text-teal border border-teal/20 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Données réelles · PostgreSQL
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">Safety Compliance — HSE</h1>
            <p className="text-sm text-muted-fg mt-1">Hygiène · Sécurité · Environnement · Incidents · Risques</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={activeProjectId}
              onChange={e => setProjectId(e.target.value)}
              className="bg-white border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer shadow-card text-foreground"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button
              onClick={() => setShowModal(true)}
              disabled={!activeProjectId}
              className="flex items-center gap-2 bg-danger hover:bg-danger/90 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Déclarer incident
            </button>
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: ShieldAlert, label: "Taux Fréquence", sublabel: "Cible < 15",
            value: kpis ? String(kpis.tf) : "—",
            accentBg: "bg-warning/10", accentText: "text-warning",
            ok: kpis ? kpis.tf < 15 : true,
          },
          {
            icon: TrendingDown, label: "Taux Gravité", sublabel: "Cible < 1",
            value: kpis ? String(kpis.tg) : "—",
            accentBg: "bg-success/10", accentText: "text-success",
            ok: kpis ? kpis.tg < 1 : true,
          },
          {
            icon: Clock, label: "H. sans accident", sublabel: "Maximiser",
            value: kpis ? `${(kpis.heuresSansAccident / 1000).toFixed(1)}K` : "—",
            accentBg: "bg-success/10", accentText: "text-success",
            ok: true,
          },
          {
            icon: AlertTriangle, label: "Incidents ouverts", sublabel: "Cible : 0",
            value: isLoading ? "—" : String(enCours),
            accentBg: "bg-danger/10", accentText: "text-danger",
            ok: enCours === 0,
          },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className={`bg-white border-t-2 rounded-2xl p-5 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 ${k.ok ? "border-t-success" : "border-t-danger"}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.accentBg}`}>
                  <Icon className={`w-4 h-4 ${k.accentText}`} strokeWidth={2} />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider mb-0.5">{k.label}</p>
              <p className="text-[10px] text-muted-fg/60 mb-2">{k.sublabel}</p>
              <p className={`text-2xl font-black tracking-tight ${k.accentText}`}>{k.value}</p>
            </div>
          )
        })}
      </div>

      {/* ══ TABS ══ */}
      <div className="flex gap-0 border-b border-border">
        {[["incidents","Incidents"],["risques","Matrice Risques"],["formations","Formations"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === v ? "border-primary text-primary" : "border-transparent text-muted-fg hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ══ INCIDENTS ══ */}
      {tab === "incidents" && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Registre des incidents</h3>
            <span className="text-xs text-muted-fg">{incidents.length} incidents · {enCours} en cours</span>
          </div>
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1,2,3].map(i => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-4 animate-pulse">
                  <div className="w-20 h-3 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Aucun incident enregistré</p>
              <p className="text-xs text-muted-fg mt-1">Excellent bilan sécurité pour ce chantier</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {incidents.map(inc => {
                const g      = GRAVITE_STYLE[inc.gravite] ?? GRAVITE_STYLE.MINEUR
                const dateStr = new Date(inc.dateIncident).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
                return (
                  <div key={inc.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                    <div className="w-20 font-mono text-xs text-muted-fg flex-shrink-0 truncate">{inc.id.slice(0, 8)}…</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{inc.description}</p>
                      <p className="text-xs text-muted-fg">{TYPE_LABELS[inc.type] ?? inc.type} · {inc.lieu ?? "—"} · {dateStr}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${g.bg} ${g.text}`}>
                      {inc.gravite}
                    </span>
                    <button
                      onClick={() => statusMutation.mutate({
                        id:     inc.id,
                        statut: inc.statut === "EN_COURS" ? "RESOLUE" : "EN_COURS",
                      })}
                      disabled={statusMutation.isPending}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer transition-all hover:opacity-80 flex-shrink-0 disabled:opacity-50
                        ${inc.statut === "RESOLUE" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                    >
                      {inc.statut}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ RISQUES ══ */}
      {tab === "risques" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-danger" />
              <h3 className="font-bold text-sm text-foreground">Risques identifiés</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { desc: "Travaux hauteur sans harnais",   zone: "Zone B Niv.4",   gravite: "CRITIQUE", proba: "Probable" },
                { desc: "Co-activité grue + maçons",      zone: "Zone C Niv.3",   gravite: "HAUT",     proba: "Possible" },
                { desc: "Poussières silice lors découpe", zone: "Atelier préfab", gravite: "MOYEN",    proba: "Possible" },
              ].map((r, i) => {
                const g = GRAVITE_STYLE[r.gravite] ?? GRAVITE_STYLE.MINEUR
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${g.bg} border-current/10`}>
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${g.text}`} strokeWidth={2.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{r.desc}</p>
                      <p className="text-xs text-muted-fg">{r.zone} · {r.proba}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${g.bg} ${g.text}`}>
                      {r.gravite}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-warning" />
              <h3 className="font-bold text-sm text-foreground">Matrice Probabilité × Impact</h3>
            </div>
            <div className="grid grid-cols-5 gap-1 mb-3">
              {[...Array(25)].map((_, i) => {
                const row = Math.floor(i / 5); const col = i % 5
                const lvl = matrixLevel(row, col)
                const s = MATRIX_STYLE[lvl]
                return (
                  <div key={i} className={`${s.bg} rounded-lg h-9 flex items-center justify-center text-xs font-bold text-foreground`}>
                    {s.label}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 flex-wrap text-xs">
              {(["faible","moyen","haut","critique"] as const).map(k => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${MATRIX_STYLE[k].bg} inline-block`} />
                  <span className="capitalize text-muted-fg">{k}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ FORMATIONS ══ */}
      {tab === "formations" && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-teal" />
              <h3 className="font-bold text-sm text-foreground">Formations HSE — Suivi</h3>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-semibold border border-border bg-white rounded-xl px-3 py-1.5 hover:bg-muted transition-colors shadow-card">
              <Plus className="w-3.5 h-3.5" /> Planifier formation
            </button>
          </div>
          <div className="space-y-3">
            {[
              { nom: "Travaux en hauteur",                agents: 18, realise: 17, date: "15/04/2025" },
              { nom: "Risques électriques (NF C 18-510)", agents: 8,  realise: 8,  date: "01/03/2025" },
              { nom: "Premiers secours SST",              agents: 42, realise: 38, date: "20/02/2025" },
              { nom: "Conduite grue / engins",            agents: 6,  realise: 6,  date: "10/01/2025" },
            ].map((f, i) => {
              const pct  = Math.round(f.realise / f.agents * 100)
              const done = f.realise === f.agents
              return (
                <div key={i} className="flex items-center gap-4 p-3.5 bg-muted/40 rounded-xl border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{f.nom}</p>
                    <p className="text-xs text-muted-fg mt-0.5">Dernière session : {f.date}</p>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-fg">{f.realise}/{f.agents}</span>
                      <span className={done ? "text-success font-bold" : "text-warning font-bold"}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: done ? "#00C875" : "#FDAB3D" }} />
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${done ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {done ? "✓ Complet" : "En cours"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ MODAL DÉCLARER ══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setErrors({}) } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger" /> Déclarer un incident HSE
                </h2>
                <p className="text-xs text-muted-fg mt-0.5">Signalement immédiat — champs * requis</p>
              </div>
              <button onClick={() => { setShowModal(false); setErrors({}) }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-fg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Type <span className="text-danger">*</span></label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                    <option value="PRESQU_ACCIDENT">Presqu&apos;accident</option>
                    <option value="ACCIDENT_SANS_ARRET">Accident sans arrêt</option>
                    <option value="ACCIDENT_ARRET">Accident avec arrêt</option>
                    <option value="MALADIE_PRO">Maladie professionnelle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Gravité <span className="text-danger">*</span></label>
                  <select value={form.gravite} onChange={e => setForm(f => ({ ...f, gravite: e.target.value as typeof form.gravite }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                    <option value="MINEUR">Mineur</option>
                    <option value="MAJEUR">Majeur</option>
                    <option value="CRITIQUE">Critique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Description <span className="text-danger">*</span></label>
                <textarea rows={3} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                  placeholder="Décrivez précisément l'incident survenu..."
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all ${errors.desc ? "border-danger" : "border-border focus:border-primary"}`} />
                {errors.desc && <p className="text-xs text-danger mt-1">{errors.desc}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Lieu <span className="text-danger">*</span></label>
                  <input value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
                    placeholder="Ex: Zone B Niv.3"
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${errors.lieu ? "border-danger" : "border-border focus:border-primary"}`} />
                  {errors.lieu && <p className="text-xs text-danger mt-1">{errors.lieu}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Date <span className="text-danger">*</span></label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${errors.date ? "border-danger" : "border-border focus:border-primary"}`} />
                  {errors.date && <p className="text-xs text-danger mt-1">{errors.date}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
              <button onClick={() => { setShowModal(false); setErrors({}) }}
                className="px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground">
                Annuler
              </button>
              <button
                onClick={() => { if (validate()) declareMutation.mutate(form) }}
                disabled={declareMutation.isPending}
                className="flex items-center gap-2 bg-danger text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-danger/90 disabled:opacity-60 transition-colors">
                <AlertTriangle className="w-4 h-4" />
                {declareMutation.isPending ? "Envoi…" : "Déclarer l'incident"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
