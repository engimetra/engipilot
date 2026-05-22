"use client"
import { useState, useRef } from "react"
import { Plus, X, CheckCircle, Package, Truck, AlertTriangle } from "lucide-react"

type Commande = {
  id: string; materiau: string; qte: string; fournisseur: string
  livraison: string; statut: "CONFIRME" | "TRANSIT" | "RETARD" | "LIVRE"
  montant: string
}

const COMMANDES_INIT: Commande[] = [
  { id:"CMD-084", materiau:"Acier HA 12–25mm", qte:"8 T", fournisseur:"Arcelor Mittal", livraison:"18/05", statut:"CONFIRME", montant:"62 400 MAD" },
  { id:"CMD-083", materiau:"Béton B30 — 60 m³", qte:"60 m³", fournisseur:"Lafarge Maroc", livraison:"20/05", statut:"TRANSIT", montant:"48 000 MAD" },
  { id:"CMD-082", materiau:"Câbles CFO 150mm²", qte:"500 ml", fournisseur:"Nexans", livraison:"25/05", statut:"RETARD", montant:"18 750 MAD" },
  { id:"CMD-081", materiau:"Parpaings 20×20", qte:"2 400 u.", fournisseur:"Holcim Maroc", livraison:"22/05", statut:"CONFIRME", montant:"14 400 MAD" },
]

const ST: Record<string, string> = {
  CONFIRME: "bg-success/10 text-success",
  TRANSIT:  "bg-warning/10 text-warning",
  RETARD:   "bg-danger/10 text-danger",
  LIVRE:    "bg-muted text-muted-fg",
}

const FORM_INIT = { materiau:"", qte:"", unite:"T", fournisseur:"Lafarge Maroc", livraison:"", montant:"" }

