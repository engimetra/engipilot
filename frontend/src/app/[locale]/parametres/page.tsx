"use client"
import { useState } from "react"
import { CheckCircle, X, Eye, EyeOff, Save, Shield, Bell, Plug, User, Lock, ChevronRight, Wifi, WifiOff, Settings, RefreshCw, ExternalLink } from "lucide-react"
import { useStore } from "@/store/useStore"

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
      padding: "12px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px",
      background: ok ? "#166534" : "#991b1b", color: "#fff",
      boxShadow: "0 4px 24px rgba(0,0,0,0.18)", animation: "slideDown 0.2s ease",
    }}>
      {ok ? <CheckCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} /> : <X style={{ width: "16px", height: "16px", flexShrink: 0 }} />}
      <span style={{ fontSize: "13px", fontWeight: 600 }}>{msg}</span>
      <button onClick={onClose} style={{ marginLeft: "8px", opacity: 0.7, background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X style={{ width: "14px", height: "14px" }} /></button>
    </div>
  )
}

const TABS = [
  { id: "profil",        label: "Mon profil",     icon: User   },
  { id: "securite",      label: "Sécurité",       icon: Lock   },
  { id: "notifications", label: "Notifications",  icon: Bell   },
  { id: "integrations",  label: "Intégrations",   icon: Plug   },
  { id: "roles",         label: "Rôles & Accès",  icon: Shield },
]

