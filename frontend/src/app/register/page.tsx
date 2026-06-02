"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, User, Mail, Lock,
  Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(
  prenom: string,
  nom: string,
  email: string,
  password: string,
): string | null {
  if (!prenom.trim())  return "Le prénom est obligatoire"
  if (!nom.trim())     return "Le nom est obligatoire"
  if (!email.trim())   return "L'adresse email est obligatoire"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Adresse email invalide"
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères"
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [prenom,       setPrenom]       = useState("")
  const [nom,          setNom]          = useState("")
  const [email,        setEmail]        = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validate(prenom, nom, email, password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await register({ firstName: prenom, lastName: nom, email, password })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite")
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="bg-white rounded-3xl shadow-xl border p-12 flex flex-col items-center gap-6 max-w-sm w-full mx-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Compte créé avec succès !</h2>
            <p className="text-gray-500 mt-2">Redirection vers votre espace ENGIPILOT...</p>
          </div>
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/landing")}
            className="flex items-center gap-3 hover:opacity-75 transition-opacity"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900">ENGIPILOT</span>
          </button>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-10">

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-gray-900">Créer votre compte</h1>
              <p className="text-gray-500 mt-2">Rejoignez ENGIPILOT et pilotez vos chantiers</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Prénom <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={prenom}
                      onChange={e => setPrenom(e.target.value)}
                      placeholder="Karim"
                      autoComplete="given-name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 text-sm
                                 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Nom <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                      placeholder="Benali"
                      autoComplete="family-name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 text-sm
                                 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Adresse email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@entreprise.ma"
                    autoComplete="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 text-sm
                               outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Mot de passe <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 pr-10 text-sm
                               outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50
                                border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white text-base bg-blue-600
                           hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg
                           transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Se connecter
                </button>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
