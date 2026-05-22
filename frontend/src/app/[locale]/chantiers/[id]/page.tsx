"use client"
import { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, MapPin, Calendar, Users, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, DollarSign, FileText, BarChart2, Settings,
  Plus, MoreHorizontal, User, X, Upload, Download, GripVertical,
  Printer, Edit, CheckCircle,
} from "lucide-react"

const CHANTIERS: Record<string, {
  id: string; code: string; nom: string; responsable: string; initiales: string; color: string
  statut: string; avancement: number; retard: string; budget: string; budgetConsomme: string
  priorite: string; debut: string; fin: string; description: string; equipe: number
  taches: { total: number; done: number; en_cours: number; bloquees: number }
  incidents: number; localisation: string
}> = {
  "1": { id:"1", code:"P-2024-CA-007", nom:"Résidence Al Andalous", responsable:"A. Khalil", initiales:"AK", color:"#635BFF", statut:"EN_COURS", avancement:63, retard:"+12j", budget:"48.5M MAD", budgetConsomme:"31.2M MAD", priorite:"HAUTE", debut:"01/03/2024", fin:"30/11/2025", description:"Construction d'une résidence de 120 logements sur 4 blocs R+7 avec parking souterrain, espaces verts et équipements communs.", equipe:47, taches:{total:84,done:53,en_cours:18,bloquees:3}, incidents:2, localisation:"Casablanca, Hay Hassani" },
  "2": { id:"2", code:"P-2024-BS-003", nom:"Usine Bouskoura", responsable:"K. Fassi", initiales:"KF", color:"#E2445C", statut:"RETARD", avancement:45, retard:"+46j", budget:"82.0M MAD", budgetConsomme:"40.1M MAD", priorite:"CRITIQUE", debut:"15/01/2024", fin:"28/02/2026", description:"Construction d'une unité industrielle de 12 000 m² dédiée à la production agroalimentaire, avec infrastructure logistique.", equipe:92, taches:{total:140,done:63,en_cours:42,bloquees:11}, incidents:7, localisation:"Bouskoura, Province Nouaceur" },
  "3": { id:"3", code:"P-2024-RB-011", nom:"Tour Hassan II Ext.", responsable:"M. Benhali", initiales:"MB", color:"#FDAB3D", statut:"EN_COURS", avancement:62, retard:"+8j", budget:"135M MAD", budgetConsomme:"83.7M MAD", priorite:"HAUTE", debut:"10/06/2023", fin:"31/12/2025", description:"Extension et rénovation de la Tour Hassan II — aménagement de 6 étages supplémentaires, façades et infrastructure technique.", equipe:130, taches:{total:210,done:130,en_cours:55,bloquees:8}, incidents:3, localisation:"Rabat, Centre-ville" },
  "4": { id:"4", code:"P-2024-AD-015", nom:"Villas Ain Diab", responsable:"S. Alami", initiales:"SA", color:"#00C875", statut:"EN_COURS", avancement:91, retard:"—", budget:"24.2M MAD", budgetConsomme:"22.0M MAD", priorite:"BASSE", debut:"01/09/2023", fin:"31/07/2025", description:"Ensemble résidentiel de 18 villas haut standing avec piscine individuelle, jardin et domotique.", equipe:28, taches:{total:60,done:55,en_cours:4,bloquees:0}, incidents:0, localisation:"Casablanca, Ain Diab" },
  "5": { id:"5", code:"P-2024-TG-002", nom:"Station Énergie Tanger", responsable:"Y. Chraibi", initiales:"YC", color:"#8b5cf6", statut:"RETARD", avancement:33, retard:"+32j", budget:"210M MAD", budgetConsomme:"71.4M MAD", priorite:"CRITIQUE", debut:"01/04/2024", fin:"30/06/2026", description:"Construction d'une station de transformation électrique haute tension pour l'alimentation de la zone franche de Tanger Med.", equipe:185, taches:{total:320,done:106,en_cours:89,bloquees:24}, incidents:9, localisation:"Tanger, Zone Franche" },
}

