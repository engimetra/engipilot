"use client"
import { useState } from "react"
import { Users, TrendingUp, UserCheck, AlertTriangle, Plus, ChevronRight, Star } from "lucide-react"

const MEMBRES = [
  { initiales:"AK", nom:"Ahmed Khalil",   role:"Chef de chantier",    color:"#635BFF", statut:"Actif",  prod:94, chantier:"Résidence Al Andalous" },
  { initiales:"SA", nom:"Sara Alami",     role:"Ingénieure QC",       color:"#00C875", statut:"Actif",  prod:88, chantier:"Résidence Al Andalous" },
  { initiales:"MB", nom:"Mohamed Benhali",role:"Chef d'équipe BA",    color:"#FDAB3D", statut:"Actif",  prod:91, chantier:"Résidence Al Andalous" },
  { initiales:"YC", nom:"Youssef Chraibi",role:"Électricien chef",    color:"#8b5cf6", statut:"Absent", prod:62, chantier:"Usine Bouskoura" },
  { initiales:"KF", nom:"Karima Fassi",   role:"Conductrice travaux", color:"#E2445C", statut:"Actif",  prod:85, chantier:"Usine Bouskoura" },
  { initiales:"MB2",nom:"Mehdi Benali",   role:"Plombier chef",       color:"#14b8a6", statut:"Actif",  prod:78, chantier:"Tour Hassan II" },
]

const CORPS = [
  { nom:"Maçons / BA",       agents:18, prod:94, color:"#00C875" },
  { nom:"Électriciens",      agents:8,  prod:62, color:"#E2445C" },
  { nom:"Plombiers",         agents:6,  prod:78, color:"#FDAB3D" },
  { nom:"Finisseurs",        agents:4,  prod:88, color:"#635BFF" },
  { nom:"Conducteurs engins",agents:6,  prod:96, color:"#8b5cf6" },
]

const ALERTES_RH = [
  { level:"danger",  title:"Électricité — Absentéisme 38%", action:"Recruter 2 intérimaires cette semaine" },
  { level:"warning", title:"3 habilitations expirent dans 7j", action:"Recyclage HSE requis avant le 25/05" },
]

