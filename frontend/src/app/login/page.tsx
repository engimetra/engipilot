"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Eye, EyeOff, Mail, Lock, User, Building2,
  Loader2, AlertCircle, CheckCircle2, ShieldCheck,
  BarChart3, Brain, HardHat, ArrowRight,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import type { RolePlateforme, Utilisateur } from "@/types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BLUE  = "#1E3A8A"
const NAVY  = "#0F172A"
const ORANGE = "#F97316"
type Mode = "login" | "register"
interface Fields {
  fullName: string; orgName: string; email: string
  password: string; confirmPassword: string; rememberMe: boolean
}
interface FieldErrors {
  fullName?: string; orgName?: string; email?: string
  password?: string; confirmPassword?: string
}
const INITIAL: Fields = { fullName: "", orgName: "", email: "", password: "", confirmPassword: "", rememberMe: false }
const toRole = (raw: string): RolePlateforme => {
  const map: Record<string, RolePlateforme> = {
    SUPER_ADMIN: "SUPER_ADMIN", ADMIN: "ADMIN_ENTREPRISE",
    CHEF_PROJET: "CHEF_PROJET", CHEF_CHANTIER: "CHEF_CHANTIER",
    CONSULTANT: "CONSULTANT", LECTEUR: "UTILISATEUR_STANDARD",
  }
  return map[raw] ?? "UTILISATEUR_STANDARD"
}

function BlueprintIllustration() {
  return (
    <svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden>
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={i * 52} y1="0" x2={i * 52} y2="420" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 52} x2="520" y2={i * 52} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      <rect x="60" y="120" width="120" height="280" rx="3" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      <rect x="60" y="120" width="120" height="30" rx="3" fill="rgba(249,115,22,0.15)" stroke="#F97316" strokeWidth="1.5" />
      {[0,1,2,3,4].map(row => [0,1,2].map(col => (
        <rect key={`wa${row}${col}`} x={75 + col * 36} y={168 + row * 42} width="22" height="28" rx="2"
          fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      )))}
      <rect x="105" y="352" width="30" height="48" rx="2" fill="rgba(249,115,22,0.2)" stroke="#F97316" strokeWidth="1.5" />
      <rect x="220" y="180" width="90" height="220" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      {[0,1,2,3].map(row => [0,1].map(col => (
        <rect key={`wb${row}${col}`} x={232 + col * 40} y={200 + row * 44} width="24" height="30" rx="2"
          fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      )))}
      <rect x="350" y="260" width="70" height="140" rx="3" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <line x1="430" y1="60" x2="430" y2="260" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <line x1="390" y1="60" x2="490" y2="60" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <line x1="470" y1="60" x2="470" y2="140" stroke="#F97316" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="462" y="138" width="16" height="12" rx="2" fill="none" stroke="#F97316" strokeWidth="1.5" />
      <line x1="0" y1="400" x2="520" y2="400" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <rect x="340" y="60" width="80" height="52" rx="4" fill="rgba(30,58,138,0.4)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <text x="380" y="91" fill="#F97316" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">ENGIPILOT</text>
    </svg>
  )
}

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}>
        <Icon className="w-4 h-4" style={{ color: ORANGE }} />
      </div>
      <span className="text-white/70 text-sm">{text}</span>
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p role="alert" className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}
    </p>
  )
}

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const score = (value.length >= 8 ? 1 : 0) + (value.length >= 12 ? 1 : 0) +
    (/[A-Z]/.test(value) ? 1 : 0) + (/[0-9]/.test(value) ? 1 : 0) + (/[^A-Za-z0-9]/.test(value) ? 1 : 0)
  const levels = [
    { label: "Très faible", color: "#ef4444", w: "20%" },
    { label: "Faible", color: "#f97316", w: "40%" },
    { label: "Moyen", color: "#eab308", w: "60%" },
    { label: "Fort", color: "#3b82f6", w: "80%" },
    { label: "Très fort", color: "#22c55e", w: "100%" },
  ]
  const lvl = levels[Math.min(score - 1, 4)] ?? levels[0]
  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: lvl.w, background: lvl.color }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">Force : <span className="font-medium text-slate-600">{lvl.label}</span></p>
    </div>
  )
}

