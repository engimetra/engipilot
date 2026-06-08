"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get("token") ?? ""

  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState("")

  useEffect(() => {
    if (!token) setError("Lien invalide. Veuillez refaire la demande.")
  }, [token])

  const passwordOk = password.length >= 8
  const match      = password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordOk || !match) return
    setLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la réinitialisation")
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 3000)
      }
    } catch {
      setError("Impossible de contacter le serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e512d]/10 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#1e512d]/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#1e512d]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-[#1e512d]" />
            <p className="text-center text-gray-700 font-medium">
              Mot de passe mis à jour avec succès !
            </p>
            <p className="text-sm text-gray-500">Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e512d] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && !passwordOk && (
                <p className="text-xs text-red-500 mt-1">Minimum 8 caractères requis</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="confirm"
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e512d] focus:border-transparent"
                  required
                />
              </div>
              {confirm && !match && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordOk || !match || !token}
              className="w-full py-2.5 rounded-lg bg-[#1e512d] text-white font-semibold text-sm
                         hover:bg-[#1e512d]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Réinitialiser le mot de passe
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full text-sm text-gray-500 hover:text-[#1e512d] transition-colors"
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
