"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { loginUser } from "@/lib/auth.service"

export function LoginForm() {
  const [email,        setEmail]        = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await loginUser(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-foreground block mb-1.5">
          Adresse email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@entreprise.ma"
            className="input pl-9"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground block mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input pl-9 pr-10"
            required
            minLength={6}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold
                   py-2.5 rounded-lg transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connexion en cours...
          </>
        ) : (
          <>
            Se connecter
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted-fg">
        Pas encore de compte ?{" "}
        <a href="/register" className="text-primary font-semibold hover:underline">
          Créer un compte
        </a>
      </p>
    </form>
  )
}
