"use client"
import { useState, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FileText, Download, CheckCircle, Clock, Edit, Upload, X, Printer, Plus } from "lucide-react"
import { exportRapportPDF, type RapportPDFData } from "@/lib/pdf-export"

type Rapport = {
  num: string; date: string; auteur: string; effectif: number
  statut: "BROUILLON" | "SOUMIS" | "VALIDE"
  weather: string; travaux: string; avancement: number
}

const HISTORIQUE_INIT: Rapport[] = [
  { num:"RJ-2025-084", date:"15/05", auteur:"A. Khalil", effectif:42, statut:"BROUILLON", weather:"ENSOLEILLE", travaux:"Coulage dalle plein pied Zone C Niveau 3 — 24 m³ béton B30.", avancement:63 },
  { num:"RJ-2025-083", date:"14/05", auteur:"A. Khalil", effectif:42, statut:"VALIDE", weather:"NUAGEUX", travaux:"Ferraillage poteaux P14 à P18.", avancement:61 },
  { num:"RJ-2025-082", date:"13/05", auteur:"A. Khalil", effectif:40, statut:"VALIDE", weather:"ENSOLEILLE", travaux:"Maçonnerie façade Nord Niv.3.", avancement:60 },
  { num:"RJ-2025-081", date:"12/05", auteur:"M. Alami",  effectif:38, statut:"SOUMIS",  weather:"PLUVIEUX", travaux:"Travaux arrêtés matin — pluie. Électricité Zone A.", avancement:59 },
  { num:"RJ-2025-080", date:"11/05", auteur:"A. Khalil", effectif:45, statut:"VALIDE", weather:"ENSOLEILLE", travaux:"Coulage poteaux Zone D.", avancement:58 },
]

const STATUT_STYLE: Record<string, { bg: string; text: string; Icon: typeof CheckCircle }> = {
  VALIDE:    { bg:"bg-success/10",  text:"text-success",  Icon:CheckCircle },
  SOUMIS:    { bg:"bg-warning/10",  text:"text-warning",  Icon:Clock },
  BROUILLON: { bg:"bg-muted",       text:"text-muted-fg", Icon:Edit },
}

const METEO = [
  ["ENSOLEILLE","☀️ Ensoleillé"],["NUAGEUX","⛅ Nuageux"],["PLUVIEUX","🌧️ Pluvieux"],["VENTEUX","💨 Venteux"]
] as const

