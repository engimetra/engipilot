"use client"
import { useState, useRef } from "react"
import { X, Plus, CheckCircle2, AlertTriangle, Clock, ShieldCheck } from "lucide-react"

type NC = {
  ref: string; desc: string; lot: string; zone: string; resp: string
  priorite: "CRITIQUE" | "MAJEURE" | "MINEURE"
  statut: "OUVERTE" | "EN_COURS" | "RESOLUE" | "FERMEE"
  age: string
}

const NCS_INIT: NC[] = [
  { ref:"NC-047", desc:"Résistance béton insuffisante — Poteau P12", lot:"Lot BA", zone:"Zone C / Niv.3", resp:"M. Benhali", priorite:"CRITIQUE", statut:"OUVERTE", age:"5j" },
  { ref:"NC-046", desc:"Enrobage ferraillage hors tolérance", lot:"Lot BA", zone:"Zone B / Niv.2", resp:"S. Alami", priorite:"MAJEURE", statut:"EN_COURS", age:"8j" },
  { ref:"NC-044", desc:"Désalignement maçonnerie façade nord +2cm", lot:"Lot Maç.", zone:"Façade Nord", resp:"K. Fassi", priorite:"MINEURE", statut:"EN_COURS", age:"12j" },
  { ref:"NC-043", desc:"Étanchéité terrasse insuffisante — test eau", lot:"Lot Maç.", zone:"Terrasse R+5", resp:"Y. Chraibi", priorite:"MINEURE", statut:"EN_COURS", age:"15j" },
  { ref:"NC-041", desc:"Ferraillage poteau P8 manquant", lot:"Lot BA", zone:"Zone A / Niv.1", resp:"M. Benhali", priorite:"CRITIQUE", statut:"RESOLUE", age:"22j" },
]

const P_STYLE: Record<string, string> = {
  CRITIQUE:"bg-danger/10 text-danger border-l-danger",
  MAJEURE:"bg-warning/10 text-warning border-l-warning",
  MINEURE:"bg-primary/10 text-primary border-l-primary",
}
const S_STYLE: Record<string, string> = {
  OUVERTE:"bg-danger/10 text-danger",
  EN_COURS:"bg-warning/10 text-warning",
  RESOLUE:"bg-success/10 text-success",
  FERMEE:"bg-muted text-muted-fg",
}

const FORM_INIT = { desc:"", lot:"Lot BA", zone:"", resp:"A. Khalil", priorite:"MINEURE" as NC["priorite"] }

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease]">
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-sm font-semibold">{msg}</span>
    </div>
  )
}

