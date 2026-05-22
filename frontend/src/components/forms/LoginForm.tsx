"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [email, setEmail] = useState("demo@engipilot.ma")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await new Promise(r => setTimeout(r, 600))
      if (email === "demo@engipilot.ma" && password === "demo123") {
        router.push("/dashboard")
      } else {
        setError("Email ou mot de passe incorrect")
      }
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={onSubmit} className="bg-card border rounded-2xl p-6 space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">{error}</div>}
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-fg block mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-muted border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" required />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-fg block mb-1.5">Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-muted border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors" required />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
        {loading ? "Connexion…" : "Se connecter →"}
      </button>
    </form>
  )
}