type Photo = { name: string; url: string }

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease]">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function RapportsPage() {
  const router = useRouter()
  const [historique, setHistorique] = useState<Rapport[]>(HISTORIQUE_INIT)
  const [weather, setWeather] = useState("ENSOLEILLE")
  const [avancement, setAvancement] = useState(63)
  const [travaux, setTravaux] = useState("Coulage dalle plein pied Zone C Niveau 3 — 24 m³ béton B30. Ferraillage poteaux P14 à P18 terminé.")
  const [problemes, setProblemes] = useState("Grue principale en maintenance — livraison béton décalée de 2h.")
  const [effectif, setEffectif] = useState(42)
  const [beton, setBeton] = useState(24)
  const [acier, setAcier] = useState(1250)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [dragOverPhoto, setDragOverPhoto] = useState(false)
  const [toast, setToast] = useState("")
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const rapportCounter = useRef(85)

  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<string>("")

  const { data: projectsList = [] } = useQuery<{ id: string; name: string; reference: string }[]>({
    queryKey: ["projects-select"],
    queryFn:  async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) return []
      return res.json()
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (statut: "BROUILLON" | "SOUMIS") => {
      const pid = projectId || projectsList[0]?.id
      if (!pid) throw new Error("Sélectionnez un chantier")
      const num    = `RJ-${new Date().getFullYear()}-0${rapportCounter.current}`
      const title  = `${num} — Rapport Journalier`
      const res = await fetch("/api/reports", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:   pid,
          title,
          type:        "DAILY_PROGRESS",
          content:     JSON.stringify({ weather, effectif, avancement, beton, acier, problemes }),
          summary:     travaux,
          period:      new Date().toISOString().slice(0, 10),
          generatedBy: "MANUAL",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur envoi rapport")
      return { json, num, statut }
    },
    onSuccess: ({ num, statut }) => {
      rapportCounter.current++
      const now     = new Date()
      const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}`
      const nouveau: Rapport = { num, date: dateStr, auteur: "Vous", effectif, statut, weather, travaux, avancement }
      setHistorique(prev => [nouveau, ...prev.slice(0, 9)])
      showToast(statut === "BROUILLON" ? `Brouillon ${num} enregistré` : `Rapport ${num} soumis pour validation`)
      queryClient.invalidateQueries({ queryKey: ["projects-select"] })
    },
    onError: (err: Error) => showToast(`Erreur : ${err.message}`),
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function handleSave(statut: "BROUILLON" | "SOUMIS") {
    submitMutation.mutate(statut)
  }

  const processPhotos = useCallback((files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith("image/") && f.size <= 10*1024*1024).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const url = e.target?.result as string
        setPhotos(prev => [...prev, { name: file.name, url }])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  function generatePDF(rapport?: Rapport) {
    const num     = rapport?.num  ?? `RJ-${new Date().getFullYear()}-0${rapportCounter.current}`
    const dateStr = rapport?.date ?? new Date().toLocaleDateString("fr-FR")
    const chantier = (projectsList.find(p => p.id === (projectId || projectsList[0]?.id))?.name) ?? "Chantier"

    const data: RapportPDFData = {
      num,
      date:             dateStr,
      chantier,
      auteur:           rapport?.auteur ?? "Vous",
      meteo:            rapport?.weather ?? weather,
      avancement:       rapport?.avancement ?? avancement,
      effectif:         rapport?.effectif  ?? effectif,
      beton,
      acier,
      observations:     rapport?.travaux ?? travaux,
      problemes:        problemes || undefined,
    }

    exportRapportPDF(data)
    showToast(`PDF ${num} téléchargé`)
  }

  return (
    <div className="space-y-5 page-enter">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Rapports Journaliers</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-fg">Chantier :</p>
            <select
              value={projectId || projectsList[0]?.id || ""}
              onChange={e => setProjectId(e.target.value)}
              className="text-xs border border-border rounded-lg px-2.5 py-1 bg-white outline-none focus:border-primary text-foreground shadow-card"
            >
              {projectsList.length === 0 && <option value="">Chargement…</option>}
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/rapports/nouveau")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground shadow-card"
          >
            <Plus className="w-4 h-4" /> Nouveau rapport
          </button>
          <button onClick={() => handleSave("BROUILLON")} disabled={submitMutation.isPending} className="btn-outline disabled:opacity-60">
            <Edit className="w-4 h-4" /> Brouillon
          </button>
          <button onClick={() => handleSave("SOUMIS")} disabled={submitMutation.isPending} className="btn-primary disabled:opacity-60">
            {submitMutation.isPending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi…</>
              : <><CheckCircle className="w-4 h-4" /> Soumettre</>
            }
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {/* Infos générales */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-4 text-foreground">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">Date</label>
                <input type="date" defaultValue={new Date().toISOString().split("T")[0]} className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">N° Rapport</label>
                <input value={`RJ-2025-0${rapportCounter.current}`} readOnly className="input opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Météo</label>
              <div className="flex gap-2 flex-wrap">
                {METEO.map(([v, l]) => (
                  <button key={v} onClick={() => setWeather(v)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors
                      ${weather===v?"bg-primary/10 border-primary text-primary":"border-border text-muted-fg hover:border-primary/50"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">Température (°C)</label>
                <input type="number" defaultValue="24" className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">Vent (km/h)</label>
                <input type="number" defaultValue="18" className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">Effectif présent</label>
                <input type="number" value={effectif} onChange={e => setEffectif(+e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Travaux */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-4 text-foreground">Travaux réalisés</h3>
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Description des travaux du jour</label>
              <textarea rows={3} value={travaux} onChange={e => setTravaux(e.target.value)} className="input resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">Béton coulé (m³)</label>
                <input type="number" value={beton} onChange={e => setBeton(+e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">Acier posé (kg)</label>
                <input type="number" value={acier} onChange={e => setAcier(+e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1.5">Avancement (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" value={avancement} onChange={e => setAvancement(+e.target.value)} className="flex-1" />
                  <span className="text-sm font-bold text-primary w-10 tabular-nums">{avancement}%</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Problèmes rencontrés</label>
              <textarea rows={2} value={problemes} onChange={e => setProblemes(e.target.value)} className="input resize-none" />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-3 text-foreground">Photos chantier</h3>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { if(e.target.files) processPhotos(e.target.files); e.target.value="" }} />
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                ${dragOverPhoto?"border-primary bg-primary/5":"border-border hover:border-primary/50 hover:bg-muted/20"}`}
              onDragOver={e => { e.preventDefault(); setDragOverPhoto(true) }}
              onDragLeave={() => setDragOverPhoto(false)}
              onDrop={e => { e.preventDefault(); setDragOverPhoto(false); processPhotos(e.dataTransfer.files) }}
              onClick={() => photoInputRef.current?.click()}
            >
              <Upload className={`w-7 h-7 mx-auto mb-2 ${dragOverPhoto?"text-primary":"text-muted-fg"}`} />
              <p className="text-sm text-muted-fg">{dragOverPhoto?"Relâchez les photos":"Glisser-déposer ou cliquer"}</p>
              <p className="text-xs text-muted-fg mt-1">JPG, PNG, HEIC — max 10 Mo par fichier</p>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {photos.map((p, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                    <img src={p.url} alt={p.name} className="w-full h-24 object-cover" />
                    <button onClick={() => setPhotos(ph => ph.filter((_,j)=>j!==i))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-muted-fg truncate px-1 py-0.5 bg-white">{p.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Historique */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-card">
            <h3 className="font-bold text-sm mb-3 text-foreground">Historique récent</h3>
            <div className="space-y-2">
              {historique.slice(0,5).map(r => {
                const s = STATUT_STYLE[r.statut]
                return (
                  <button key={r.num} onClick={() => setSelectedRapport(r)}
                    className="w-full flex items-center justify-between p-2.5 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors text-left">
                    <div>
                      <p className="text-xs font-bold text-foreground">{r.num}</p>
                      <p className="text-xs text-muted-fg">{r.date} · {r.effectif} ouvriers</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.bg} ${s.text}`}>{r.statut}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stats semaine */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-card">
            <h3 className="font-bold text-sm mb-3 text-foreground">Stats semaine</h3>
            {[
              ["👷 Effectif moyen", `${Math.round(historique.slice(0,5).reduce((s,r)=>s+r.effectif,0)/Math.min(5,historique.length))} pers.`],
              ["🏗️ Béton semaine", `${beton * 5} m³`],
              ["⚙️ Acier semaine", `${(acier * 5).toLocaleString("fr-FR")} kg`],
              ["🛡️ Incidents", "0"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-fg">{k}</span>
                <span className="text-xs font-bold text-foreground">{v}</span>
              </div>
            ))}
          </div>

          {/* Générer PDF */}
          <button onClick={() => generatePDF()}
            className="w-full btn-outline justify-center py-3 hover:border-primary hover:text-primary">
            <Printer className="w-4 h-4" /> Générer PDF
          </button>
        </div>
      </div>

      {/* Modal aperçu rapport historique */}
      {selectedRapport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if(e.target===e.currentTarget) setSelectedRapport(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">{selectedRapport.num}</h2>
                <p className="text-xs text-muted-fg">{selectedRapport.date} · {selectedRapport.auteur}</p>
              </div>
              <button onClick={() => setSelectedRapport(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l:"Effectif", v: `${selectedRapport.effectif} ouvriers` },
                  { l:"Avancement", v: `${selectedRapport.avancement}%` },
                  { l:"Météo", v: selectedRapport.weather },
                  { l:"Statut", v: selectedRapport.statut },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-muted/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-fg">{l}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-fg mb-1">Travaux</p>
                <p className="text-sm text-foreground">{selectedRapport.travaux}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
              <button onClick={() => generatePDF(selectedRapport)} className="btn-primary w-full justify-center">
                <Printer className="w-4 h-4" /> Exporter ce rapport en PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
