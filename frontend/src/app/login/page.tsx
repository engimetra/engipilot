"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, ArrowRight, Eye, EyeOff, BarChart3, Brain, ShieldCheck, User, Mail, Lock, CheckCircle2, X } from "lucide-react"
import { useStore } from "@/store/useStore"
import { DEMO_USERS, ROLE_CONFIG } from "@/lib/rbac"
import type { RolePlateforme, Utilisateur } from "@/types"

type Mode = "login" | "register"

const DEMO_ROLE_ORDER: RolePlateforme[] = [
  "SUPER_ADMIN", "ADMIN_ENTREPRISE", "CHEF_PROJET",
  "CHEF_CHANTIER", "CONSULTANT", "UTILISATEUR_STANDARD",
]

/* ── Social provider icons ── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)
const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
    <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
    <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
    <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
  </svg>
)
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
)
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0A66C2" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

/* ── Provider config ── */
const SOCIAL_PROVIDERS = [
  { id: "google",    label: "Google",    Icon: GoogleIcon,    color: "#4285F4", bg: "#EEF4FF" },
  { id: "microsoft", label: "Microsoft", Icon: MicrosoftIcon, color: "#737373", bg: "#F5F5F5" },
  { id: "facebook",  label: "Facebook",  Icon: FacebookIcon,  color: "#1877F2", bg: "#EBF3FF" },
  { id: "linkedin",  label: "LinkedIn",  Icon: LinkedInIcon,  color: "#0A66C2", bg: "#E8F0F8" },
]

/* ── OAuth steps ── */
const OAUTH_STEPS = [
  "Connexion au fournisseur...",
  "Vérification de l'identité...",
  "Récupération du profil...",
  "Accès autorisé ✓",
]

