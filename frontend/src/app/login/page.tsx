"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import type { RolePlateforme, Utilisateur } from "@/types"

type Mode = "login" | "register"

interface FormErrors {
  fullName?: string
  orgName?: string
  email?: string
  password?: string
}

const toRole = (dbRole: string): RolePlateforme => {
  const map: Record<string, RolePlateforme> = {
    SUPER_ADMIN:   "SUPER_ADMIN",
    ADMIN:         "ADMIN_ENTREPRISE",
    CHEF_PROJET:   "CHEF_PROJET",
    CHEF_CHANTIER: "CHEF_CHANTIER",
    CONSULTANT:    "CONSULTANT",
    LECTEUR:       "UTILISATEUR_STANDARD",
  }
  return map[dbRole] ?? "UTILISATEUR_STANDARD"
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router  = useRouter()
  const setUser = useStore(s => s.setUser)

  const [mode, setMode]           = useState<Mode>("login")
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [fullName, setFullName]   = useState("")
  const [orgName, setOrgName]     = useState("")
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [apiError, setApiError]   = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [touched, setTouched]     = useState<Record<string, boolean>>({})

  const switchMode = (m: Mode) => {
    setMode(m)
    setApiError(null)
    setFieldErrors({})
    setTouched({})
  }

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (mode === "register") {
      if (!fullName.trim())
        errs.fullName = "Le nom complet est requis"
      else if (fullName.trim().length < 2)
        errs.fullName = "Le nom doit contenir au moins 2 caractères"
      if (!orgName.trim())
        errs.orgName = "Le nom de l'entreprise est requis"
      else if (orgName.trim().length < 2)
        errs.orgName = "Le nom doit contenir au moins 2 caractères"
    }
    if (!email.trim())
      errs.email = "L'adresse email est requise"
    else if (!EMAIL_RE.test(email))
      errs.email = "Adresse email invalide"
    if (!password)
      errs.password = "Le mot de passe est requis"
    else if (password.length < 8)
      errs.password = "Le mot de passe doit contenir au moins 8 caractères"
    return errs
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setFieldErrors(validate())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Record<string, boolean> = { email: true, password: true }
    if (mode === "register") { allTouched.fullName = true; allTouched.orgName = true }
    setTouched(allTouched)

    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setApiError(null)
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login"
        ? { email: email.trim(), password }
        : { email: email.trim(), password, fullName: fullName.trim(), organisationName: orgName.trim() }

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? "Une erreur est survenue. Veuillez réessayer.")
        return
      }

      const apiUser  = data.user
      const roleName = typeof apiUser.role === "string" ? apiUser.role : (apiUser.role?.name ?? "")
      const parts    = (apiUser.fullName ?? "").trim().split(" ")
      const prenom   = parts[0] ?? ""
      const nom      = parts.slice(1).join(" ") || ""

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
      setApiError("Impossible de contacter le serveur. Vérifiez votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (name: string) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-150 bg-white
     placeholder:text-gray-400 focus:ring-2 focus:ring-offset-0 pr-10
     ${touched[name] && fieldErrors[name as keyof FormErrors]
       ? "border-red-400 focus:border-red-400 focus:ring-red-100"
       : "border-gray-200 focus:border-primary focus:ring-primary/10"}`

  const FieldError = ({ name }: { name: keyof FormErrors }) =>
    touched[name] && fieldErrors[name] ? (
      <p role="alert" className="flex items-center gap-1 text-xs text-red-600 mt-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {fieldErrors[name]}
      </p>
    ) : null

  const passwordStrength = (() => {
    if (!password || mode !== "register") return null
    if (password.length < 8) return { label: "Trop court", color: "bg-red-400", w: "w-1/4" }
    if (password.length < 10) return { label: "Faible", color: "bg-orange-400", w: "w-2/4" }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: "Moyen", color: "bg-yellow-400", w: "w-3/4" }
    return { label: "Fort", color: "bg-green-500", w: "w-full" }
  })()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8" aria-label="ENGIPILOT">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Building2 className="w-7 h-7 text-white" strokeWidth={2.5} aria-hidden />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ENGIPILOT</h1>
          <p className="text-sm text-gray-500 mt-1">Supervision intelligente des chantiers BTP</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7" role="tablist" aria-label="Mode d'authentification">
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  mode === m
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "login" ? "Se connecter" : "Créer un compte"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === "login" ? "Connexion à votre espace" : "Créer votre compte"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "login"
                ? "Entrez vos identifiants pour accéder à la plateforme"
                : "Renseignez vos informations pour commencer gratuitement"}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Formulaire d'authentification">

            {/* Register-only fields */}
            {mode === "register" && (
              <>
                <div>
                  <label htmlFor="fullName" className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Nom complet <span aria-hidden className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden />
                    <input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={e => { setFullName(e.target.value); if (touched.fullName) setFieldErrors(validate()) }}
                      onBlur={() => handleBlur("fullName")}
                      placeholder="Entrez votre nom complet"
                      className={`${fieldClass("fullName")} pl-9`}
                      aria-required="true"
                      aria-invalid={!!(touched.fullName && fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                    />
                    {touched.fullName && !fieldErrors.fullName && fullName && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" aria-hidden />
                    )}
                  </div>
                  <span id="fullName-error"><FieldError name="fullName" /></span>
                </div>

                <div>
                  <label htmlFor="orgName" className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Nom de l'entreprise <span aria-hidden className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden />
                    <input
                      id="orgName"
                      type="text"
                      autoComplete="organization"
                      value={orgName}
                      onChange={e => { setOrgName(e.target.value); if (touched.orgName) setFieldErrors(validate()) }}
                      onBlur={() => handleBlur("orgName")}
                      placeholder="Entrez le nom de votre entreprise"
                      className={`${fieldClass("orgName")} pl-9`}
                      aria-required="true"
                      aria-invalid={!!(touched.orgName && fieldErrors.orgName)}
                      aria-describedby={fieldErrors.orgName ? "orgName-error" : undefined}
                    />
                    {touched.orgName && !fieldErrors.orgName && orgName && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" aria-hidden />
                    )}
                  </div>
                  <span id="orgName-error"><FieldError name="orgName" /></span>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-xs font-semibold text-gray-700 block mb-1.5">
                Adresse email <span aria-hidden className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (touched.email) setFieldErrors(validate()) }}
                  onBlur={() => handleBlur("email")}
                  placeholder="Entrez votre adresse email"
                  className={`${fieldClass("email")} pl-9`}
                  aria-required="true"
                  aria-invalid={!!(touched.email && fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                />
                {touched.email && !fieldErrors.email && email && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" aria-hidden />
                )}
              </div>
              <span id="email-error"><FieldError name="email" /></span>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-xs font-semibold text-gray-700 block mb-1.5">
                Mot de passe <span aria-hidden className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (touched.password) setFieldErrors(validate()) }}
                  onBlur={() => handleBlur("password")}
                  placeholder="Entrez votre mot de passe"
                  className={`${fieldClass("password")} pl-9 pr-10`}
                  aria-required="true"
                  aria-invalid={!!(touched.password && fieldErrors.password)}
                  aria-describedby={`${fieldErrors.password ? "password-error" : ""} ${passwordStrength ? "password-strength" : ""}`.trim() || undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  aria-label={showPass ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  {showPass ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                </button>
              </div>
              <span id="password-error"><FieldError name="password" /></span>

              {/* Password strength (register only) */}
              {passwordStrength && (
                <div id="password-strength" aria-live="polite" className="mt-2">
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.w}`} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Force : <span className="font-medium">{passwordStrength.label}</span></p>
                </div>
              )}
            </div>

            {/* API error */}
            {apiError && (
              <div role="alert" className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
                <span>{apiError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-primary hover:bg-primary-hover active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                         text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm
                         flex items-center justify-center gap-2 shadow-sm mt-2
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  <span>{mode === "login" ? "Connexion en cours…" : "Création du compte…"}</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Se connecter" : "Créer mon compte"}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {mode === "login" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  S'inscrire gratuitement
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} ENGIPILOT — SaaS BTP Maroc
        </p>
      </div>
    </div>
  )
}
