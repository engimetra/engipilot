"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, ArrowRight, User, Mail, Phone, Briefcase, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react"
import { useStore } from "@/store/useStore"
import type { Utilisateur } from "@/types"

/* ── Provider config (mirrors login page) ── */
const PROVIDERS: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  google:    { label: "Google",    color: "#4285F4", bg: "#EEF4FF", textColor: "#fff" },
  microsoft: { label: "Microsoft", color: "#737373", bg: "#F5F5F5", textColor: "#fff" },
  facebook:  { label: "Facebook",  color: "#1877F2", bg: "#EBF3FF", textColor: "#fff" },
  linkedin:  { label: "LinkedIn",  color: "#0A66C2", bg: "#E8F0F8", textColor: "#fff" },
}

const PROVIDER_ICONS: Record<string, () => React.ReactElement> = {
  google: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  microsoft: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
    </svg>
  ),
  facebook: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  ),
  linkedin: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#0A66C2" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
}

const ROLES = [
  "Chef de projet",
  "Conducteur de travaux",
  "Chef de chantier",
  "Responsable HSE",
  "Directeur technique",
  "Ingénieur BTP",
  "Consultant",
  "Autre",
]

/* ── Inner component that reads search params ── */
function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const providerId = params.get("provider") ?? "google"
  const provider = PROVIDERS[providerId] ?? PROVIDERS.google
  const ProviderIcon = PROVIDER_ICONS[providerId] ?? PROVIDER_ICONS.google

  const setUser = useStore(s => s.setUser)

  const [prenom, setPrenom] = useState("")
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [telephone, setTelephone] = useState("")
  const [entreprise, setEntreprise] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    const fakeEmails: Record<string, string> = {
      google:    "utilisateur@gmail.com",
      microsoft: "utilisateur@outlook.com",
      facebook:  "utilisateur@facebook.com",
      linkedin:  "utilisateur@linkedin.com",
    }
    setEmail(fakeEmails[providerId] ?? "")
  }, [providerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email,
          password,
          firstName: prenom,
          lastName:  nom,
          phone:     telephone || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? "Erreur lors de la création du compte")
        return
      }

      const u: Utilisateur = {
        id:              data.user.id,
        email:           data.user.email,
        prenom:          data.user.firstName,
        nom:             data.user.lastName,
        role:            "UTILISATEUR_STANDARD",
        organisation_id: data.user.company.id,
        actif:           true,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      }
      setUser(u)
      setSuccess(true)
      setTimeout(() => router.push("/onboarding"), 1500)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="bg-white rounded-3xl shadow-xl border p-12 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900">Compte créé !</h2>
            <p className="text-gray-500 mt-2">Redirection vers votre tableau de bord...</p>
          </div>
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">

      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/landing")}
            className="flex items-center gap-3 hover:opacity-75 transition-opacity"
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900">ENGIPILOT</span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/landing")}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors"
            >
              <span>🏠</span>
              <span>Accueil</span>
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          {/* Provider badge */}
          <div className="flex justify-center mb-8">
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-sm bg-white"
            >
              <ProviderIcon />
              <div>
                <p className="text-xs text-gray-400 leading-none">Connecté via</p>
                <p className="font-bold text-gray-800">{provider.label}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 ml-1" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-10">

            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-gray-900">Créer votre compte</h1>
              <p className="text-gray-500 mt-2">
                Complétez vos informations pour rejoindre ENGIPILOT
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Prénom <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                      placeholder="Karim" required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 outline-none
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
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
                      type="text" value={nom} onChange={e => setNom(e.target.value)}
                      placeholder="Benali" required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 outline-none
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Email — pré-rempli depuis le provider */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Adresse email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vous@entreprise.ma" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 pr-24 outline-none
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded-lg text-white"
                    style={{ backgroundColor: provider.color }}
                  >
                    {provider.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Email récupéré depuis votre compte {provider.label}</p>
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
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères" required minLength={8}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 pr-10 outline-none
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                    placeholder="+212 6 00 00 00 00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 outline-none
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Entreprise + Rôle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Entreprise <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" value={entreprise} onChange={e => setEntreprise(e.target.value)}
                      placeholder="BTP Maroc SA" required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 outline-none
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Rôle <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={role} onChange={e => setRole(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-700"
                  >
                    <option value="">Sélectionner...</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* CGU */}
              <p className="text-xs text-gray-400 leading-relaxed">
                En créant un compte, vous acceptez les{" "}
                <button type="button" className="text-blue-600 hover:underline font-medium">
                  Conditions d'utilisation
                </button>{" "}
                et la{" "}
                <button type="button" className="text-blue-600 hover:underline font-medium">
                  Politique de confidentialité
                </button>{" "}
                d'ENGIPILOT.
              </p>

              {apiError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {apiError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white text-base
                           flex items-center justify-center gap-2 shadow-lg transition-all duration-150
                           disabled:opacity-60"
                style={{ backgroundColor: provider.color }}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    Créer mon compte avec {provider.label}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Already have account */}
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

/* ── Page wrapper with Suspense (required for useSearchParams) ── */
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