const STATUT_LABEL: Record<string,string> = { EN_COURS:"En cours", RETARD:"Retard", PLANIFIE:"Planifié", TERMINE:"Terminé" }
const STATUT_STYLE: Record<string,string> = {
  EN_COURS:"bg-success/10 text-success border-success/20",
  RETARD:"bg-danger/10 text-danger border-danger/20",
  PLANIFIE:"bg-primary/10 text-primary border-primary/20",
  TERMINE:"bg-muted text-muted-fg border-border",
}
const PRIO_STYLE: Record<string,string> = {
  CRITIQUE:"bg-danger/10 text-danger", HAUTE:"bg-warning/10 text-warning",
  NORMALE:"bg-primary/10 text-primary", BASSE:"bg-muted text-muted-fg",
}
const PRIO_TASK: Record<string,string> = {
  CRITIQUE:"bg-danger/10 text-danger border-danger/20",
  HAUTE:"bg-warning/10 text-warning border-warning/20",
  NORMALE:"bg-primary/10 text-primary border-primary/20",
  BASSE:"bg-muted text-muted-fg border-border",
}

const TABS = ["Aperçu","Tâches","Équipe","Documents","Rapports"]

type TaskItem = { id:string; titre:string; statut:string; priorite:string; resp:string; echeance:string; avancement:number }
type DocItem  = { nom:string; type:string; taille:string; version:string; date:string }
type MembreItem = { nom:string; role:string; initiales:string; color:string; taches:number; avancement:number }
type RapportItem = { num:string; date:string; avancement:number; statut:string; effectif:number }