/* ── OAuth Popup Modal ── */
function OAuthModal({
  provider,
  onClose,
  onSuccess,
}: {
  provider: typeof SOCIAL_PROVIDERS[0]
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 700))
    timers.push(setTimeout(() => setStep(2), 1400))
    timers.push(setTimeout(() => setStep(3), 2100))
    timers.push(setTimeout(() => setDone(true), 2600))
    timers.push(setTimeout(() => onSuccess(), 3100))
    return () => timers.forEach(clearTimeout)
  }, [onSuccess])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!done ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
        {!done && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Provider logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: provider.bg }}
        >
          <span className="scale-[2.2]"><provider.Icon /></span>
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Connexion via</p>
          <h3 className="text-xl font-black text-gray-900">{provider.label}</h3>
        </div>

        {/* Steps */}
        <div className="w-full space-y-3">
          {OAUTH_STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                i < step
                  ? "bg-green-500"
                  : i === step
                  ? "border-2 border-gray-300"
                  : "border-2 border-gray-200"
              }`}>
                {i < step ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : i === step ? (
                  <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: provider.color, borderTopColor: "transparent" }} />
                ) : null}
              </div>
              <span className={`text-sm transition-colors duration-300 ${
                i < step ? "text-green-600 font-medium" : i === step ? "text-gray-800 font-medium" : "text-gray-300"
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(step / (OAUTH_STEPS.length - 1)) * 100}%`,
              backgroundColor: provider.color,
            }}
          />
        </div>

        {done && (
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold animate-in fade-in duration-300"
            style={{ backgroundColor: provider.color }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Authentifié — redirection...
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [prenom, setPrenom] = useState("")
  const [nom, setNom] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<typeof SOCIAL_PROVIDERS[0] | null>(null)
  const router = useRouter()
  const setUser = useStore(s => s.setUser)

  // Mapping DB role name → RolePlateforme frontend type
  const toRole = (dbRole: string): RolePlateforme => {
    const map: Record<string, RolePlateforme> = {
      SUPER_ADMIN: "SUPER_ADMIN",
      ADMIN:       "ADMIN_ENTREPRISE",
      MANAGER:     "CHEF_PROJET",
      ENGINEER:    "CHEF_CHANTIER",
      HSE:         "CHEF_CHANTIER",
      MEMBER:      "UTILISATEUR_STANDARD",
      VIEWER:      "CONSULTANT",
    }
    return map[dbRole] ?? "UTILISATEUR_STANDARD"
  }

  const applyUser = (apiUser: { id: string; email: string; firstName: string; lastName: string; avatar?: string | null; role: string; company: { id: string } }) => {
    const u: Utilisateur = {
      id:              apiUser.id,
      email:           apiUser.email,
      prenom:          apiUser.firstName,
      nom:             apiUser.lastName,
      role:            toRole(apiUser.role),
      organisation_id: apiUser.company.id,
      avatar_url:      apiUser.avatar ?? undefined,
      actif:           true,
      created_at:      new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    }
    setUser(u)
  }

  const [apiError, setApiError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login"
        ? { email, password }
        : { email, password, firstName: prenom, lastName: nom }

      const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? "Erreur de connexion")
        return
      }

      applyUser(data.user)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  // Credentials réels des utilisateurs démo en base
  const DEMO_CREDENTIALS: Partial<Record<RolePlateforme, { email: string; password: string }>> = {
    SUPER_ADMIN:         { email: "admin@engipilot.ma",    password: "Engipilot2024!" },
    ADMIN_ENTREPRISE:    { email: "admin@engipilot.ma",    password: "Engipilot2024!" },
    CHEF_PROJET:         { email: "manager@engipilot.ma",  password: "Manager2024!"   },
    CHEF_CHANTIER:       { email: "engineer@engipilot.ma", password: "Engineer2024!"  },
    CONSULTANT:          { email: "viewer@engipilot.ma",   password: "Viewer2024!"    },
    UTILISATEUR_STANDARD:{ email: "hse@engipilot.ma",      password: "Hse2024!"       },
  }

  const handleDemoLogin = async (role: RolePlateforme) => {
    setLoading(true)
    setApiError(null)
    try {
      const creds = DEMO_CREDENTIALS[role]
      if (!creds) return

      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(creds),
      })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? "Erreur de connexion")
        return
      }

      applyUser(data.user)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* OAuth Modal */}
      {oauthProvider && (
        <OAuthModal
          provider={oauthProvider}
          onClose={() => setOauthProvider(null)}
          onSuccess={() => router.push(`/register?provider=${oauthProvider.id}`)}
        />
      )}

      <div className="min-h-screen flex bg-background">

        {/* ── Left panel — branding ── */}
        <div className="hidden lg:flex flex-col justify-between w-[52%] bg-primary px-14 py-12">
          <button
            onClick={() => router.push("/landing")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ENGIPILOT</span>
          </button>

          <div className="space-y-10">
            <div>
              <h1 className="text-[2.6rem] font-black text-white leading-[1.15] mb-5">
                Supervision<br />Intelligente des<br />Chantiers BTP
              </h1>
              <p className="text-white/65 text-lg leading-relaxed max-w-md">
                Pilotez vos projets avec l'IA, analysez vos KPIs en temps réel
                et anticipez les risques avant qu'ils n'impactent vos délais.
              </p>
            </div>

            <div className="space-y-5">
              {[
                { icon: BarChart3,  title: "KPIs EVM en temps réel",  desc: "SPI, CPI, EAC calculés et actualisés automatiquement"      },
                { icon: Brain,      title: "IA Prédictive",            desc: "Détection proactive de retards et anomalies budgétaires"   },
                { icon: ShieldCheck,title: "HSE & Qualité NC",         desc: "Gestion des non-conformités et conformité automatisée"     },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-white/55 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6">
              {[["2 400+", "Projets supervisés"], ["15", "Pays couverts"], ["99.9%", "Disponibilité SLA"]].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="text-white font-black text-xl">{val}</p>
                  <p className="text-white/50 text-xs">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/35 text-xs">© 2026 ENGIPILOT — SaaS BTP Maroc</p>
        </div>

        {/* ── Right panel — form ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
          <div className="w-full max-w-[420px]">

            {/* Back to home */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push("/landing")}
                className="flex items-center gap-3 lg:hidden hover:opacity-75 transition-opacity"
              >
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-xl text-foreground">ENGIPILOT</span>
              </button>
              <button
                onClick={() => router.push("/landing")}
                className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary transition-colors ml-auto"
              >
                <span>←</span>
                <span>Retour à l'accueil</span>
              </button>
            </div>

            {/* Mode switcher */}
            <div className="flex bg-muted rounded-xl p-1 mb-8">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    mode === m
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-fg hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Se connecter" : "Créer un compte"}
                </button>
              ))}
            </div>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {mode === "login" ? "Bon retour 👋" : "Rejoignez ENGIPILOT 🚀"}
              </h2>
              <p className="text-muted-fg text-sm mt-1.5">
                {mode === "login"
                  ? "Connectez-vous à votre espace ENGIPILOT"
                  : "Créez votre compte et commencez gratuitement"}
              </p>
            </div>

            {/* ── Social login buttons ── */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {SOCIAL_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setOauthProvider(provider)}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 border border-border rounded-xl
                             bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm
                             text-sm font-medium text-foreground transition-all duration-150 group"
                >
                  <provider.Icon />
                  <span className="group-hover:font-semibold transition-all">{provider.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-fg font-medium">ou avec votre email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                      <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                        placeholder="Karim" className="input pl-9" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">Nom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                      <input type="text" value={nom} onChange={e => setNom(e.target.value)}
                        placeholder="Benali" className="input pl-9" required />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vous@entreprise.ma" className="input pl-9" required />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-foreground">Mot de passe</label>
                  {mode === "login" && (
                    <button type="button" className="text-xs text-primary hover:text-primary-hover transition-colors">
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className="input pl-9 pr-10" required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="text-xs text-muted-fg leading-relaxed">
                  En créant un compte, vous acceptez nos{" "}
                  <button type="button" className="text-primary hover:underline">Conditions d'utilisation</button>{" "}
                  et notre{" "}
                  <button type="button" className="text-primary hover:underline">Politique de confidentialité</button>.
                </div>
              )}

              {apiError && (
                <div className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
                  {apiError}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold
                           py-2.5 rounded-lg transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === "login" ? "Connexion en cours..." : "Création du compte..."}
                  </>
                ) : (
                  <>
                    {mode === "login" ? "Se connecter" : "Créer mon compte"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo role selector */}
            {mode === "login" && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
                  <p className="text-xs font-semibold text-muted-fg">Accès démo — choisissez un rôle</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ROLE_ORDER.map((role) => {
                    const demo = DEMO_USERS[role]
                    const cfg  = ROLE_CONFIG[role]
                    const isSA = role === "SUPER_ADMIN"
                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={loading}
                        onClick={() => handleDemoLogin(role)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border
                                   hover:border-primary/40 hover:bg-primary/5 transition-all duration-150
                                   text-left group disabled:opacity-50"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center
                                         text-[10px] font-black flex-shrink-0 ring-1
                                         ${isSA ? "bg-gradient-to-br from-[#635BFF] to-[#8B5CF6] text-white ring-purple-300/50"
                                                : `${cfg.bg} ${cfg.color} ${cfg.ring}`}`}>
                          {demo.prenom[0]}{demo.nom[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate leading-tight">
                            {demo.prenom}
                          </p>
                          <p className={`text-[10px] font-bold truncate leading-tight mt-0.5
                                         ${isSA ? "text-purple-500" : cfg.color}`}>
                            {cfg.shortLabel}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Switch mode */}
            <p className="mt-6 text-center text-sm text-muted-fg">
              {mode === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button type="button" onClick={() => setMode("register")}
                    className="text-primary font-semibold hover:underline">
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{" "}
                  <button type="button" onClick={() => setMode("login")}
                    className="text-primary font-semibold hover:underline">
                    Se connecter
                  </button>
                </>
              )}
            </p>

          </div>
        </div>
      </div>
    </>
  )
}
