"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react"
import { useStore } from "@/store/useStore"
import type { RolePlateforme, Utilisateur } from "@/types"

type Mode = "login" | "register"

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

export default function LoginPage() {
  const router  = useRouter()
  const setUser = useStore(s => s.setUser)

  const [mode, setMode]               = useState<Mode>("login")
  const [email, setEmail]             = useState("")
  const [password, setPassword]       = useState("")
  const [fullName, setFullName]       = useState("")
  const [orgName, setOrgName]         = useState("")
  const [showPass, setShowPass]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login"
        ? { email, password }
        : { email, password, fullName, organisationName: orgName }

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue")
        return
      }

      const apiUser = data.user
      const roleName = typeof apiUser.role === "string" ? apiUser.role : apiUser.role?.name ?? ""
      const [prenom = "", nom = ""] = (apiUser.fullName ?? "").trim().split(" ")

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
      setError("Impossible de contacter le serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-md">
            <Building2 className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">ENGIPILOT</h1>
          <p className="text-sm text-muted-fg mt-1">Supervision intelligente des chantiers BTP</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null) }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                  mode === m
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-fg hover:text-foreground"
                }`}
              >
                {m === "login" ? "Se connecter" : "Créer un compte"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Register-only fields */}
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Ismail Amzil"
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Nom de l'entreprise</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="BTP Construction Maroc"
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@entreprise.ma"
                  className="input pl-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold
                         py-2.5 rounded-lg transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "login" ? "Connexion..." : "Création du compte..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch */}
          <p className="mt-5 text-center text-sm text-muted-fg">
            {mode === "login" ? (
              <>
                Pas encore de compte ?{" "}
                <button type="button" onClick={() => { setMode("register"); setError(null) }}
                  className="text-primary font-semibold hover:underline">
                  S'inscrire
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button type="button" onClick={() => { setMode("login"); setError(null) }}
                  className="text-primary font-semibold hover:underline">
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-muted-fg mt-6">© 2026 ENGIPILOT — SaaS BTP Maroc</p>
      </div>
    </div>
  )
}