function Toast({ msg, onClose }: { msg:string; onClose:()=>void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease]">
      <CheckCircle2 className="w-4 h-4"/><span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5"/></button>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color }: { icon:React.ReactNode; label:string; value:string; sub:string; color:string }) {
  return (
    <div className="bg-white border border-border rounded-xl shadow-card p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-fg">{label}</p>
        <p className="text-base font-bold text-foreground tabular-nums mt-0.5 truncate">{value}</p>
        <p className="text-xs text-muted-fg mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  )
}

export default function ChantierDetailPage() {
  const { id } = useParams<{ id:string }>()
  const router = useRouter()
  const [tab, setTab] = useState("Aperçu")
  const [toast, setToast] = useState("")
  const photoRef = useRef<HTMLInputElement>(null)

  // Tâches
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id:"t1", titre:"Fondations Zone D — Coulage BA", statut:"A_FAIRE", priorite:"CRITIQUE", resp:"A. Khalil", echeance:"20/05/2025", avancement:0 },
    { id:"t2", titre:"Structure BA Niv.3 — Poteaux P14-P22", statut:"EN_COURS", priorite:"HAUTE", resp:"M. Benhali", echeance:"18/05/2025", avancement:65 },
    { id:"t3", titre:"Installation CFO Zone A", statut:"EN_COURS", priorite:"CRITIQUE", resp:"K. Fassi", echeance:"15/05/2025", avancement:28 },
    { id:"t4", titre:"Contrôle résistance béton Dalle R+2", statut:"TERMINE", priorite:"HAUTE", resp:"S. Alami", echeance:"10/05/2025", avancement:100 },
  ])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ titre:"", priorite:"NORMALE", resp:"A. Khalil", echeance:"" })

  // Documents
  const [docs, setDocs] = useState<DocItem[]>([
    { nom:"Plans Architecturaux R+4", type:"PDF", taille:"12.4 MB", version:"v3.0", date:"14/05" },
    { nom:"Planning Général", type:"XLSX", taille:"1.2 MB", version:"v4", date:"12/05" },
    { nom:"PPSPS Sécurité", type:"PDF", taille:"1.8 MB", version:"v2", date:"01/03" },
  ])
  const [dragOver, setDragOver] = useState(false)

  // Rapports
  const [rapports] = useState<RapportItem[]>([
    { num:"RJ-2025-084", date:"15/05", avancement:63, statut:"BROUILLON", effectif:42 },
    { num:"RJ-2025-083", date:"14/05", avancement:61, statut:"VALIDE", effectif:42 },
    { num:"RJ-2025-082", date:"13/05", avancement:60, statut:"VALIDE", effectif:40 },
    { num:"RJ-2025-081", date:"12/05", avancement:59, statut:"SOUMIS", effectif:38 },
  ])

  const c = CHANTIERS[id]
  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-warning"/>
        <p className="text-foreground font-semibold">Chantier introuvable</p>
        <button onClick={() => router.back()} className="btn-primary"><ArrowLeft className="w-4 h-4"/> Retour</button>
      </div>
    )
  }

  const pctConsomme = Math.round((parseFloat(c.budgetConsomme) / parseFloat(c.budget)) * 100)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  function addTask() {
    if (!taskForm.titre.trim()) return
    setTasks(prev => [...prev, {
      id: `t${Date.now()}`, titre: taskForm.titre.trim(),
      statut:"A_FAIRE", priorite:taskForm.priorite,
      resp:taskForm.resp, echeance:taskForm.echeance, avancement:0,
    }])
    setTaskForm({ titre:"", priorite:"NORMALE", resp:"A. Khalil", echeance:"" })
    setShowTaskForm(false)
    showToast("Tâche ajoutée")
  }

  function processFiles(files: FileList | File[]) {
    Array.from(files).forEach(f => {
      const ext = f.name.split(".").pop()?.toUpperCase() ?? "FILE"
      const taille = f.size > 1e6 ? `${(f.size/1e6).toFixed(1)} MB` : `${(f.size/1e3).toFixed(0)} KB`
      const now = new Date()
      setDocs(prev => [{
        nom: f.name.replace(/\.[^.]+$/,""), type:ext,
        taille, version:"v1.0",
        date:`${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}`,
      }, ...prev])
    })
    showToast("Document(s) ajouté(s)")
  }

  const membres: MembreItem[] = [
    { nom:c.responsable, role:"Chef de chantier", initiales:c.initiales, color:c.color, taches:12, avancement:78 },
    { nom:"K. Fassi", role:"Ingénieur structure", initiales:"KF", color:"#E2445C", taches:8, avancement:55 },
    { nom:"S. Alami", role:"Chef d'équipe électricité", initiales:"SA", color:"#00C875", taches:6, avancement:90 },
    { nom:"M. Benhali", role:"Conducteur de travaux", initiales:"MB", color:"#FDAB3D", taches:10, avancement:63 },
  ]

  return (
    <div className="space-y-5 page-enter">
      {toast && <Toast msg={toast} onClose={() => setToast("")}/>}

      {/* ── HEADER ── */}
      <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="h-1.5 w-full" style={{ background:c.color }}/>
        <div className="px-6 py-5">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4"/>Chantiers
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUT_STYLE[c.statut]}`}>{STATUT_LABEL[c.statut]}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIO_STYLE[c.priorite]}`}>{c.priorite}</span>
              <button onClick={() => showToast("Paramètres du chantier")} className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-fg"><Settings className="w-4 h-4"/></button>
              <button onClick={() => showToast("Options supplémentaires")} className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-fg"><MoreHorizontal className="w-4 h-4"/></button>
              <button onClick={() => { setTab("Tâches"); setShowTaskForm(true) }} className="btn-primary">
                <Plus className="w-4 h-4" strokeWidth={2.5}/> Nouveau
              </button>
            </div>
          </div>
          {/* Titre */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background:c.color+"20", color:c.color }}>{c.initiales}</div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{c.nom}</h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-fg">
                  <span className="font-mono">{c.code}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{c.localisation}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{c.debut} → {c.fin}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-muted-fg mb-1">Responsable</p>
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:c.color+"20", color:c.color }}>{c.initiales}</div>
                  <span className="text-sm font-semibold text-foreground">{c.responsable}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-fg mb-1">Équipe</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3,Math.ceil(c.equipe/15)))].map((_,i)=>(
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                        style={{ background:["#635BFF","#00C875","#FDAB3D"][i] }}><User className="w-3 h-3"/></div>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">+{c.equipe}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-fg mb-1">Réseau</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block"/>
                  <span className="text-sm font-semibold text-success">En ligne</span>
                </div>
              </div>
            </div>
          </div>
          {/* Avancement */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-foreground">Avancement global</span>
              <span className="text-xs font-bold tabular-nums" style={{ color:c.color }}>{c.avancement}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width:`${c.avancement}%`, background:c.color }}/>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-fg">Début : {c.debut}</span>
              {c.retard!=="—" && <span className="text-xs text-danger font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>Retard {c.retard}</span>}
              <span className="text-xs text-muted-fg">Fin : {c.fin}</span>
            </div>
          </div>
        </div>
        {/* Onglets */}
        <div className="border-t border-border px-6 flex gap-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab===t?"border-primary text-primary":"border-transparent text-muted-fg hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<CheckCircle2 className="w-5 h-5 text-success"/>} label="Tâches terminées" value={`${c.taches.done} / ${c.taches.total}`} sub={`${Math.round((c.taches.done/c.taches.total)*100)}% complétées`} color="bg-success/10"/>
        <KpiCard icon={<Clock className="w-5 h-5 text-primary"/>} label="En cours" value={String(c.taches.en_cours)} sub={`${c.taches.bloquees} bloquée${c.taches.bloquees>1?"s":""}`} color="bg-primary/10"/>
        <KpiCard icon={<DollarSign className="w-5 h-5 text-warning"/>} label="Budget consommé" value={c.budgetConsomme} sub={`${pctConsomme}% de ${c.budget}`} color="bg-warning/10"/>
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-danger"/>} label="Incidents HSE" value={String(c.incidents)} sub={c.incidents===0?"Aucun incident":`${c.incidents} signalé${c.incidents>1?"s":""}`} color="bg-danger/10"/>
      </div>

      {/* ── APERÇU ── */}
      {tab==="Aperçu" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-muted-fg"/>Description</h3>
            <p className="text-sm text-muted-fg leading-relaxed">{c.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[["Code projet",c.code,true],["Localisation",c.localisation,false],["Date début",c.debut,false],["Date fin prévue",c.fin,false],["Budget total",c.budget,false],["Budget consommé",c.budgetConsomme,false]].map(([l,v,mono])=>(
                <div key={l as string} className="bg-muted/40 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-muted-fg">{l}</p>
                  <p className={`text-sm font-semibold text-foreground mt-0.5 ${mono?"font-mono":""}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-muted-fg"/>Répartition tâches</h3>
            <div className="space-y-3">
              {[["Terminées",c.taches.done,c.taches.total,"#00C875"],["En cours",c.taches.en_cours,c.taches.total,"#635BFF"],["Bloquées",c.taches.bloquees,c.taches.total,"#E2445C"]].map(([l,n,tot,col])=>(
                <div key={l as string}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-fg">{l}</span>
                    <span className="font-semibold tabular-nums" style={{color:col as string}}>{n as number}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${Math.round((n as number/(tot as number))*100)}%`,background:col as string}}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-fg"/>
              <span className="text-muted-fg">Équipe :</span>
              <span className="font-bold text-foreground">{c.equipe} personnes</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TÂCHES ── */}
      {tab==="Tâches" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-fg">{tasks.length} tâches · {tasks.filter(t=>t.statut==="TERMINE").length} terminées</p>
            <button onClick={() => setShowTaskForm(v => !v)} className="btn-primary">
              <Plus className="w-4 h-4"/>{showTaskForm?"Fermer":"Nouvelle tâche"}
            </button>
          </div>
          {showTaskForm && (
            <div className="bg-white border border-primary/30 rounded-xl p-5 shadow-card">
              <h3 className="font-bold text-sm text-foreground mb-4">Ajouter une tâche</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-fg block mb-1.5">Titre <span className="text-danger">*</span></label>
                  <input value={taskForm.titre} onChange={e=>setTaskForm(f=>({...f,titre:e.target.value}))} placeholder="Ex: Coulage dalle Niveau 4" className="input"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-fg block mb-1.5">Priorité</label>
                  <select value={taskForm.priorite} onChange={e=>setTaskForm(f=>({...f,priorite:e.target.value}))} className="input">
                    <option value="CRITIQUE">CRITIQUE</option><option value="HAUTE">HAUTE</option>
                    <option value="NORMALE">NORMALE</option><option value="BASSE">BASSE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-fg block mb-1.5">Responsable</label>
                  <select value={taskForm.resp} onChange={e=>setTaskForm(f=>({...f,resp:e.target.value}))} className="input">
                    <option>A. Khalil</option><option>K. Fassi</option><option>S. Alami</option><option>M. Benhali</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-fg block mb-1.5">Échéance</label>
                  <input type="date" value={taskForm.echeance} onChange={e=>setTaskForm(f=>({...f,echeance:e.target.value}))} className="input"/>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowTaskForm(false)} className="btn-outline">Annuler</button>
                <button onClick={addTask} className="btn-primary"><Plus className="w-4 h-4"/>Créer</button>
              </div>
            </div>
          )}
          <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <button onClick={() => { setTasks(prev=>prev.map(x=>x.id===t.id?{...x,statut:x.statut==="TERMINE"?"A_FAIRE":"TERMINE",avancement:x.statut==="TERMINE"?0:100}:x)); showToast("Statut mis à jour") }}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${t.statut==="TERMINE"?"bg-success border-success":"border-border hover:border-success"}`}>
                    {t.statut==="TERMINE"&&<CheckCircle2 className="w-3 h-3 text-white"/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${t.statut==="TERMINE"?"line-through text-muted-fg":"text-foreground"}`}>{t.titre}</p>
                    <p className="text-xs text-muted-fg mt-0.5">{t.resp}{t.echeance?` · Éch. ${t.echeance}`:""}</p>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${t.avancement}%`,background:t.avancement===100?"#00C875":t.avancement>50?"#635BFF":"#FDAB3D"}}/>
                    </div>
                    <p className="text-xs text-muted-fg text-right mt-0.5">{t.avancement}%</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 ${PRIO_TASK[t.priorite]}`}>{t.priorite}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${t.statut==="TERMINE"?"bg-success/10 text-success":t.statut==="EN_COURS"?"bg-primary/10 text-primary":"bg-muted text-muted-fg"}`}>{t.statut.replace("_"," ")}</span>
                  <button onClick={() => { setTasks(prev=>prev.filter(x=>x.id!==t.id)); showToast("Tâche supprimée") }}
                    className="text-muted-fg/40 hover:text-danger transition-colors flex-shrink-0"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ÉQUIPE ── */}
      {tab==="Équipe" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-fg">{membres.length} membres actifs · {c.equipe} personnes au total</p>
            <button onClick={() => showToast("Invitation envoyée")} className="btn-primary"><Plus className="w-4 h-4"/>Inviter membre</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {membres.map(m => (
              <div key={m.nom} className="bg-white border border-border rounded-xl shadow-card p-4 flex items-start gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{background:m.color+"20",color:m.color}}>{m.initiales}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{m.nom}</p>
                  <p className="text-xs text-muted-fg mb-2">{m.role}</p>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-fg">{m.taches} tâches</span>
                    <span className="font-semibold" style={{color:m.color}}>{m.avancement}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${m.avancement}%`,background:m.color}}/>
                  </div>
                </div>
                <button onClick={() => showToast(`Message envoyé à ${m.nom}`)}
                  className="text-xs border border-border px-2.5 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors flex-shrink-0">
                  Message
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="font-bold text-sm text-foreground mb-3">Répartition des corps de métier</h3>
            <div className="space-y-2">
              {[["Gros œuvre (maçons, coffreurs)",c.equipe*0.45],["Ferraillage / BA",c.equipe*0.2],["Électricité",c.equipe*0.12],["Plomberie",c.equipe*0.1],["Finitions",c.equipe*0.08],["Encadrement",c.equipe*0.05]].map(([nom,n])=>(
                <div key={nom as string} className="flex items-center gap-3">
                  <span className="text-xs text-muted-fg w-40 flex-shrink-0">{nom}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{width:`${Math.round((n as number/c.equipe)*100)}%`}}/>
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{Math.round(n as number)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENTS ── */}
      {tab==="Documents" && (
        <div className="space-y-4">
          <input ref={photoRef} type="file" multiple accept=".pdf,.xlsx,.dwg,.dxf,.jpg,.png,.zip" className="hidden"
            onChange={e => { if(e.target.files) processFiles(e.target.files); e.target.value="" }}/>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-fg">{docs.length} documents</p>
            <button onClick={() => photoRef.current?.click()} className="btn-primary"><Upload className="w-4 h-4"/>Uploader</button>
          </div>
          <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver?"border-primary bg-primary/5":"border-border hover:border-primary/50"}`}
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);processFiles(e.dataTransfer.files)}}
            onClick={()=>photoRef.current?.click()}>
            <Upload className={`w-7 h-7 mx-auto mb-2 ${dragOver?"text-primary":"text-muted-fg"}`}/>
            <p className="text-sm text-muted-fg">{dragOver?"Relâchez ici":"Glisser-déposer ou cliquer"}</p>
            <p className="text-xs text-muted-fg mt-1">PDF · DWG · XLSX · JPG · ZIP — max 50 Mo</p>
          </div>
          <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {docs.map((d,i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <span className="text-xl">{d.type==="PDF"?"📄":d.type==="XLSX"?"📊":d.type==="ZIP"?"📦":"📐"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{d.nom}</p>
                    <p className="text-xs text-muted-fg">{d.type} · {d.taille} · {d.version} · {d.date}</p>
                  </div>
                  <button onClick={() => showToast(`Téléchargement de ${d.nom}`)}
                    className="p-1.5 rounded-lg border border-border hover:border-success hover:text-success text-muted-fg transition-colors">
                    <Download className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => { setDocs(prev=>prev.filter((_,j)=>j!==i)); showToast("Document supprimé") }}
                    className="text-muted-fg/40 hover:text-danger transition-colors"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RAPPORTS ── */}
      {tab==="Rapports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-fg">{rapports.length} rapports journaliers</p>
            <button onClick={() => router.push("/rapports")} className="btn-primary"><Plus className="w-4 h-4"/>Nouveau rapport</button>
          </div>
          <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {rapports.map(r => (
                <div key={r.num} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <FileText className="w-5 h-5 text-muted-fg flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.num}</p>
                    <p className="text-xs text-muted-fg">{r.date} · {r.effectif} ouvriers · Avancement {r.avancement}%</p>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{width:`${r.avancement}%`}}/>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${r.statut==="VALIDE"?"bg-success/10 text-success":r.statut==="SOUMIS"?"bg-warning/10 text-warning":"bg-muted text-muted-fg"}`}>
                    {r.statut}
                  </span>
                  <button onClick={() => showToast(`Export PDF de ${r.num}`)}
                    className="p-1.5 rounded-lg border border-border hover:border-primary hover:text-primary text-muted-fg transition-colors">
                    <Printer className="w-3.5 h-3.5"/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
