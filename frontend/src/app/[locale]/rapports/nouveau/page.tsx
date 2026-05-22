"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle, Save, AlertTriangle, Sun, Cloud, CloudRain, Wind } from "lucide-react"

interface ProjetItem { id: string; name: string; reference: string }

const METEO_OPTIONS = [
  { value: "ENSOLEILLE", label: "Ensoleillé",  Icon: Sun       },
  { value: "NUAGEUX",    label: "Nuageux",     Icon: Cloud     },
  { value: "PLUVIEUX",   label: "Pluvieux",    Icon: CloudRain },
  { value: "VENTEUX",    label: "Venteux",     Icon: Wind      },
]

export default function NouveauRapportPage() {
  const router       = useRouter()
  const queryClient  = useQueryClient()

  const { data: projets = [], isLoading: projetsLoading } = useQuery<ProjetItem[]>({
    queryKey: ["projects"],
    queryFn:  async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) return []
      return res.json()
    },
  })

  const [form, setForm] = useState({
    projetId:           "",
    date:               new Date().toISOString().slice(0, 10),
    meteo:              "ENSOLEILLE",
    avancement:         0,
    effectifPresent:    0,
    heuresTravaillees:  0,
    observations:       "",
    incidentsSecurite:  false,
  })
  const [apiError, setApiError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async (statut: "BROUILLON" | "SOUMIS") => {
      const projetId = form.projetId || projets[0]?.id
      if (!projetId) throw new Error("Sélectionnez un chantier")

      const d   = new Date(form.date)
      const num = `RJ-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`

      const res = await fetch("/api/reports", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:   projetId,
          title:       `${num} — Rapport Journalier`,
          type:        "DAILY_PROGRESS",
          content:     JSON.stringify({
            meteo:             form.meteo,
            avancement:        form.avancement,
            effectifPresent:   form.effectifPresent,
            heuresTravaillees: form.heuresTravaillees,
            incidentsSecurite: form.incidentsSecurite,
            statut,
          }),
          summary:     form.observations,
          period:      form.date,
          generatedBy: "MANUAL",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de l'enregistrement")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      router.push("/rapports")
    },
    onError: (err: Error) => setApiError(err.message),
  })

  const activeProjetId = form.projetId || projets[0]?.id || ""

  return (
    <div className="space-y-5 page-enter max-w-2xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(135deg, #635BFF08 0%, #ffffff 40%, #14b8a608 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => router.push("/rapports")}
            className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center text-muted-fg hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                DAILY PROGRESS
              </span>
              <span className="text-[10px] font-bold bg-teal/10 text-teal border border-teal/20 px-2.5 py-1 rounded-full">
                Nouveau rapport
              </span>
            </div>
            <h1 className="text-lg font-black text-foreground tracking-tight">Rapport Journalier</h1>
            <p className="text-xs text-muted-fg mt-0.5">Saisie quotidienne · Données sauvegardées en base PostgreSQL</p>
          </div>
        </div>
      </div>

      {/* ── Form card ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl shadow-card">

        <div className="px-6 py-5 space-y-5">

          {apiError && (
            <div className="bg-danger/8 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {apiError}
            </div>
          )}

          {/* Chantier + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Chantier <span className="text-danger">*</span>
              </label>
              <select
                value={activeProjetId}
                onChange={e => { setForm(f => ({ ...f, projetId: e.target.value })); setApiError(null) }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white text-foreground"
              >
                {projetsLoading && <option value="">Chargement…</option>}
                {projets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {!projetsLoading && projets.length === 0 && (
                  <option value="">Aucun chantier disponible</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Météo */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">Météo du jour</label>
            <div className="grid grid-cols-4 gap-2">
              {METEO_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, meteo: value }))}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                    form.meteo === value
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border bg-muted/30 text-muted-fg hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Avancement + Effectif + Heures */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Avancement (%)</label>
              <div className="relative">
                <input
                  type="number" min="0" max="100"
                  value={form.avancement}
                  onChange={e => setForm(f => ({ ...f, avancement: Math.min(100, Math.max(0, +e.target.value)) }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${form.avancement}%`,
                    background: form.avancement > 75 ? "#00C875" : form.avancement > 50 ? "#635BFF" : "#FDAB3D",
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Effectif présent</label>
              <input
                type="number" min="0"
                value={form.effectifPresent}
                onChange={e => setForm(f => ({ ...f, effectifPresent: Math.max(0, +e.target.value) }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Heures travaillées</label>
              <input
                type="number" min="0" step="0.5"
                value={form.heuresTravaillees}
                onChange={e => setForm(f => ({ ...f, heuresTravaillees: Math.max(0, +e.target.value) }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Observations du jour</label>
            <textarea
              value={form.observations}
              onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
              placeholder="Travaux réalisés, points bloquants, livraisons, notes terrain…"
              rows={5}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Incident sécurité */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              form.incidentsSecurite
                ? "border-danger bg-danger"
                : "border-border group-hover:border-danger/50"
            }`}>
              {form.incidentsSecurite && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={form.incidentsSecurite}
              onChange={e => setForm(f => ({ ...f, incidentsSecurite: e.target.checked }))}
            />
            <span className={`text-sm font-medium transition-colors ${
              form.incidentsSecurite ? "text-danger" : "text-foreground"
            }`}>
              Incident sécurité à signaler
            </span>
            {form.incidentsSecurite && (
              <span className="text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full">
                Notification HSE déclenchée
              </span>
            )}
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
          <button
            onClick={() => router.push("/rapports")}
            className="px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground"
          >
            Annuler
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setApiError(null); mutate("BROUILLON") }}
              disabled={isPending || projets.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Brouillon
            </button>
            <button
              onClick={() => { setApiError(null); mutate("SOUMIS") }}
              disabled={isPending || projets.length === 0}
              className="flex items-center gap-2 btn-primary disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Soumettre le rapport
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
