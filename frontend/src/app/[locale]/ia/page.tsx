"use client"
import { useState } from "react"
import dynamic from "next/dynamic"
import { Brain, Zap, Calendar, Wallet, AlertOctagon, CheckCircle2, Cpu, TrendingUp, TrendingDown, Activity, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/Skeleton"

const AILivePredictiveSystem = dynamic(
  () => import("@/components/ia/AILivePredictiveSystem"),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-2xl" /> }
)

const PREDICTIONS = [
  {
    type: "RETARD", chantier: "Usine Bouskoura", flag:"🇲🇦", valeur: "+46j", confiance: 88, niveau: "CRITIQUE",
    desc: "SPI=0.72 et CPI=0.84 indiquent une trajectoire critique. Fin prédite 15/05/2026.",
    reco: "Recruter 4 électriciens intérimaires · Renégocier béton · Clôturer NC-047",
  },
  {
    type: "BUDGET", chantier: "Station Énergie", flag:"🇲🇦", valeur: "+34.8%", confiance: 91, niveau: "CRITIQUE",
    desc: "CPI=0.74 sur 4 semaines. EAC estimé 283M MAD vs BAT 210M.",
    reco: "Audit matériaux béton Zone C · Réviser BAT avec maître d'ouvrage",
  },
  {
    type: "ANOMALIE", chantier: "Résidence Al Andalous", flag:"🇲🇦", valeur: "×1.34 béton", confiance: 84, niveau: "MAJEUR",
    desc: "Consommation béton Zone C supérieure de 34% à la norme.",
    reco: "Vérifier coffrage · Contrôler pertes · Audit sous-traitant béton",
  },
  {
    type: "POSITIF", chantier: "Villas Ain Diab", flag:"🇲🇦", valeur: "Livraison OK", confiance: 95, niveau: "OK",
    desc: "SPI=1.04 et CPI=1.02 — performance excellente. Livraison prédite dans les délais.",
    reco: "Maintenir le rythme · Partager les bonnes pratiques avec les autres équipes",
  },
]

const REGLES = [
  { cond: "SPI < 0.80",     action: "Alerte retard critique + notification chef projet" },
  { cond: "CPI < 0.85",     action: "Alerte dépassement + révision EAC automatique" },
  { cond: "Absence > 20%",  action: "Alerte RH + suggestion recrutement intérimaires" },
  { cond: "NC ouvertes > 3",action: "Blocage avancement + alerte contrôle qualité" },
  { cond: "Incident HSE",   action: "Arrêt tâches liées + rapport déclaratif automatique" },
]

const NIVEAU_CONFIG: Record<string, { wrap:string; badge:string; dot:string }> = {
  CRITIQUE: { wrap:"border-danger/20 bg-danger/[0.04]",   badge:"bg-danger/10 text-danger",   dot:"bg-danger"  },
  MAJEUR:   { wrap:"border-warning/20 bg-warning/[0.04]", badge:"bg-warning/10 text-warning", dot:"bg-warning" },
  OK:       { wrap:"border-success/20 bg-success/[0.04]", badge:"bg-success/10 text-success", dot:"bg-success" },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  RETARD: Calendar, BUDGET: Wallet, ANOMALIE: AlertOctagon, POSITIF: CheckCircle2,
}
const TYPE_COLOR: Record<string, string> = {
  RETARD: "#E2445C", BUDGET: "#E2445C", ANOMALIE: "#FDAB3D", POSITIF: "#00C875",
}

const ML_MODELS = [
  { nom:"Prédiction retards",  type:"Gradient Boosting", acc:88, color:"#635BFF", trend:"+2pts" },
  { nom:"Prédiction coûts",    type:"Random Forest",     acc:91, color:"#00C875", trend:"+1pt"  },
  { nom:"Détection anomalies", type:"Isolation Forest",  acc:84, color:"#8b5cf6", trend:"stable" },
  { nom:"Clustering perf.",    type:"K-Means",           acc:79, color:"#FDAB3D", trend:"-1pt"  },
]

export default function IAPage() {
  const router = useRouter()
  const [activeRules, setActiveRules] = useState<boolean[]>(REGLES.map(() => true))
  const critiques = PREDICTIONS.filter(p => p.niveau === "CRITIQUE").length

  return (
    <div className="space-y-6 page-enter">

      {/* ══ AI LIVE PREDICTIVE SYSTEM ══ */}
      <AILivePredictiveSystem />

      {/* ══ HEADER ══ */}
      <div className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background:"linear-gradient(135deg, #8b5cf608 0%, #ffffff 40%, #635BFF08 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage:"linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="relative px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <Brain className="w-3 h-3" /> 3 modèles actifs
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-2.5 py-1 rounded-full">
                <AlertOctagon className="w-3 h-3" /> {critiques} alertes critiques
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full">
                <Activity className="w-3 h-3" /> Live
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">AI Risk Monitor</h1>
            <p className="text-sm text-muted-fg mt-1">Modèles ML en production · Alertes prédictives · 12 chantiers analysés</p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => router.push("/analytics")}
              className="flex items-center gap-2 bg-white hover:bg-muted border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Analytics
            </button>
            <button
              onClick={() => router.push("/notifications")}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Voir toutes les alertes <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ══ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon:Zap,         label:"Prédictions actives", sublabel:"En production", value:"3",    accent:"#635BFF", accentBg:"bg-primary/10", accentText:"text-primary", spark:[5,6,6,7,7,8,8,3] },
          { icon:AlertOctagon,label:"Alertes critiques",   sublabel:"Action requise", value:"2",   accent:"#E2445C", accentBg:"bg-danger/10",  accentText:"text-danger",  spark:[1,2,1,2,2,3,2,2] },
          { icon:Calendar,    label:"Retard max prédit",   sublabel:"Usine Bouskoura",value:"+46j", accent:"#FDAB3D", accentBg:"bg-warning/10", accentText:"text-warning", spark:[20,28,32,38,40,44,46,46] },
          { icon:CheckCircle2,label:"Confiance moyenne",   sublabel:"Tous modèles",   value:"89%", accent:"#00C875", accentBg:"bg-success/10", accentText:"text-success", spark:[82,84,85,86,87,88,89,89] },
        ].map(k => {
          const Icon = k.icon
          const max = Math.max(...k.spark)
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
                      style={{ height:`${(v/max)*100}%`, background:k.accent, opacity: 0.35 + (i/k.spark.length)*0.65 }} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider mb-0.5">{k.label}</p>
              <p className="text-[10px] text-muted-fg/60 mb-2">{k.sublabel}</p>
              <p className="text-2xl font-black tracking-tight text-foreground">{k.value}</p>
            </div>
          )
        })}
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Predictions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-danger" />
            <h2 className="text-sm font-bold text-foreground">Alertes intelligentes</h2>
            <span className="ml-auto text-[10px] text-muted-fg font-medium">{PREDICTIONS.length} prédictions</span>
          </div>
          <div className="space-y-3">
            {PREDICTIONS.map((p, i) => {
              const cfg = NIVEAU_CONFIG[p.niveau] ?? { wrap:"border-border bg-white", badge:"bg-muted text-muted-fg", dot:"bg-muted" }
              const Icon = TYPE_ICON[p.type]
              const iconColor = TYPE_COLOR[p.type]
              return (
                <div key={i} className={`border rounded-2xl p-4 shadow-card transition-all hover:shadow-card-md ${cfg.wrap}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: iconColor + "15" }}>
                      <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{p.flag}</span>
                          <p className="font-bold text-sm text-foreground">{p.chantier}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {p.niveau}
                          </span>
                          <span className="text-[10px] font-mono text-muted-fg">{p.confiance}%</span>
                        </div>
                      </div>
                      <p className="text-lg font-black text-foreground tracking-tight">{p.valeur}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-fg mb-3 leading-relaxed">{p.desc}</p>
                  <div className="bg-white/80 rounded-xl p-3 border border-border/60">
                    <p className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1.5">
                      <Brain className="w-3 h-3 text-primary" /> Recommandation IA
                    </p>
                    <p className="text-[10px] text-muted-fg leading-relaxed">{p.reco}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* ML Models */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-purple" />
              <h2 className="text-sm font-bold text-foreground">Performance modèles ML</h2>
            </div>
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="space-y-4">
                {ML_MODELS.map(m => (
                  <div key={m.nom}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <div>
                        <span className="font-semibold text-foreground">{m.nom}</span>
                        <span className="text-muted-fg ml-2">{m.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-fg">{m.trend}</span>
                        <span className="font-black" style={{ color: m.color }}>{m.acc}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${m.acc}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
                {[
                  { val:"1,847", label:"Signaux/jour",  color:"text-primary" },
                  { val:"89%",   label:"Précision moy.", color:"text-success" },
                  { val:"12",    label:"Chantiers",      color:"text-teal"    },
                ].map(s => (
                  <div key={s.label} className="text-center bg-muted/50 rounded-xl py-2 px-1">
                    <p className={`text-sm font-black ${s.color}`}>{s.val}</p>
                    <p className="text-[9px] text-muted-fg font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-teal" />
              <h2 className="text-sm font-bold text-foreground">Règles IA actives</h2>
              <span className="ml-auto text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                {activeRules.filter(Boolean).length}/{REGLES.length} actives
              </span>
            </div>
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] text-muted-fg font-medium">Conditions Si/Alors déclenchant les alertes</p>
              </div>
              <div className="divide-y divide-border">
                {REGLES.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-bold text-primary">Si</span>{" "}
                        <span className="text-foreground font-medium">{r.cond}</span>
                      </p>
                      <p className="text-[10px] text-muted-fg mt-0.5 leading-relaxed">→ {r.action}</p>
                    </div>
                    <button
                      onClick={() => setActiveRules(prev => prev.map((a, j) => j === i ? !a : a))}
                      className={`w-9 h-5 rounded-full transition-all duration-200 relative flex-shrink-0 ${activeRules[i] ? "bg-primary" : "bg-border"}`}
                    >
                      <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
                        style={{ left: activeRules[i] ? "calc(100% - 18px)" : "2px" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
