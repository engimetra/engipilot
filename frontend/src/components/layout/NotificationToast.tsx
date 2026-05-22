"use client"
import { useEffect, useState } from "react"
import { useNotifications, type NotifPayload } from "@/hooks/useNotifications"
import { AlertTriangle, CheckCircle, ShieldAlert, X } from "lucide-react"

type Toast = NotifPayload & { id: number }

const ICONS: Record<string, typeof AlertTriangle> = {
  IA_ALERTE:    AlertTriangle,
  RAPPORT_VALIDE: CheckCircle,
  INCIDENT_HSE: ShieldAlert,
}

const COLORS: Record<string, string> = {
  IA_ALERTE:     "border-danger/40 bg-danger/5 text-danger",
  RAPPORT_VALIDE: "border-success/40 bg-success/5 text-success",
  INCIDENT_HSE:  "border-warning/40 bg-warning/5 text-warning",
}

let _id = 0

export function NotificationToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useNotifications(notif => {
    const id = ++_id
    setToasts(prev => [...prev.slice(-4), { ...notif, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6_000)
  })

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      {toasts.map(t => {
        const Icon   = ICONS[t.type]  ?? AlertTriangle
        const color  = COLORS[t.type] ?? "border-border bg-white text-foreground"
        const titre  = (t.data.titre       as string | undefined) ?? t.type
        const desc   = (t.data.description as string | undefined) ?? ""
        const niveau = (t.data.niveau      as string | undefined) ?? ""

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 border rounded-xl px-4 py-3 shadow-lg animate-[pageEnter_0.2s_ease] ${color}`}
          >
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{titre}</p>
              {desc && <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{desc}</p>}
              {niveau && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-current/10 border border-current/20">
                  {niveau}
                </span>
              )}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