export default function QualitePage() {
  const [ncs, setNcs] = useState<NC[]>(NCS_INIT)
  const [showForm, setShowForm] = useState(false)
  const [filterStatut, setFilterStatut] = useState("TOUS")
  const [form, setForm] = useState(FORM_INIT)
  const [errors, setErrors] = useState<Partial<typeof FORM_INIT>>({})
  const [toast, setToast] = useState("")
  const [traitModal, setTraitModal] = useState<NC | null>(null)
  const counter = useRef(48)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const filtered = ncs.filter(nc => filterStatut === "TOUS" || nc.statut === filterStatut)
  const ouvertes = ncs.filter(n => n.statut !== "RESOLUE" && n.statut !== "FERMEE").length

  function validate() {
    const e: Partial<typeof FORM_INIT> = {}
    if (!form.desc.trim()) e.desc = "Description requise"
    if (!form.zone.trim()) e.zone = "Zone requise"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const ref = `NC-${counter.current++}`
    const now = new Date()
    const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}`
    const nouv: NC = {
      ref,
      desc: form.desc.trim(),
      lot: form.lot,
      zone: form.zone.trim(),
      resp: form.resp,
      priorite: form.priorite,
      statut: "OUVERTE",
      age: "0j",
    }
    setNcs(prev => [nouv, ...prev])
    setShowForm(false)
    setForm(FORM_INIT)
    setErrors({})
    showToast(`${ref} créée avec succès`)
  }

  function traiterNC(nc: NC) {
    setNcs(prev => prev.map(n =>
      n.ref === nc.ref
        ? { ...n, statut: n.statut === "OUVERTE" ? "EN_COURS" : n.statut === "EN_COURS" ? "RESOLUE" : "FERMEE" }
        : n
    ))
    setTraitModal(null)
    showToast(`Statut de ${nc.ref} mis à jour`)
  }

  return (
    <div className="space-y-5 page-enter">
      {toast && <Toast msg={toast} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Qualité — Non-Conformités</h1>
          <p className="text-sm text-muted-fg mt-0.5">{ouvertes} NC ouvertes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><X className="w-4 h-4" /> Fermer</> : <><Plus className="w-4 h-4" /> Créer NC</>}
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:"Taux NC global", v:"6.2%", c:"text-danger", t:"Cible < 5%" },
          { l:"Taux résolution", v:`${Math.round((ncs.filter(n=>n.statut==="RESOLUE"||n.statut==="FERMEE").length/ncs.length)*100)}%`, c:"text-warning", t:"Cible > 90%" },
          { l:"Délai moyen résol.", v:"9.3j", c:"text-warning", t:"Cible < 7j" },
          { l:"Coût non-qualité", v:"3.8%", c:"text-danger", t:"Cible < 2% budget" },
        ].map(k => (
          <div key={k.l} className="bg-white border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs uppercase text-muted-fg mb-1">{k.l}</p>
            <p className={`text-2xl font-black ${k.c}`}>{k.v}</p>
            <p className="text-xs text-muted-fg mt-1">{k.t}</p>
          </div>
        ))}
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white border border-primary/30 rounded-xl p-5 shadow-card">
          <h3 className="font-bold text-sm mb-4 text-foreground">Créer une nouvelle non-conformité</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Référence</label>
              <input value={`NC-${counter.current}`} readOnly className="input opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Priorité</label>
              <select value={form.priorite} onChange={e => setForm(f=>({...f,priorite:e.target.value as NC["priorite"]}))}
                className="input">
                <option value="CRITIQUE">CRITIQUE</option>
                <option value="MAJEURE">MAJEURE</option>
                <option value="MINEURE">MINEURE</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-muted-fg block mb-1.5">Description <span className="text-danger">*</span></label>
            <textarea rows={2} value={form.desc} onChange={e => setForm(f=>({...f,desc:e.target.value}))}
              placeholder="Décrire la non-conformité..."
              className={`input resize-none ${errors.desc?"border-danger":""}`} />
            {errors.desc && <p className="text-xs text-danger mt-1">{errors.desc}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Lot</label>
              <select value={form.lot} onChange={e => setForm(f=>({...f,lot:e.target.value}))} className="input">
                <option>Lot BA</option><option>Lot Maçonnerie</option><option>Lot Électricité</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Zone <span className="text-danger">*</span></label>
              <input value={form.zone} onChange={e => setForm(f=>({...f,zone:e.target.value}))}
                placeholder="Ex: Zone A Niv.2"
                className={`input ${errors.zone?"border-danger":""}`} />
              {errors.zone && <p className="text-xs text-danger mt-1">{errors.zone}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-fg block mb-1.5">Responsable</label>
              <select value={form.resp} onChange={e => setForm(f=>({...f,resp:e.target.value}))} className="input">
                <option>A. Khalil</option><option>K. Fassi</option><option>S. Alami</option><option>M. Benhali</option><option>Y. Chraibi</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setForm(FORM_INIT); setErrors({}) }}
              className="btn-outline">Annuler</button>
            <button onClick={handleSubmit} className="btn-primary">
              <Plus className="w-4 h-4" /> Créer la NC
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {["TOUS","OUVERTE","EN_COURS","RESOLUE"].map(s => (
          <button key={s} onClick={() => setFilterStatut(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
              ${filterStatut===s?"bg-primary text-white":"bg-white border border-border text-muted-fg hover:text-foreground shadow-card"}`}>
            {s==="TOUS"?`Toutes (${ncs.length})`:`${s.replace("_"," ")} (${ncs.filter(n=>n.statut===s).length})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="py-10 text-center text-muted-fg text-sm">Aucune NC pour ce filtre</div>
          )}
          {filtered.map(nc => (
            <div key={nc.ref} className={`flex items-center gap-4 px-4 py-3 border-l-4 hover:bg-muted/20 transition-colors ${P_STYLE[nc.priorite]}`}>
              <span className="font-mono text-xs text-muted-fg w-16 flex-shrink-0">{nc.ref}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{nc.desc}</p>
                <p className="text-xs text-muted-fg mt-0.5">{nc.lot} · {nc.zone} · Resp: {nc.resp}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${P_STYLE[nc.priorite].split(" ")[0]} ${P_STYLE[nc.priorite].split(" ")[1]}`}>
                {nc.priorite}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${S_STYLE[nc.statut]}`}>
                {nc.statut.replace("_"," ")}
              </span>
              <span className="text-xs font-mono text-muted-fg w-10 flex-shrink-0">{nc.age}</span>
              {nc.statut !== "FERMEE" && nc.statut !== "RESOLUE" ? (
                <button onClick={() => setTraitModal(nc)}
                  className="text-xs bg-muted border border-border px-2.5 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors flex-shrink-0">
                  Traiter
                </button>
              ) : (
                <span className="w-[68px] flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Traiter NC */}
      {traitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if(e.target===e.currentTarget) setTraitModal(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Traiter — {traitModal.ref}</h2>
              <button onClick={() => setTraitModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted-fg mb-4">{traitModal.desc}</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Changer le statut vers :</p>
                {(["EN_COURS","RESOLUE","FERMEE"] as const).filter(s => s !== traitModal.statut).map(s => (
                  <button key={s} onClick={() => traiterNC({...traitModal, statut: s})}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.01] ${S_STYLE[s]} border-current/20`}>
                    → {s.replace("_"," ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
