"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Eye, EyeOff, Mail, Lock, User, ArrowRight,
  Loader2, AlertCircle, CheckCircle2, BarChart3, Brain, ShieldCheck,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import type { RolePlateforme, Utilisateur } from "@/types"

/* ─────────────────────────────────────────────────────────────────────────────
   Types & helpers
───────────────────────────────────────────────────────────────────────────── */
type Mode = "login" | "register"

interface Fields {
  fullName:        string
  orgName:         string
  email:           string
  password:        string
  confirmPassword: string
  rememberMe:      boolean
}

interface FieldErrors {
  fullName?:        string
  orgName?:         string
  email?:           string
  password?:        string
  confirmPassword?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const toRole = (raw: string): RolePlateforme => {
  const map: Record<string, RolePlateforme> = {
    SUPER_ADMIN:   "SUPER_ADMIN",
    ADMIN:         "ADMIN_ENTREPRISE",
    CHEF_PROJET:   "CHEF_PROJET",
    CHEF_CHANTIER: "CHEF_CHANTIER",
    CONSULTANT:    "CONSULTANT",
    LECTEUR:       "UTILISATEUR_STANDARD",
  }
  return map[raw] ?? "UTILISATEUR_STANDARD"
}

const INITIAL: Fields = {
  fullName: "", orgName: "", email: "",
  password: "", confirmPassword: "", rememberMe: false,
}

/* ─────────────────────────────────────────────────────────────────────────────
   Left panel — construction SVG illustration
───────────────────────────────────────────────────────────────────────────── */
function CityIllustration() {
  return (
    <svg
      viewBox="0 0 800 320"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full opacity-20"
      aria-hidden="true"
    >
      {/* Buildings */}
      <rect x="30"  y="160" width="60" height="160" rx="4" fill="white"/>
      <rect x="45"  y="140" width="30" height="20"  rx="2" fill="white"/>
      <rect x="50"  y="180" width="8"  height="10"  fill="#635BFF" opacity=".6"/>
      <rect x="65"  y="180" width="8"  height="10"  fill="#635BFF" opacity=".6"/>
      <rect x="50"  y="200" width="8"  height="10"  fill="#635BFF" opacity=".4"/>
      <rect x="65"  y="200" width="8"  height="10"  fill="#635BFF" opacity=".4"/>

      <rect x="110" y="110" width="80" height="210" rx="4" fill="white"/>
      <rect x="130" y="130" width="12" height="14"  fill="#8b5cf6" opacity=".5"/>
      <rect x="150" y="130" width="12" height="14"  fill="#8b5cf6" opacity=".5"/>
      <rect x="130" y="155" width="12" height="14"  fill="#8b5cf6" opacity=".5"/>
      <rect x="150" y="155" width="12" height="14"  fill="#8b5cf6" opacity=".5"/>
      <rect x="130" y="180" width="12" height="14"  fill="#8b5cf6" opacity=".5"/>
      <rect x="150" y="180" width="12" height="14"  fill="#8b5cf6" opacity=".5"/>

      <rect x="210" y="180" width="50" height="140" rx="4" fill="white"/>
      <rect x="275" y="90"  width="90" height="230" rx="4" fill="white" opacity=".9"/>
      <rect x="290" y="110" width="14" height="16"  fill="#635BFF" opacity=".5"/>
      <rect x="315" y="110" width="14" height="16"  fill="#635BFF" opacity=".5"/>
      <rect x="290" y="140" width="14" height="16"  fill="#635BFF" opacity=".5"/>
      <rect x="315" y="140" width="14" height="16"  fill="#635BFF" opacity=".5"/>
      <rect x="290" y="170" width="14" height="16"  fill="#635BFF" opacity=".5"/>
      <rect x="315" y="170" width="14" height="16"  fill="#635BFF" opacity=".5"/>
      <rect x="290" y="200" width="14" height="16"  fill="#635BFF" opacity=".5"/>
      <rect x="315" y="200" width="14" height="16"  fill="#635BFF" opacity=".5"/>

      <rect x="390" y="140" width="70" height="180" rx="4" fill="white" opacity=".85"/>
      <rect x="480" y="200" width="55" height="120" rx="4" fill="white"/>

      {/* Crane 1 */}
      <line x1="560" y1="60"  x2="560" y2="260" stroke="white" strokeWidth="4"/>
      <line x1="520" y1="60"  x2="660" y2="60"  stroke="white" strokeWidth="4"/>
      <line x1="520" y1="60"  x2="540" y2="100" stroke="white" strokeWidth="2.5"/>
      <line x1="660" y1="60"  x2="640" y2="100" stroke="white" strokeWidth="2.5"/>
      <line x1="620" y1="60"  x2="620" y2="120" stroke="white" strokeWidth="2"/>

      {/* Crane 2 */}
      <line x1="700" y1="100" x2="700" y2="260" stroke="white" strokeWidth="3.5"/>
      <line x1="670" y1="100" x2="780" y2="100" stroke="white" strokeWidth="3.5"/>
      <line x1="670" y1="100" x2="685" y2="130" stroke="white" strokeWidth="2"/>
      <line x1="760" y1="100" x2="745" y2="130" stroke="white" strokeWidth="2"/>
      <line x1="745" y1="100" x2="745" y2="150" stroke="white" strokeWidth="2"/>

      {/* Ground line */}
      <line x1="0" y1="310" x2="800" y2="310" stroke="white" strokeWidth="2" opacity=".3"/>

      {/* Dots grid */}
      {[0,1,2,3,4,5,6].map(col =>
        [0,1,2,3].map(row => (
          <circle
            key={`${col}-${row}`}
            cx={580 + col * 28}
            cy={20  + row * 28}
            r="2"
            fill="white"
            opacity=".25"
          />
        ))
      )}
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Feature card
───────────────────────────────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-4 group">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                   bg-white/10 backdrop-blur-sm border border-white/20
                   group-hover:bg-white/20 transition-all duration-300"
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-white font-semibold text-sm leading-tight">{title}</p>
        <p className="text-white/60 text-xs mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Field error
───────────────────────────────────────────────────────────────────────────── */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p role="alert" className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden />
      {msg}
    </p>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Password strength
───────────────────────────────────────────────────────────────────────────── */
function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const score =
    (value.length >= 8  ? 1 : 0) +
    (value.length >= 12 ? 1 : 0) +
    (/[A-Z]/.test(value) ? 1 : 0) +
    (/[0-9]/.test(value) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(value) ? 1 : 0)

  const levels = [
    { label: "Très faible", color: "bg-red-500",    w: "w-1/5" },
    { label: "Faible",      color: "bg-orange-500", w: "w-2/5" },
    { label: "Moyen",       color: "bg-yellow-500", w: "w-3/5" },
    { label: "Fort",        color: "bg-blue-500",   w: "w-4/5" },
    { label: "Très fort",   color: "bg-green-500",  w: "w-full" },
  ]
  const level = levels[Math.min(score - 1, 4)] ?? levels[0]

  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${level.color} ${level.w}`} />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Force : <span className="font-medium text-gray-600">{level.label}</span>
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Input wrapper
───────────────────────────────────────────────────────────────────────────── */
function InputField({
  id, label, required = true, error, touched, valid, children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  touched?: boolean
  valid?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      <div className="relative">
        {children}
        {touched && valid && (
          <CheckCircle2
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 pointer-events-none"
            aria-hidden
          />
        )}
      </div>
      {touched && <FieldError msg={error} />}
    </div>
  )
}

const inputCls = (hasError: boolean) =>
  `w-full border rounded-xl pl-10 pr-10 py-2.5 text-sm bg-white outline-none
   placeholder:text-gray-400 transition-all duration-150
   focus:ring-2 focus:ring-offset-0
   ${hasError
     ? "border-red-300 focus:border-red-400 focus:ring-red-100"
     : "border-gray-200 focus:border-[#1e512d] focus:ring-[#1e512d]/10"}`

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────────────────── */
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

  /* helpers */
  const set = (k: keyof Fields, v: string | boolean) =>
    setFields(f => ({ ...f, [k]: v }))

  const touch = (k: keyof Fields) =>
    setTouched(p => ({ ...p, [k]: true }))

  const switchMode = (m: Mode) => {
    setMode(m); setFields(INITIAL); setTouched({})
    setErrors({}); setApiErr(null)
    setShowPass(false); setShowConf(false)
  }

  /* validation */
  const validate = (f: Fields, m: Mode): FieldErrors => {
    const e: FieldErrors = {}
    if (m === "register") {
      if (!f.fullName.trim())
        e.fullName = "Le nom complet est requis"
      else if (f.fullName.trim().length < 2)
        e.fullName = "Minimum 2 caractères"

      if (!f.orgName.trim())
        e.orgName = "Le nom de la société est requis"
      else if (f.orgName.trim().length < 2)
        e.orgName = "Minimum 2 caractères"
    }
    if (!f.email.trim())
      e.email = "L'adresse email est requise"
    else if (!EMAIL_RE.test(f.email))
      e.email = "Format d'email invalide"

    if (!f.password)
      e.password = "Le mot de passe est requis"
    else if (f.password.length < 8)
      e.password = "Minimum 8 caractères"

    if (m === "register") {
      if (!f.confirmPassword)
        e.confirmPassword = "La confirmation est requise"
      else if (f.confirmPassword !== f.password)
        e.confirmPassword = "Les mots de passe ne correspondent pas"
    }
    return e
  }

  const handleBlur = (k: keyof Fields) => {
    touch(k)
    setErrors(validate(fields, mode))
  }

  const handleChange = (k: keyof Fields, v: string | boolean) => {
    const next = { ...fields, [k]: v }
    setFields(next)
    if (touched[k]) setErrors(validate(next, mode))
  }

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const allTouched: Partial<Record<keyof Fields, boolean>> = {
      email: true, password: true,
    }
    if (mode === "register") {
      allTouched.fullName        = true
      allTouched.orgName         = true
      allTouched.confirmPassword = true
    }
    setTouched(allTouched)

    const errs = validate(fields, mode)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setApiErr(null)
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login"
        ? { email: fields.email.trim(), password: fields.password }
        : {
            email:            fields.email.trim(),
            password:         fields.password,
            fullName:         fields.fullName.trim(),
            organisationName: fields.orgName.trim(),
          }

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setApiErr(data.error ?? "Une erreur est survenue. Veuillez réessayer.")
        return
      }

      const apiUser  = data.user
      const roleName = typeof apiUser.role === "string"
        ? apiUser.role
        : (apiUser.role?.name ?? "")
      const parts  = (apiUser.fullName ?? "").trim().split(" ")
      const prenom = parts[0] ?? ""
      const nom    = parts.slice(1).join(" ") || ""

      const u: Utilisateur = {
        id:              apiUser.id,
        email:           apiUser.email,
        prenom,
        nom,
        role:            toRole(roleName),
        organisation_id: apiUser.organisationId ?? "",
        actif:           true,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      }
      setUser(u)
      router.push("/dashboard")
    } catch {
      setApiErr("Impossible de contacter le serveur. Vérifiez votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT — Marketing panel
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative lg:w-1/2 flex flex-col justify-between overflow-hidden
                   px-8 py-10 lg:px-14 lg:py-14
                   min-h-[280px] lg:min-h-screen"
        style={{
          background: "linear-gradient(135deg, #1e512d 0%, #1a6635 40%, #cc5500 80%, #ff751f 100%)",
        }}
      >
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />

        {/* Glow blobs */}
        <div
          className="absolute top-[-80px] right-[-60px] w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div
          className="absolute bottom-[-60px] left-[-40px] w-60 h-60 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(99,91,255,0.35) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        {/* City SVG — bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" aria-hidden>
          <CityIllustration />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 lg:mb-16">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center
                         bg-white/15 backdrop-blur-sm border border-white/25"
            >
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} aria-hidden />
            </div>
            <span className="text-white font-black text-xl tracking-tight">ENGIPILOT</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl lg:text-[2.4rem] font-black text-white leading-[1.15] mb-5">
            Supervision<br />Intelligente des<br />Chantiers BTP
          </h1>
          <p className="text-white/65 text-base leading-relaxed max-w-md mb-10">
            Pilotez vos projets avec l'IA, analysez vos KPIs en temps réel
            et anticipez les risques avant qu'ils n'impactent vos délais.
          </p>

          {/* Feature cards */}
          <div className="space-y-5 mb-10 lg:mb-0">
            <FeatureCard
              icon={BarChart3}
              title="KPIs EVM en temps réel"
              desc="SPI, CPI, EAC calculés et actualisés automatiquement"
            />
            <FeatureCard
              icon={Brain}
              title="IA Prédictive"
              desc="Détection proactive de retards et anomalies budgétaires"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="HSE & Qualité NC"
              desc="Gestion des non-conformités et conformité automatisée"
            />
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/30 text-xs mt-auto hidden lg:block">
          © {new Date().getFullYear()} ENGIPILOT — SaaS BTP Maroc
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT — Auth form
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[420px]">

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Bienvenue sur ENGIPILOT
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {mode === "login"
                ? "Connectez-vous à votre compte pour continuer"
                : "Créez votre compte et commencez gratuitement"}
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex border-b border-gray-200 mb-8"
            role="tablist"
            aria-label="Mode d'authentification"
          >
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 pb-3 text-sm font-semibold transition-all duration-150
                            border-b-2 -mb-px
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e512d] focus-visible:ring-offset-2 rounded-t
                            ${mode === m
                              ? "border-[#1e512d] text-[#1e512d]"
                              : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {m === "login" ? "Connexion" : "Créer un compte"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
            aria-label={mode === "login" ? "Formulaire de connexion" : "Formulaire d'inscription"}
          >

            {/* ── Register fields ── */}
            {mode === "register" && (
              <>
                <InputField
                  id="fullName"
                  label="Nom complet"
                  error={errors.fullName}
                  touched={touched.fullName}
                  valid={!errors.fullName && !!fields.fullName}
                >
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    aria-hidden
                  />
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={fields.fullName}
                    onChange={e => handleChange("fullName", e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                    placeholder="Entrez votre nom complet"
                    className={inputCls(!!(touched.fullName && errors.fullName))}
                    aria-required="true"
                    aria-invalid={!!(touched.fullName && errors.fullName)}
                    aria-describedby={errors.fullName ? "fullName-err" : undefined}
                  />
                </InputField>

                <InputField
                  id="orgName"
                  label="Société"
                  error={errors.orgName}
                  touched={touched.orgName}
                  valid={!errors.orgName && !!fields.orgName}
                >
                  <Building2
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    aria-hidden
                  />
                  <input
                    id="orgName"
                    type="text"
                    autoComplete="organization"
                    value={fields.orgName}
                    onChange={e => handleChange("orgName", e.target.value)}
                    onBlur={() => handleBlur("orgName")}
                    placeholder="Entrez le nom de votre entreprise"
                    className={inputCls(!!(touched.orgName && errors.orgName))}
                    aria-required="true"
                    aria-invalid={!!(touched.orgName && errors.orgName)}
                  />
                </InputField>
              </>
            )}

            {/* ── Email ── */}
            <InputField
              id="email"
              label="Adresse email"
              error={errors.email}
              touched={touched.email}
              valid={!errors.email && !!fields.email}
            >
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                aria-hidden
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={fields.email}
                onChange={e => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="Entrez votre adresse email"
                className={inputCls(!!(touched.email && errors.email))}
                aria-required="true"
                aria-invalid={!!(touched.email && errors.email)}
              />
            </InputField>

            {/* ── Password ── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe<span className="text-red-500 ml-0.5" aria-hidden>*</span>
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-[#1e512d] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e512d] rounded"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={fields.password}
                  onChange={e => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="Entrez votre mot de passe"
                  className={inputCls(!!(touched.password && errors.password))}
                  aria-required="true"
                  aria-invalid={!!(touched.password && errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  aria-label={showPass ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                             transition-colors focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[#1e512d] rounded"
                >
                  {showPass
                    ? <EyeOff className="w-4 h-4" aria-hidden />
                    : <Eye    className="w-4 h-4" aria-hidden />}
                </button>
              </div>
              {touched.password && <FieldError msg={errors.password} />}
              {mode === "register" && <PasswordStrength value={fields.password} />}
            </div>

            {/* ── Confirm password (register) ── */}
            {mode === "register" && (
              <InputField
                id="confirmPassword"
                label="Confirmer le mot de passe"
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                valid={!errors.confirmPassword && !!fields.confirmPassword && fields.confirmPassword === fields.password}
              >
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="confirmPassword"
                  type={showConf ? "text" : "password"}
                  autoComplete="new-password"
                  value={fields.confirmPassword}
                  onChange={e => handleChange("confirmPassword", e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="Confirmez votre mot de passe"
                  className={`${inputCls(!!(touched.confirmPassword && errors.confirmPassword))} pr-16`}
                  aria-required="true"
                  aria-invalid={!!(touched.confirmPassword && errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(p => !p)}
                  aria-label={showConf ? "Masquer la confirmation" : "Afficher la confirmation"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                             transition-colors focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[#1e512d] rounded"
                >
                  {showConf
                    ? <EyeOff className="w-4 h-4" aria-hidden />
                    : <Eye    className="w-4 h-4" aria-hidden />}
                </button>
              </InputField>
            )}

            {/* ── Remember me (login) ── */}
            {mode === "login" && (
              <div className="flex items-center gap-2.5">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={fields.rememberMe}
                  onChange={e => set("rememberMe", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1e512d]
                             accent-[#1e512d] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1e512d]"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-gray-600 cursor-pointer select-none"
                >
                  Se souvenir de moi
                </label>
              </div>
            )}

            {/* ── API error ── */}
            {apiErr && (
              <div
                role="alert"
                className="flex items-start gap-2.5 text-sm text-red-700
                           bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
                <span>{apiErr}</span>
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full font-semibold py-3 rounded-xl text-sm text-white
                         flex items-center justify-center gap-2 mt-2 transition-all duration-150
                         active:scale-[0.99] shadow-md
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e512d] focus-visible:ring-offset-2"
              style={{
                background: "linear-gradient(135deg, #1e512d 0%, #ff751f 100%)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  {mode === "login" ? "Connexion en cours…" : "Création du compte…"}
                </>
              ) : (
                <>
                  {mode === "login" ? "Se connecter" : "Créer un compte"}
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </>
              )}
            </button>
          </form>

          {/* ── Legal / switch ── */}
          <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
            {mode === "login" ? (
              <>
                En vous connectant, vous acceptez nos{" "}
                <button type="button" className="text-[#1e512d] hover:underline">
                  Conditions d'utilisation
                </button>{" "}
                et notre{" "}
                <button type="button" className="text-[#1e512d] hover:underline">
                  Politique de confidentialité
                </button>
                .<br className="hidden sm:block" />
                <span className="mt-2 inline-block">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-[#1e512d] font-semibold hover:underline
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[#1e512d] rounded"
                  >
                    S'inscrire gratuitement
                  </button>
                </span>
              </>
            ) : (
              <>
                En créant un compte, vous acceptez nos{" "}
                <button type="button" className="text-[#1e512d] hover:underline">
                  Conditions d'utilisation
                </button>.<br className="hidden sm:block" />
                <span className="mt-2 inline-block">
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-[#1e512d] font-semibold hover:underline
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[#1e512d] rounded"
                  >
                    Se connecter
                  </button>
                </span>
              </>
            )}
          </p>

          {/* Mobile footer */}
          <p className="lg:hidden text-center text-xs text-gray-300 mt-8">
            © {new Date().getFullYear()} ENGIPILOT — SaaS BTP Maroc
          </p>
        </div>
      </div>
    </div>
  )
}
