import { useEffect, useState } from "react"

export interface OrgUsage {
  plan: "TRIAL" | "STARTER" | "PRO" | "ENTERPRISE"
  trialEndsAt: string | null
  chantiersCount: number
  chantiersLimit: number
  usersCount: number
  usersLimit: number
  storageGb: number
  storageLimit: number
  isTrialExpired: boolean
  daysLeftInTrial: number | null
}

const PLAN_LIMITS = {
  TRIAL:      { chantiers: 3,  users: 5,   storage: 1  },
  STARTER:    { chantiers: 5,  users: 10,  storage: 5  },
  PRO:        { chantiers: 20, users: 50,  storage: 20 },
  ENTERPRISE: { chantiers: -1, users: -1,  storage: -1 },
}

export function useOrganisationUsage() {
  const [usage, setUsage]     = useState<OrgUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/organisation/usage", { credentials: "include" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as Partial<OrgUsage>
        const plan = (data.plan ?? "TRIAL") as OrgUsage["plan"]
        const limits = PLAN_LIMITS[plan]
        const trialEndsAt = data.trialEndsAt ?? null
        const now = Date.now()
        const trialExpiry = trialEndsAt ? new Date(trialEndsAt).getTime() : null
        const isTrialExpired = plan === "TRIAL" && !!trialExpiry && trialExpiry < now
        const daysLeft = trialExpiry
          ? Math.max(0, Math.ceil((trialExpiry - now) / 86_400_000))
          : null
        if (!cancelled) {
          setUsage({
            plan, trialEndsAt,
            chantiersCount: data.chantiersCount ?? 0,
            chantiersLimit: limits.chantiers,
            usersCount:     data.usersCount ?? 0,
            usersLimit:     limits.users,
            storageGb:      data.storageGb ?? 0,
            storageLimit:   limits.storage,
            isTrialExpired,
            daysLeftInTrial: plan === "TRIAL" ? daysLeft : null,
          })
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { usage, loading, error }
}