export default function EquipesPage() {
  const [activeTab, setActiveTab] = useState<"equipe"|"corps">("equipe")

  const totalPresents = MEMBRES.filter(m => m.statut === "Actif").length
  const avgProd = Math.round(MEMBRES.reduce((s, m) => s + m.prod, 0) / MEMBRES.length)

  return (
    <div className="space-y-6 page-enter">

      {/* ══ HEADER ══ */}
      <div className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(135deg, #635BFF08 0%, #ffffff 40%, #8b5cf608 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage:"linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="relative px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <Users className="w-3 h-3" /> 284 agents actifs
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-purple/10 text-purple border border-purple/20 px-2.5 py-1 rounded-full">
                <Star className="w-3 h-3" /> 5 corps de métier
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">Access Control & Workforce</h1>
            <p className="text-sm text-muted-fg mt-1">Gestion des équipes · Productivité · Alertes RH · 3 chantiers actifs</p>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 self-start lg:self-auto">
            <Plus className="w-3.5 h-3.5" /> Ajouter membre
          </button>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon:Users,      label:"Effectif total",      sublabel:"Tous chantiers",  value:"284",   delta:"+12 ce mois", up:true,  accent:"#635BFF", accentBg:"bg-primary/10", accentText:"text-primary" },
          { icon:UserCheck,  label:"Présents aujourd'hui",sublabel:`${Math.round(totalPresents/MEMBRES.length*100)}% taux présence`, value:"241",   delta:"+5 vs hier",  up:true,  accent:"#00C875", accentBg:"bg-success/10", accentText:"text-success" },
          { icon:TrendingUp, label:"Productivité moyenne", sublabel:"Tous corps de métier", value:`${avgProd}%`, delta:"+3 pts ce mois", up:true, accent:"#FDAB3D", accentBg:"bg-warning/10",  accentText:"text-warning"  },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="group relative bg-white border border-border rounded-2xl p-5 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
              <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: k.accent }} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.accentBg}`}>
                  <Icon className={`w-4 h-4 ${k.accentText}`} strokeWidth={2} />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider mb-0.5">{k.label}</p>
              <p className="text-[10px] text-muted-fg/60 mb-2">{k.sublabel}</p>
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

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Membres */}
        <div className="xl:col-span-2 bg-white border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-primary" />
              <h3 className="font-bold text-sm text-foreground">Membres de l'équipe</h3>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-border text-[10px] font-semibold">
              {(["equipe","corps"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 transition-colors ${activeTab===t?"bg-primary text-white":"text-muted-fg hover:text-foreground"}`}>
                  {t==="equipe"?"Équipe":"Corps de métier"}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "equipe" && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MEMBRES.map(m => {
                const prodColor = m.prod >= 85 ? "#00C875" : m.prod >= 70 ? "#FDAB3D" : "#E2445C"
                return (
                  <div key={m.initiales}
                    className="border border-border rounded-xl p-3.5 text-center hover:border-primary/30 hover:shadow-card transition-all duration-150 cursor-pointer group">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black mx-auto mb-2.5 transition-transform group-hover:scale-110"
                      style={{ background: m.color + "20", color: m.color }}>
                      {m.initiales}
                    </div>
                    <p className="text-xs font-bold text-foreground leading-tight">{m.nom}</p>
                    <p className="text-[10px] text-muted-fg mt-0.5">{m.role}</p>
                    <p className="text-[10px] text-muted-fg/70">{m.chantier.split(" ")[0]}</p>
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width:`${m.prod}%`, background: prodColor }} />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: prodColor }}>{m.prod}%</span>
                      </div>
                      <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full
                        ${m.statut==="Absent"?"bg-danger/10 text-danger":"bg-success/10 text-success"}`}>
                        {m.statut}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div className="border-2 border-dashed border-border rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-primary/40 transition-colors">
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-4 h-4 text-muted-fg" />
                </div>
                <p className="text-[10px] text-muted-fg font-medium">Ajouter membre</p>
              </div>
            </div>
          )}

          {activeTab === "corps" && (
            <div className="p-5 space-y-4">
              {CORPS.map(c => {
                const prodColor = c.prod >= 85 ? "#00C875" : c.prod >= 70 ? "#FDAB3D" : "#E2445C"
                return (
                  <div key={c.nom} className="flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-border/50">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.color + "18" }}>
                      <Users className="w-4 h-4" style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">{c.nom}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-fg">{c.agents} agents</span>
                          <span className="text-xs font-black" style={{ color: prodColor }}>{c.prod}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${c.prod}%`, background: c.color }} />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-fg/40 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Répartition par chantier */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-teal" />
              <h3 className="font-bold text-sm text-foreground">Par chantier</h3>
            </div>
            <div className="space-y-3">
              {[
                { name:"Résidence Al Andalous", agents:120, color:"#635BFF", pct:42 },
                { name:"Usine Bouskoura",        agents:64,  color:"#E2445C", pct:23 },
                { name:"Tour Hassan II",         agents:87,  color:"#FDAB3D", pct:31 },
                { name:"Autres sites",           agents:13,  color:"#9CA3AF", pct:5  },
              ].map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-fg truncate flex-1">{s.name}</span>
                    <span className="font-bold text-foreground ml-2">{s.agents}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes RH */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-danger" />
              <h3 className="font-bold text-sm text-foreground">Alertes RH</h3>
              <span className="ml-auto text-[9px] font-bold bg-danger/10 text-danger px-1.5 py-0.5 rounded-full">{ALERTES_RH.length}</span>
            </div>
            <div className="space-y-2.5">
              {ALERTES_RH.map((a, i) => (
                <div key={i} className={`p-3 rounded-xl border ${a.level==="danger"
                  ? "border-danger/20 bg-danger/[0.04]"
                  : "border-warning/20 bg-warning/[0.04]"}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${a.level==="danger"?"text-danger":"text-warning"}`} strokeWidth={2.5} />
                    <div>
                      <p className={`text-xs font-bold ${a.level==="danger"?"text-danger":"text-warning"}`}>{a.title}</p>
                      <p className="text-[10px] text-muted-fg mt-0.5">{a.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Présences récentes */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-success" />
              <h3 className="font-bold text-sm text-foreground">Présences — semaine</h3>
            </div>
            <div className="space-y-1.5">
              {[
                { jour:"Lun", pct:92 }, { jour:"Mar", pct:88 }, { jour:"Mer", pct:95 },
                { jour:"Jeu", pct:85 }, { jour:"Ven", pct:91 },
              ].map(d => (
                <div key={d.jour} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-fg font-medium w-6">{d.jour}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width:`${d.pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-foreground tabular-nums w-7 text-right">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
