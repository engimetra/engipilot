"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from "@/i18n/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("errors")
  const router = useRouter()

  useEffect(() => {
    console.error("[ENGIPILOT] Error boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {t("title", { defaultValue: "Une erreur est survenue" })}
        </h1>
        <p className="text-slate-500 mb-6 text-sm">
          {t("description", { defaultValue: "Quelque chose s'est mal passé. Notre équipe a été notifiée." })}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-50 px-3 py-1 rounded">
            ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            {t("retry", { defaultValue: "Réessayer" })}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            {t("home", { defaultValue: "Accueil" })}
          </button>
        </div>
      </div>
    </div>
  )
}
