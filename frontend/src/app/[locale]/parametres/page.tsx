"use client"
import { useState } from "react"
import { CheckCircle, X, Eye, EyeOff, Save, Shield, Bell, Plug } from "lucide-react"

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease] text-white ${ok ? "bg-success" : "bg-danger"}`}>
      {ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

export default function ParametresPage() {
  const [notifState, setNotifState] = useState({ ia:true, hse:true, rapports:true, taches:true, hebdo:false })
  const [twoFA, setTwoFA] = useState(true)
  const [showPwd, setShowPwd] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Profil
  const [nom, setNom] = useState("Ahmed Khalil")
  const [email, setEmail] = useState("ahmed.khalil@engipilot.ma")
  const [tel, setTel] = useState("+212 6 61 23 45 67")

  // Mot de passe
  const [pwdActuel, setPwdActuel] = useState("")
  const [pwdNouveau, setPwdNouveau] = useState("")
  const [pwdErrors, setPwdErrors] = useState<string[]>([])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function saveProfile() {
    if (!nom.trim()) { showToast("Le nom ne peut pas être vide", false); return }
    if (!email.includes("@")) { showToast("Email invalide", false); return }
    showToast("Profil enregistré avec succès")
  }

  function savePassword() {
    const errs: string[] = []
    if (!pwdActuel) errs.push("Mot de passe actuel requis")
    if (pwdNouveau.length < 8) errs.push("Le nouveau mot de passe doit comporter au moins 8 caractères")
    setPwdErrors(errs)
    if (errs.length) return
    setPwdActuel(""); setPwdNouveau("")
    showToast("Mot de passe mis à jour")
  }

  return (
    <div className="space-y-5 max-w-4xl page-enter">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      <div>
        <h1 className="page-title">Paramètres</h1>
        <p className="text-sm text-muted-fg mt-0.5">Profil · Sécurité · Notifications · Intégrations</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* ── COL GAUCHE ── */}
        <div className="space-y-4">

          {/* Profil */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-4 text-foreground">Mon profil</h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0">
                {nom.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground">{nom}</p>
                <p className="text-sm text-muted-fg">Chef de Chantier · Résidence Al Andalous</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Chef Chantier</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1">Nom complet</label>
                <input value={nom} onChange={e => setNom(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1">Téléphone</label>
                <input type="tel" value={tel} onChange={e => setTel(e.target.value)} className="input" />
              </div>
            </div>
            <button onClick={saveProfile} className="btn-primary w-full justify-center mt-4">
              <Save className="w-4 h-4" /> Enregistrer les modifications
            </button>
          </div>

          {/* Sécurité */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-4 text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-fg" /> Sécurité
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1">Mot de passe actuel</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={pwdActuel} onChange={e => setPwdActuel(e.target.value)}
                    className={`input pr-10 ${pwdErrors.includes("Mot de passe actuel requis") ? "border-danger" : ""}`} />
                  <button onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-fg block mb-1">Nouveau mot de passe</label>
                <input type={showPwd ? "text" : "password"} value={pwdNouveau} onChange={e => setPwdNouveau(e.target.value)}
                  placeholder="Minimum 8 caractères..."
                  className={`input ${pwdErrors.some(e => e.includes("nouveau")) ? "border-danger" : ""}`} />
                {pwdNouveau.length > 0 && (
                  <div className="mt-1.5 flex gap-1">
                    {[4,6,8,10].map(n => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${pwdNouveau.length >= n ? n >= 10 ? "bg-success" : n >= 8 ? "bg-primary" : n >= 6 ? "bg-warning" : "bg-danger" : "bg-muted"}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {pwdErrors.length > 0 && (
              <div className="mb-3 space-y-1">
                {pwdErrors.map((e, i) => <p key={i} className="text-xs text-danger">{e}</p>)}
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Authentification 2FA</p>
                <p className="text-xs text-muted-fg">Sécurisez avec un code SMS</p>
              </div>
              <button onClick={() => { setTwoFA(v => !v); showToast(`2FA ${!twoFA ? "activée" : "désactivée"}`) }}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${twoFA ? "bg-primary" : "bg-muted border border-border"}`}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow" style={{left: twoFA ? "calc(100% - 18px)" : "2px"}} />
              </button>
            </div>
            <button onClick={savePassword} className="btn-outline w-full justify-center">
              <Shield className="w-4 h-4" /> Changer le mot de passe
            </button>
          </div>
        </div>

        {/* ── COL DROITE ── */}
        <div className="space-y-4">

          {/* Notifications */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-4 text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-fg" /> Notifications
            </h3>
            <div className="space-y-3">
              {([
                ["ia",      "Alertes IA temps réel",       "Retards, anomalies, dépassements"],
                ["hse",     "Incidents HSE",                "Notification immédiate"],
                ["rapports","Validation rapports",          "Quand un rapport est approuvé"],
                ["taches",  "Nouvelles tâches assignées",   "Tâches qui vous sont attribuées"],
                ["hebdo",   "Résumé hebdomadaire",          "Email chaque lundi matin"],
              ] as const).map(([k, t, d]) => (
                <div key={k} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t}</p>
                    <p className="text-xs text-muted-fg">{d}</p>
                  </div>
                  <button
                    onClick={() => {
                      setNotifState(s => ({ ...s, [k]: !s[k] }))
                      showToast(`Notification "${t}" ${!notifState[k] ? "activée" : "désactivée"}`)
                    }}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${notifState[k] ? "bg-primary" : "bg-muted border border-border"}`}
                  >
                    <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow" style={{left: notifState[k] ? "calc(100% - 18px)" : "2px"}} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => showToast("Préférences de notification enregistrées")} className="btn-primary w-full justify-center mt-4">
              <Save className="w-4 h-4" /> Enregistrer les préférences
            </button>
          </div>

          {/* Intégrations */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-4 text-foreground flex items-center gap-2">
              <Plug className="w-4 h-4 text-muted-fg" /> Intégrations
            </h3>
            <div className="space-y-2">
              {[
                { nom:"Google Drive", statut:"Connecté", color:"text-success", bg:"bg-success/10", action:"Déconnecter" },
                { nom:"Outlook / SMTP", statut:"Connecté", color:"text-success", bg:"bg-success/10", action:"Configurer" },
                { nom:"Export AutoCAD PDF", statut:"Configurer", color:"text-warning", bg:"bg-warning/10", action:"Connecter" },
                { nom:"API ERP / SAP", statut:"Non connecté", color:"text-muted-fg", bg:"bg-muted", action:"Connecter" },
              ].map(itg => (
                <div key={itg.nom} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors">
                  <span className="text-sm font-medium text-foreground">{itg.nom}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${itg.bg} ${itg.color}`}>{itg.statut}</span>
                    <button onClick={() => showToast(`${itg.action} ${itg.nom}`)}
                      className="text-xs border border-border px-2.5 py-1 rounded-lg hover:border-primary hover:text-primary transition-colors">
                      {itg.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rôles */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-bold text-sm mb-3 text-foreground">Rôles & Permissions</h3>
            {[
              { role:"ADMIN", desc:"Accès total + gestion users", mine:false },
              { role:"CHEF_PROJET", desc:"Lecture + écriture tous modules", mine:false },
              { role:"CHEF_CHANTIER", desc:"Rapports + tâches + HSE", mine:true },
              { role:"CONSULTANT", desc:"Lecture seule, export PDF", mine:false },
            ].map(r => (
              <div key={r.role} className={`flex items-center justify-between p-2.5 rounded-lg mb-1.5 ${r.mine ? "bg-primary/5 border border-primary/20" : "bg-muted/40"}`}>
                <div>
                  <p className="text-xs font-bold text-foreground">{r.role}</p>
                  <p className="text-xs text-muted-fg">{r.desc}</p>
                </div>
                {r.mine && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-bold">Vous</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
