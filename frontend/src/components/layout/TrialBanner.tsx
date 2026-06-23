"use client"
import { useOrganisationUsage } from "@/hooks/useOrganisationUsage"
import { AlertTriangle, X, Zap } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export function TrialBanner() {
  const { usage, loading } = useOrganisationUsage()
  const [dismissed, setDismissed] = useState(false)
  if (loading || dismissed || !usage) return null
  if (usage.plan !== "TRIAL") return null
  const isExpired = usage.isTrialExpired
  const daysLeft  = usage.daysLeftInTrial ?? 0
  const isUrgent  = !isExpired && daysLeft <= 3
  if (!isExpired && daysLeft > 14) return null
  return (
    <div className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
      isExpired ? "bg-red-600 text-white" : isUrgent ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
    }`}>
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        {isExpired
          ? "Votre période d'essai a expiré. Vos données sont conservées 30 jours."
          : daysLeft === 0 ? "Votre période d'essai expire aujourd'hui !"
          : `Il vous reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai.`}
      </span>
      <Link href="/facturation" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors text-white font-semibold text-xs">
        <Zap className="w-3.5 h-3.5" /> Passer au Pro
      </Link>
      {!isExpired && (
        <button onClick={() => setDismissed(true)} className="hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