type DetailCmd = Commande & { detail?: boolean }

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease]">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function ApproPage() {
  const [commandes, setCommandes] = useState<Commande[]>(COMMANDES_INIT)
  const [tab, setTab] = useState("commandes")
  const [showModal, setShowModal] = useState(false)
  const [detailCmd, setDetailCmd] = useState<Commande | null>(null)
  const [form, setForm] = useState(FORM_INIT)
  const [errors, setErrors] = useState<Partial<typeof FORM_INIT>>({})
  const [toast, setToast] = useState("")
  const counter = useRef(85)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function validate() {
    const e: Partial<typeof FORM_INIT> = {}
    if (!form.materiau.trim()) e.materiau = "Matériau requis"
    if (!form.qte.trim()) e.qte = "Quantité requise"
    if (!form.livraison) e.livraison = "Date requise"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const id = `CMD-${counter.current++}`
    const [y, m, d] = form.livraison.split("-")
    const livraisonStr = `${d}/${m}`
    const nouv: Commande = {
      id,
      materiau: form.materiau.trim(),
      qte: `${form.qte} ${form.unite}`,
      fournisseur: form.fournisseur,
      livraison: livraisonStr,
      statut: "CONFIRME",
      montant: form.montant ? `${form.montant} MAD` : "À définir",
    }
    setCommandes(prev => [nouv, ...prev])
    setShowModal(false)
    setForm(FORM_INIT)
    setErrors({})
    showToast(`Commande ${id} créée`)
  }

  function changeStatut(id: string, statut: Commande["statut"]) {
    setCommandes(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
    setDetailCmd(null)
    showToast(`Statut mis à jour → ${statut}`)
  }

  const actives = commandes.filter(c => c.statut !== "LIVRE")
  const enTransit = commandes.filter(c => c.statut === "TRANSIT")
  const enRetard = commandes.filter(c => c.statut === "RETARD")
  const valeurTotal = commandes.filter(c=>c.statut!=="RETARD").reduce((s, c) => {
    const v = parseFloat(c.montant.replace(/[^0-9.]/g, ""))
    return s + (isNaN(v) ? 0 : v)
  }, 0)

  return (
    <div className="space-y-5 page-enter">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Approvisionnement & Stock</h1>
          <p className="text-sm text-muted-fg mt-0.5">Commandes · Niveaux de stock · Alertes</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Nouvelle commande
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:"Commandes actives", v: String(actives.length), c:"text-primary", Icon: Package },
          { l:"En transit", v: String(enTransit.length), c:"text-warning", Icon: Truck },
          { l:"Retards fournisseurs", v: String(enRetard.length), c:"text-danger", Icon: AlertTriangle },
          { l:"Valeur commandes", v: `${(valeurTotal/1000).toFixed(1)}K MAD`, c:"text-success", Icon: CheckCircle },
        ].map(({ l, v, c, Icon }) => (
          <div key={l} className="bg-white border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase text-muted-fg">{l}</p>
              <Icon className={`w-4 h-4 ${c}`} />
            </div>
            <p className={`text-xl font-black ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {[["commandes","Commandes"],["stock","Niveaux stock"],["fournisseurs","Fournisseurs"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab===v?"border-primary text-primary":"border-transparent text-muted-fg hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "commandes" && (
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
          {commandes.length === 0 && (
            <div className="py-12 text-center text-muted-fg text-sm">Aucune commande</div>
          )}
          <div className="divide-y divide-border">
            {commandes.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                <span className="font-mono text-xs text-muted-fg w-20 flex-shrink-0">{c.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.materiau}</p>
                  <p className="text-xs text-muted-fg">{c.fournisseur} · Livraison : {c.livraison}</p>
                </div>
                <span className="font-mono text-xs font-bold text-foreground">{c.qte}</span>
                <span className="font-bold text-sm text-foreground">{c.montant}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${ST[c.statut]}`}>{c.statut}</span>
                <button
                  onClick={() => setDetailCmd(c)}
                  className="text-xs border border-border px-2.5 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                >
                  Détail
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "stock" && (
        <div className="bg-white border border-border rounded-xl p-5 space-y-4 shadow-card">
          {[
            { mat:"Acier disponible", qte:"12.4 T", cible:"16 T", pct:78, c:"#10b981", alerte:false },
            { mat:"Béton précommandé", qte:"120 m³", cible:"150 m³", pct:80, c:"#3b82f6", alerte:false },
            { mat:"Bois coffrage", qte:"340 ml", cible:"1 000 ml", pct:34, c:"#f59e0b", alerte:true },
            { mat:"Parpaings 20×20", qte:"4 820 u.", cible:"6 000 u.", pct:80, c:"#10b981", alerte:false },
            { mat:"Câbles CFO", qte:"120 ml", cible:"620 ml", pct:19, c:"#ef4444", alerte:true },
          ].map(s => (
            <div key={s.mat}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-foreground">{s.mat}
                  {s.alerte && <span className="ml-2 text-xs text-danger font-normal">⚠ Stock faible</span>}
                </span>
                <span className="font-mono font-bold text-foreground">{s.qte} / {s.cible}</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${s.pct}%`, background:s.c}} />
              </div>
            </div>
          ))}
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-fg">2 matériaux en dessous du seuil critique — commandes recommandées</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-3">
              <Plus className="w-4 h-4" /> Commander les matériaux manquants
            </button>
          </div>
        </div>
      )}

      {tab === "fournisseurs" && (
        <div className="bg-white border border-border rounded-xl shadow-card divide-y divide-border">
          {[
            { nom:"Lafarge Maroc", type:"Béton/Ciment", note:4.2, delai:"J+2", statut:"Actif" },
            { nom:"Arcelor Mittal", type:"Acier", note:4.5, delai:"J+5", statut:"Actif" },
            { nom:"Holcim Maroc", type:"Parpaings/Ciment", note:4.0, delai:"J+3", statut:"Actif" },
            { nom:"Nexans", type:"Câbles électriques", note:3.8, delai:"J+10", statut:"Retard" },
          ].map(f => (
            <div key={f.nom} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{f.nom[0]}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{f.nom}</p>
                <p className="text-xs text-muted-fg">{f.type}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-fg">Note</p>
                <p className="font-bold text-warning">★ {f.note}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-fg">Délai moyen</p>
                <p className="font-bold text-sm text-foreground">{f.delai}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${f.statut==="Actif"?"bg-success/10 text-success":"bg-danger/10 text-danger"}`}>
                {f.statut}
              </span>
              <button onClick={() => showToast(`Contact ${f.nom} initié`)}
                className="text-xs border border-border px-2.5 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors">
                Contacter
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL NOUVELLE COMMANDE ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if(e.target===e.currentTarget) { setShowModal(false); setErrors({}) } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Nouvelle commande</h2>
                <p className="text-xs text-muted-fg mt-0.5">Créer une commande fournisseur</p>
              </div>
              <button onClick={() => { setShowModal(false); setErrors({}) }} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Matériau <span className="text-danger">*</span></label>
                <input value={form.materiau} onChange={e => setForm(f=>({...f,materiau:e.target.value}))}
                  placeholder="Ex: Acier HA 16mm"
                  className={`input ${errors.materiau?"border-danger":""}`} />
                {errors.materiau && <p className="text-xs text-danger mt-1">{errors.materiau}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Quantité <span className="text-danger">*</span></label>
                  <div className="flex gap-2">
                    <input value={form.qte} onChange={e => setForm(f=>({...f,qte:e.target.value}))}
                      placeholder="Ex: 12"
                      className={`input flex-1 ${errors.qte?"border-danger":""}`} />
                    <select value={form.unite} onChange={e => setForm(f=>({...f,unite:e.target.value}))}
                      className="input w-20 flex-shrink-0">
                      <option>T</option><option>m³</option><option>ml</option><option>u.</option><option>kg</option>
                    </select>
                  </div>
                  {errors.qte && <p className="text-xs text-danger mt-1">{errors.qte}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Montant (MAD)</label>
                  <input value={form.montant} onChange={e => setForm(f=>({...f,montant:e.target.value}))}
                    placeholder="Ex: 45 000" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Fournisseur</label>
                  <select value={form.fournisseur} onChange={e => setForm(f=>({...f,fournisseur:e.target.value}))} className="input">
                    <option>Lafarge Maroc</option>
                    <option>Arcelor Mittal</option>
                    <option>Holcim Maroc</option>
                    <option>Nexans</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Date livraison <span className="text-danger">*</span></label>
                  <input type="date" value={form.livraison} onChange={e => setForm(f=>({...f,livraison:e.target.value}))}
                    className={`input ${errors.livraison?"border-danger":""}`} />
                  {errors.livraison && <p className="text-xs text-danger mt-1">{errors.livraison}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl justify-end">
              <button onClick={() => { setShowModal(false); setErrors({}) }} className="btn-outline">Annuler</button>
              <button onClick={handleSubmit} className="btn-primary"><Plus className="w-4 h-4" /> Créer la commande</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DÉTAIL COMMANDE ── */}
      {detailCmd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if(e.target===e.currentTarget) setDetailCmd(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">{detailCmd.id}</h2>
                <p className="text-xs text-muted-fg">{detailCmd.fournisseur}</p>
              </div>
              <button onClick={() => setDetailCmd(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l:"Matériau", v: detailCmd.materiau },
                  { l:"Quantité", v: detailCmd.qte },
                  { l:"Montant", v: detailCmd.montant },
                  { l:"Livraison prévue", v: detailCmd.livraison },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-muted/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-fg">{l}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Changer le statut :</p>
                <div className="flex gap-2 flex-wrap">
                  {(["CONFIRME","TRANSIT","LIVRE","RETARD"] as const).filter(s => s !== detailCmd.statut).map(s => (
                    <button key={s} onClick={() => changeStatut(detailCmd.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${ST[s]} border-current/20 hover:opacity-80`}>
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