const inputBase = "w-full border rounded-xl pl-10 pr-10 py-2.5 text-sm bg-white outline-none placeholder:text-slate-400 transition-all duration-150 text-slate-800"
const inputCls = (err: boolean) => inputBase + (err
  ? " border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
  : " border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100")

export default function LoginPage() {
  const router  = useRouter()
  const setUser = useStore(s => s.setUser)
  const [mode, setMode]         = useState<Mode>("login")
  const [fields, setFields]     = useState<Fields>(INITIAL)
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [touched, setTouched]   = useState<Partial<Record<keyof Fields, boolean>>>({})
  const [errors, setErrors]     = useState<FieldErrors>({})
  const [apiErr, setApiErr]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [forgotMode, setForgotMode]       = useState(false)
  const [forgotEmail, setForgotEmail]     = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent]       = useState(false)
  const [forgotErr, setForgotErr]         = useState("")

  const set = (k: keyof Fields, v: string | boolean) => setFields(f => ({ ...f, [k]: v }))
  const touch = (k: keyof Fields) => setTouched(p => ({ ...p, [k]: true }))
  const switchMode = (m: Mode) => {
    setMode(m); setFields(INITIAL); setTouched({})
    setErrors({}); setApiErr(null); setShowPass(false); setShowConf(false)
  }
  const validate = (f: Fields, m: Mode): FieldErrors => {
    const e: FieldErrors = {}
    if (m === "register") {
      if (!f.fullName.trim()) e.fullName = "Le nom complet est requis"
      else if (f.fullName.trim().length < 2) e.fullName = "Minimum 2 caractères"
      if (!f.orgName.trim()) e.orgName = "Le nom de la société est requis"
      else if (f.orgName.trim().length < 2) e.orgName = "Minimum 2 caractères"
    }
    if (!f.email.trim()) e.email = "L'adresse email est requise"
    else if (!EMAIL_RE.test(f.email)) e.email = "Format d'email invalide"
    if (!f.password) e.password = "Le mot de passe est requis"
    else if (f.password.length < 8) e.password = "Minimum 8 caractères"
    if (m === "register") {
      if (!f.confirmPassword) e.confirmPassword = "La confirmation est requise"
      else if (f.confirmPassword !== f.password) e.confirmPassword = "Les mots de passe ne correspondent pas"
    }
    return e
  }
  const handleBlur = (k: keyof Fields) => { touch(k); setErrors(validate(fields, mode)) }
  const handleChange = (k: keyof Fields, v: string | boolean) => {
    const next = { ...fields, [k]: v }; setFields(next)
    if (touched[k]) setErrors(validate(next, mode))
  }
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(forgotEmail)) { setForgotErr("Adresse email invalide"); return }
    setForgotLoading(true); setForgotErr("")
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setForgotSent(true)
    } catch { setForgotErr("Impossible de contacter le serveur") }
    finally { setForgotLoading(false) }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Partial<Record<keyof Fields, boolean>> = { email: true, password: true }
    if (mode === "register") { allTouched.fullName = true; allTouched.orgName = true; allTouched.confirmPassword = true }
    setTouched(allTouched)
    const errs = validate(fields, mode); setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true); setApiErr(null)
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login"
        ? { email: fields.email.trim(), password: fields.password }
        : { email: fields.email.trim(), password: fields.password,
            fullName: fields.fullName.trim(), organisationName: fields.orgName.trim() }
      const res  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setApiErr(data.error ?? "Une erreur est survenue."); return }
      const apiUser  = data.user
      const roleName = typeof apiUser.role === "string" ? apiUser.role : (apiUser.role?.name ?? "")
      const parts    = (apiUser.fullName ?? "").trim().split(" ")
      const u: Utilisateur = {
        id: apiUser.id, email: apiUser.email,
        prenom: parts[0] ?? "", nom: parts.slice(1).join(" ") || "",
        role: toRole(roleName), organisation_id: apiUser.organisationId ?? "",
        actif: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setUser(u)
      router.push("/dashboard")
    } catch { setApiErr("Impossible de contacter le serveur. Vérifiez votre connexion.") }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      <div className="relative lg:w-[55%] flex flex-col justify-between overflow-hidden px-8 py-10 lg:px-14 lg:py-12 min-h-[320px] lg:min-h-screen"
        style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #0d2260 60%, #1a1040 100%)` }}>
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at bottom left, rgba(249,115,22,0.12) 0%, transparent 65%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12 lg:mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: ORANGE, boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}>
              <HardHat className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-white font-black text-xl tracking-widest">ENGIPILOT</span>
              <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase -mt-0.5">BTP · Ingénierie · Chantiers</div>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white leading-[1.15] mb-4 tracking-tight">
            La plateforme intelligente<br />
            <span style={{ color: ORANGE }}>pour piloter vos projets</span><br />
            de construction
          </h1>
          <p className="text-white/55 text-sm lg:text-base leading-relaxed max-w-md mb-10">
            Supervision en temps réel, IA prédictive et gestion HSE — conçu pour les ingénieurs et chefs de chantier exigeants.
          </p>
          <div className="space-y-4 mb-10 lg:mb-0">
            <Feature icon={BarChart3} text="KPIs EVM · SPI · CPI calculés en temps réel" />
            <Feature icon={Brain} text="IA prédictive — alertes retard & dépassement" />
            <Feature icon={ShieldCheck} text="HSE & Non-conformités automatisées" />
          </div>
        </div>
        <div className="relative z-10 hidden lg:block">
          <div className="h-52 opacity-70"><BlueprintIllustration /></div>
          <p className="text-white/25 text-xs mt-4">© {new Date().getFullYear()} ENGIPILOT — SaaS BTP Maroc · Tous droits réservés</p>
        </div>
      </div>

      <div className="lg:w-[45%] flex items-center justify-center px-6 py-14 bg-slate-50">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {forgotMode ? "Réinitialiser le mot de passe" : mode === "login" ? "Connexion" : "Créer un compte"}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {forgotMode ? "Entrez votre email pour recevoir un lien"
                  : mode === "login" ? "Accédez à votre espace de pilotage" : "Commencez à piloter vos chantiers"}
              </p>
            </div>

            {!forgotMode && (
              <div className="flex rounded-xl p-1 mb-7" style={{ background: "#f1f5f9" }}>
                {(["login", "register"] as Mode[]).map(m => (
                  <button key={m} type="button" onClick={() => switchMode(m)}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={mode === m ? { background: "white", color: BLUE, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#64748b" }}>
                    {m === "login" ? "Connexion" : "Inscription"}
                  </button>
                ))}
              </div>
            )}

            {forgotMode && (
              forgotSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                    <CheckCircle2 className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="text-slate-800 font-semibold">Email envoyé !</p>
                  <p className="text-sm text-slate-500">Si cet email est enregistré, vous recevrez un lien de réinitialisation dans quelques minutes.</p>
                  <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail("") }}
                    className="text-sm font-semibold mt-2 hover:underline" style={{ color: BLUE }}>
                    ← Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={forgotEmail} placeholder="votre@email.com"
                      onChange={e => { setForgotEmail(e.target.value); setForgotErr("") }}
                      className={inputCls(!!forgotErr)} required />
                  </div>
                  {forgotErr && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{forgotErr}</p>}
                  <button type="submit" disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${ORANGE})` }}>
                    {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}Envoyer le lien
                  </button>
                  <button type="button" onClick={() => { setForgotMode(false); setForgotErr("") }}
                    className="w-full text-sm text-slate-500 hover:text-slate-700">Annuler</button>
                </form>
              )
            )}

            {!forgotMode && (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {mode === "register" && (
                  <>
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nom complet <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input id="fullName" type="text" autoComplete="name" value={fields.fullName} placeholder="Votre nom complet"
                          onChange={e => handleChange("fullName", e.target.value)} onBlur={() => handleBlur("fullName")}
                          className={inputCls(!!(touched.fullName && errors.fullName))} />
                      </div>
                      {touched.fullName && <FieldError msg={errors.fullName} />}
                    </div>
                    <div>
                      <label htmlFor="orgName" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Société <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input id="orgName" type="text" autoComplete="organization" value={fields.orgName} placeholder="Nom de votre entreprise"
                          onChange={e => handleChange("orgName", e.target.value)} onBlur={() => handleBlur("orgName")}
                          className={inputCls(!!(touched.orgName && errors.orgName))} />
                      </div>
                      {touched.orgName && <FieldError msg={errors.orgName} />}
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Adresse email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="email" type="email" autoComplete="email" value={fields.email} placeholder="vous@entreprise.com"
                      onChange={e => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")}
                      className={inputCls(!!(touched.email && errors.email))} />
                  </div>
                  {touched.email && <FieldError msg={errors.email} />}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mot de passe <span className="text-red-500">*</span></label>
                    {mode === "login" && (
                      <button type="button"
                        onClick={() => { setForgotMode(true); setForgotEmail(fields.email); setForgotErr(""); setForgotSent(false) }}
                        className="text-xs font-medium hover:underline" style={{ color: BLUE }}>
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="password" type={showPass ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={fields.password} placeholder="••••••••"
                      onChange={e => handleChange("password", e.target.value)} onBlur={() => handleBlur("password")}
                      className={inputCls(!!(touched.password && errors.password))} />
                    <button type="button" onClick={() => setShowPass(p => !p)} aria-label={showPass ? "Masquer" : "Afficher"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && <FieldError msg={errors.password} />}
                  {mode === "register" && <PasswordStrength value={fields.password} />}
                </div>
                {mode === "register" && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input id="confirmPassword" type={showConf ? "text" : "password"} autoComplete="new-password"
                        value={fields.confirmPassword} placeholder="••••••••"
                        onChange={e => handleChange("confirmPassword", e.target.value)} onBlur={() => handleBlur("confirmPassword")}
                        className={`${inputCls(!!(touched.confirmPassword && errors.confirmPassword))} pr-16`} />
                      <button type="button" onClick={() => setShowConf(p => !p)} aria-label={showConf ? "Masquer" : "Afficher"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {touched.confirmPassword && <FieldError msg={errors.confirmPassword} />}
                  </div>
                )}
                {mode === "login" && (
                  <div className="flex items-center gap-2.5">
                    <input id="rememberMe" type="checkbox" checked={fields.rememberMe}
                      onChange={e => set("rememberMe", e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 cursor-pointer" style={{ accentColor: BLUE }} />
                    <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer select-none">Se souvenir de moi</label>
                  </div>
                )}
                {apiErr && (
                  <div role="alert" className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{apiErr}</span>
                  </div>
                )}
                <button type="submit" disabled={loading} aria-busy={loading}
                  className="w-full font-bold py-3 rounded-xl text-sm text-white flex items-center justify-center gap-2 mt-1 transition-all duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? "#94a3b8" : `linear-gradient(135deg, ${BLUE} 0%, #2563eb 50%, ${ORANGE} 100%)`,
                    boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
                  }}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{mode === "login" ? "Connexion en cours…" : "Création du compte…"}</>
                  ) : (
                    <>{mode === "login" ? "Se connecter" : "Créer mon compte"}<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Connexion sécurisée · Données chiffrées TLS</span>
                </div>
              </form>
            )}
          </div>
          {!forgotMode && (
            <p className="text-center text-sm text-slate-500 mt-5">
              {mode === "login" ? (
                <>Pas encore de compte ?{" "}
                  <button type="button" onClick={() => switchMode("register")} className="font-semibold hover:underline" style={{ color: BLUE }}>
                    S'inscrire gratuitement
                  </button></>
              ) : (
                <>Déjà un compte ?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="font-semibold hover:underline" style={{ color: BLUE }}>
                    Se connecter
                  </button></>
              )}
            </p>
          )}
          <p className="lg:hidden text-center text-xs text-slate-400 mt-8">© {new Date().getFullYear()} ENGIPILOT — SaaS BTP Maroc</p>
        </div>
      </div>
    </div>
  )
}