export default function ParametresPage() {
  const { user } = useStore()
  const [tab, setTab] = useState("profil")
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Profil
  const [nom, setNom]     = useState(user ? `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() : "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [tel, setTel]     = useState("")
  const [poste, setPoste] = useState("")

  // Sécurité
  const [showPwd, setShowPwd]       = useState(false)
  const [pwdActuel, setPwdActuel]   = useState("")
  const [pwdNouveau, setPwdNouveau] = useState("")
  const [twoFA, setTwoFA]           = useState(false)
  const [pwdErrors, setPwdErrors]   = useState<string[]>([])

  // Notifications
  const [notifs, setNotifs] = useState({ ia: true, hse: true, rapports: true, taches: true, hebdo: false })

  // Intégrations
  const [integrations, setIntegrations] = useState({
    drive:   { connected: true,  label: "Google Drive",      desc: "Synchronisation des documents de chantier",          color: "#0f9d58", bg: "#f0fdf4", border: "#86efac" },
    smtp:    { connected: true,  label: "Outlook / SMTP",    desc: "Envoi d'emails automatiques et notifications",        color: "#0078d4", bg: "#eff6ff", border: "#93c5fd" },
    autocad: { connected: false, label: "Export AutoCAD PDF", desc: "Génération de plans PDF depuis fichiers DWG/DXF",    color: "#e5472d", bg: "#fff7ed", border: "#fdba74" },
    erp:     { connected: false, label: "API ERP / SAP",     desc: "Synchronisation budgets et ressources avec l'ERP",   color: "#1e293b", bg: "#f8fafc", border: "#cbd5e1" },
  })
  const [smtpModal, setSmtpModal] = useState(false)
  const [smtpForm, setSmtpForm]   = useState({ host: "smtp.office365.com", port: "587", user: "", pass: "", from: "" })
  const [erpModal,  setErpModal]  = useState(false)
  const [erpForm,   setErpForm]   = useState({ url: "", apiKey: "", client: "" })

  function toggleIntegration(key: keyof typeof integrations) {
    const itg = integrations[key]
    if (itg.connected) {
      setIntegrations(s => ({ ...s, [key]: { ...itg, connected: false } }))
      showToast(`${itg.label} déconnecté`)
    } else {
      if (key === "smtp")   { setSmtpModal(true); return }
      if (key === "erp")    { setErpModal(true);  return }
      setIntegrations(s => ({ ...s, [key]: { ...itg, connected: true } }))
      showToast(`${itg.label} connecté`)
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const initials = nom.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase() || "U"
  const role = user?.role ?? ""

  const roleColor: Record<string, string> = {
    ADMIN: "#7c3aed", SUPER_ADMIN: "#7c3aed",
    CHEF_PROJET: "#1d4ed8", CHEF_CHANTIER: "#0369a1",
    CONSULTANT: "#0f766e", LECTEUR: "#6b7280",
  }
  const avatarBg = roleColor[role] ?? "#1d4ed8"

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
    showToast("Mot de passe mis à jour avec succès")
  }

  const pwdStrength = pwdNouveau.length === 0 ? 0 : pwdNouveau.length < 6 ? 1 : pwdNouveau.length < 8 ? 2 : pwdNouveau.length < 12 ? 3 : 4
  const pwdStrengthColor = ["#e5e7eb", "#dc2626", "#f59e0b", "#2563eb", "#16a34a"][pwdStrength]
  const pwdStrengthLabel = ["", "Très faible", "Faible", "Moyen", "Fort"][pwdStrength]

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }} className="page-enter">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 className="page-title">Paramètres</h1>
        <p style={{ fontSize: "13px", color: "var(--color-muted-fg)", marginTop: "4px" }}>
          Gérez votre profil, sécurité et préférences
        </p>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

        {/* Sidebar tabs */}
        <div style={{ width: "220px", flexShrink: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

          {/* Avatar card */}
          <div style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #f1f5f9", marginBottom: "8px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: `linear-gradient(135deg, ${avatarBg} 0%, #0ea5e9 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "#fff", margin: "0 auto 10px", boxShadow: `0 4px 16px ${avatarBg}55` }}>
              {initials}
            </div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{nom || "Utilisateur"}</p>
            <span style={{ fontSize: "10px", fontWeight: 700, background: avatarBg, color: "#fff", padding: "2px 10px", borderRadius: "99px", display: "inline-block", marginTop: "4px" }}>
              {role.replace(/_/g, " ")}
            </span>
          </div>

          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? "#1d4ed8" : "#475569", background: active ? "#eff6ff" : "transparent", marginBottom: "2px", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f8fafc" }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
              >
                <Icon style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                {t.label}
                {active && <ChevronRight style={{ width: "13px", height: "13px", marginLeft: "auto" }} />}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── PROFIL ── */}
          {tab === "profil" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#fff", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{nom || "Utilisateur"}</p>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", marginTop: "2px" }}>{email}</p>
                    <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 10px", borderRadius: "99px", marginTop: "6px", display: "inline-block", border: "1px solid rgba(255,255,255,0.35)" }}>
                      {role.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nom complet</label>
                    <input value={nom} onChange={e => setNom(e.target.value)} className="input" style={{ width: "100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Poste / Fonction</label>
                    <input value={poste} onChange={e => setPoste(e.target.value)} placeholder="Ex: Chef de Chantier" className="input" style={{ width: "100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email professionnel</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" style={{ width: "100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Téléphone</label>
                    <input type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="+212 6 XX XX XX XX" className="input" style={{ width: "100%" }} />
                  </div>
                </div>
                <button onClick={saveProfile} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1e40af")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1d4ed8")}
                >
                  <Save style={{ width: "14px", height: "14px" }} /> Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* ── SÉCURITÉ ── */}
          {tab === "securite" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield style={{ width: "16px", height: "16px", color: "#1d4ed8" }} /> Sécurité du compte
              </h3>

              <div style={{ display: "grid", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mot de passe actuel</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPwd ? "text" : "password"} value={pwdActuel} onChange={e => setPwdActuel(e.target.value)}
                      className={`input ${pwdErrors.includes("Mot de passe actuel requis") ? "border-danger" : ""}`} style={{ width: "100%", paddingRight: "40px" }} />
                    <button onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                      {showPwd ? <EyeOff style={{ width: "15px", height: "15px" }} /> : <Eye style={{ width: "15px", height: "15px" }} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nouveau mot de passe</label>
                  <input type={showPwd ? "text" : "password"} value={pwdNouveau} onChange={e => setPwdNouveau(e.target.value)}
                    placeholder="Minimum 8 caractères..." className="input" style={{ width: "100%" }} />
                  {pwdNouveau.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                        {[1,2,3,4].map(n => (
                          <div key={n} style={{ height: "4px", flex: 1, borderRadius: "99px", background: n <= pwdStrength ? pwdStrengthColor : "#e2e8f0", transition: "background 0.2s" }} />
                        ))}
                      </div>
                      <p style={{ fontSize: "11px", color: pwdStrengthColor, fontWeight: 600 }}>{pwdStrengthLabel}</p>
                    </div>
                  )}
                </div>
              </div>

              {pwdErrors.length > 0 && (
                <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#fee2e2", borderRadius: "8px", border: "1px solid #fca5a5" }}>
                  {pwdErrors.map((e, i) => <p key={i} style={{ fontSize: "12px", color: "#dc2626", fontWeight: 500 }}>{e}</p>)}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Authentification 2FA</p>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Sécurisez votre compte avec un code SMS</p>
                </div>
                <button onClick={() => { setTwoFA(v => !v); showToast(`2FA ${!twoFA ? "activée" : "désactivée"}`) }}
                  style={{ width: "44px", height: "24px", borderRadius: "99px", border: "none", cursor: "pointer", position: "relative", background: twoFA ? "#1d4ed8" : "#cbd5e1", transition: "background 0.2s", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: "3px", width: "18px", height: "18px", background: "#fff", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", left: twoFA ? "23px" : "3px" }} />
                </button>
              </div>

              <button onClick={savePassword} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1e40af")}
                onMouseLeave={e => (e.currentTarget.style.background = "#1d4ed8")}
              >
                <Shield style={{ width: "14px", height: "14px" }} /> Changer le mot de passe
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell style={{ width: "16px", height: "16px", color: "#1d4ed8" }} /> Préférences de notifications
              </h3>
              <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
                {([
                  ["ia",       "🤖", "Alertes IA temps réel",       "Retards, anomalies, dépassements budgétaires"],
                  ["hse",      "🦺", "Incidents HSE",                "Notification immédiate lors d'un incident"],
                  ["rapports", "📄", "Validation de rapports",       "Quand un rapport est approuvé ou rejeté"],
                  ["taches",   "📋", "Nouvelles tâches assignées",   "Tâches qui vous sont attribuées"],
                  ["hebdo",    "📊", "Résumé hebdomadaire",          "Rapport synthèse envoyé chaque lundi matin"],
                ] as const).map(([k, emoji, titre, desc]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: notifs[k] ? "#eff6ff" : "#f8fafc", borderRadius: "12px", border: `1px solid ${notifs[k] ? "#bfdbfe" : "#e2e8f0"}`, transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "18px" }}>{emoji}</span>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{titre}</p>
                        <p style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>{desc}</p>
                      </div>
                    </div>
                    <button onClick={() => { setNotifs(s => ({ ...s, [k]: !s[k] })); showToast(`Notification "${titre}" ${!notifs[k] ? "activée" : "désactivée"}`) }}
                      style={{ width: "44px", height: "24px", borderRadius: "99px", border: "none", cursor: "pointer", position: "relative", background: notifs[k] ? "#1d4ed8" : "#cbd5e1", transition: "background 0.2s", flexShrink: 0 }}>
                      <span style={{ position: "absolute", top: "3px", width: "18px", height: "18px", background: "#fff", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", left: notifs[k] ? "23px" : "3px" }} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => showToast("Préférences de notification enregistrées")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1e40af")}
                onMouseLeave={e => (e.currentTarget.style.background = "#1d4ed8")}
              >
                <Save style={{ width: "14px", height: "14px" }} /> Enregistrer les préférences
              </button>
            </div>
          )}

          {/* ── INTÉGRATIONS ── */}
          {tab === "integrations" && (
            <div style={{ display: "grid", gap: "12px" }}>
              {/* Header card */}
              <div style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)", borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Plug style={{ width: "16px", height: "16px" }} /> Intégrations & Connecteurs
                  </h3>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>
                    {Object.values(integrations).filter(i => i.connected).length} / {Object.values(integrations).length} connecteurs actifs
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {Object.entries(integrations).map(([k, v]) => (
                    <div key={k} title={v.label} style={{ width: "10px", height: "10px", borderRadius: "50%", background: v.connected ? "#4ade80" : "rgba(255,255,255,0.3)", border: "2px solid rgba(255,255,255,0.5)" }} />
                  ))}
                </div>
              </div>

              {/* Integration cards */}
              {(Object.entries(integrations) as [keyof typeof integrations, typeof integrations[keyof typeof integrations]][]).map(([key, itg]) => {
                const icons: Record<string, string> = { drive: "📁", smtp: "📧", autocad: "📐", erp: "🔗" }
                const actionLabels: Record<string, [string, string]> = {
                  drive:   ["Déconnecter", "Connecter"],
                  smtp:    ["Configurer",  "Configurer"],
                  autocad: ["Configurer",  "Configurer"],
                  erp:     ["Configurer",  "Connecter"],
                }
                const [labelOn, labelOff] = actionLabels[key]
                const actionLabel = itg.connected ? labelOn : labelOff

                return (
                  <div key={key} style={{ background: "#fff", border: `1px solid ${itg.connected ? itg.border : "#e2e8f0"}`, borderRadius: "14px", padding: "18px 20px", boxShadow: itg.connected ? `0 0 0 1px ${itg.border}` : "0 1px 4px rgba(0,0,0,0.05)", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: itg.connected ? itg.bg : "#f8fafc", border: `1px solid ${itg.connected ? itg.border : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                          {icons[key]}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{itg.label}</p>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px",
                              color: itg.connected ? itg.color : "#64748b",
                              background: itg.connected ? itg.bg : "#f1f5f9",
                              border: `1px solid ${itg.connected ? itg.border : "#e2e8f0"}` }}>
                              {itg.connected
                                ? <><Wifi style={{ width: "9px", height: "9px" }} /> Connecté</>
                                : <><WifiOff style={{ width: "9px", height: "9px" }} /> Non connecté</>}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>{itg.desc}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        {itg.connected && key !== "drive" && (
                          <button onClick={() => { if (key === "smtp") setSmtpModal(true); if (key === "erp") setErpModal(true); if (key === "autocad") showToast("Module AutoCAD PDF prêt à l'emploi"); }}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#f8fafc")}
                          >
                            <Settings style={{ width: "13px", height: "13px" }} /> Paramètres
                          </button>
                        )}
                        <button onClick={() => toggleIntegration(key)}
                          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 16px", borderRadius: "8px", border: `1px solid ${itg.connected ? "#fca5a5" : itg.border}`, background: itg.connected ? "#fef2f2" : itg.bg, color: itg.connected ? "#dc2626" : itg.color, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "0.8" }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
                        >
                          {itg.connected ? <X style={{ width: "13px", height: "13px" }} /> : <ExternalLink style={{ width: "13px", height: "13px" }} />}
                          {actionLabel}
                        </button>
                      </div>
                    </div>

                    {/* Last sync info */}
                    {itg.connected && (
                      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "6px" }}>
                        <RefreshCw style={{ width: "11px", height: "11px", color: "#94a3b8" }} />
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {key === "drive"   && "Dernière sync : il y a 5 min · 48 fichiers synchronisés"}
                          {key === "smtp"    && "Dernière sync : il y a 12 min · 3 emails envoyés aujourd'hui"}
                          {key === "autocad" && "Module actif · Formats supportés : DWG, DXF, PDF"}
                          {key === "erp"     && "Connexion active · API v3.2"}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* SMTP Modal */}
              {smtpModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSmtpModal(false)}>
                  <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "480px", maxWidth: "90vw", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>📧 Configuration Outlook / SMTP</h3>
                      <button onClick={() => setSmtpModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}><X style={{ width: "14px", height: "14px" }} /></button>
                    </div>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {([["host", "Serveur SMTP", "smtp.office365.com"], ["port", "Port", "587"], ["user", "Nom d'utilisateur", "votre-email@domaine.com"], ["from", "Email expéditeur", "noreply@engipilot.ma"]] as const).map(([field, label, ph]) => (
                        <div key={field}>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>{label}</label>
                          <input value={smtpForm[field as keyof typeof smtpForm]} onChange={e => setSmtpForm(s => ({ ...s, [field]: e.target.value }))}
                            placeholder={ph} className="input" style={{ width: "100%" }} />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>Mot de passe (masqué)</label>
                        <input type="password" value={smtpForm.pass} onChange={e => setSmtpForm(s => ({ ...s, pass: e.target.value }))}
                          placeholder="••••••••" className="input" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button onClick={() => { setSmtpModal(false); setIntegrations(s => ({ ...s, smtp: { ...s.smtp, connected: true } })); showToast("Configuration SMTP enregistrée") }}
                        style={{ flex: 1, padding: "10px", background: "#0078d4", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                        Enregistrer
                      </button>
                      <button onClick={() => { showToast("Connexion SMTP testée avec succès") }}
                        style={{ padding: "10px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                        Tester
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ERP Modal */}
              {erpModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setErpModal(false)}>
                  <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "480px", maxWidth: "90vw", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>🔗 Connexion API ERP / SAP</h3>
                      <button onClick={() => setErpModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer" }}><X style={{ width: "14px", height: "14px" }} /></button>
                    </div>
                    <div style={{ display: "grid", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>URL de l&apos;API</label>
                        <input value={erpForm.url} onChange={e => setErpForm(s => ({ ...s, url: e.target.value }))}
                          placeholder="https://erp.votre-entreprise.com/api" className="input" style={{ width: "100%" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>Clé API</label>
                        <input type="password" value={erpForm.apiKey} onChange={e => setErpForm(s => ({ ...s, apiKey: e.target.value }))}
                          placeholder="••••••••••••" className="input" style={{ width: "100%" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>Client / Mandant SAP</label>
                        <input value={erpForm.client} onChange={e => setErpForm(s => ({ ...s, client: e.target.value }))}
                          placeholder="Ex: 100" className="input" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button onClick={() => { setErpModal(false); setIntegrations(s => ({ ...s, erp: { ...s.erp, connected: true } })); showToast("API ERP connectée avec succès") }}
                        style={{ flex: 1, padding: "10px", background: "#1e293b", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                        Connecter
                      </button>
                      <button onClick={() => showToast("Test de connexion ERP réussi")}
                        style={{ padding: "10px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                        Tester
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RÔLES ── */}
          {tab === "roles" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield style={{ width: "16px", height: "16px", color: "#1d4ed8" }} /> Rôles & Permissions
              </h3>
              <div style={{ display: "grid", gap: "10px" }}>
                {[
                  { role: "ADMIN",         color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", desc: "Accès total, gestion utilisateurs, paramètres organisation" },
                  { role: "CHEF_PROJET",   color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", desc: "Lecture + écriture sur tous les modules, création de chantiers" },
                  { role: "CHEF_CHANTIER", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", desc: "Rapports, tâches, HSE, suivi avancement" },
                  { role: "CONSULTANT",    color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4", desc: "Lecture seule sur tous les modules, export PDF" },
                  { role: "LECTEUR",       color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", desc: "Lecture seule, pas d'export" },
                ].map(r => {
                  const isMe = role === r.role
                  return (
                    <div key={r.role} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: isMe ? r.bg : "#f8fafc", borderRadius: "12px", border: `1px solid ${isMe ? r.border : "#e2e8f0"}`, boxShadow: isMe ? `0 0 0 2px ${r.border}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Shield style={{ width: "16px", height: "16px", color: "#fff" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: r.color }}>{r.role.replace(/_/g, " ")}</p>
                          <p style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>{r.desc}</p>
                        </div>
                      </div>
                      {isMe && <span style={{ fontSize: "11px", fontWeight: 700, background: r.color, color: "#fff", padding: "3px 12px", borderRadius: "99px", flexShrink: 0 }}>Votre rôle</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
