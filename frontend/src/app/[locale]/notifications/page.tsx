"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, XCircle, AlertTriangle, CheckCircle2, Info, Brain, ChevronRight, CheckCheck, RefreshCw, Trash2 } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiNotif {
  id:        string
  title:     string
  message:   string
  type:      "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "AI_ALERT" | "SYSTEM"
  isRead:    boolean
  createdAt: string
  project:   { id: string; name: string } | null
}

// ── Mapping DB type → UI config ───────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  wrap: string; icon: React.ElementType; iconColor: string
  badgeBg: string; badgeText: string; label: string
  avatarColor: string; filterKey: string
}> = {
  AI_ALERT: { wrap:"border-danger/20 bg-danger/[0.04]",   icon:XCircle,       iconColor:"text-danger",  badgeBg:"bg-danger/10",  badgeText:"text-danger",  label:"CRITIQUE", avatarColor:"#635BFF", filterKey:"CRITIQUE" },
  ERROR:    { wrap:"border-danger/20 bg-danger/[0.04]",   icon:XCircle,       iconColor:"text-danger",  badgeBg:"bg-danger/10",  badgeText:"text-danger",  label:"CRITIQUE", avatarColor:"#E2445C", filterKey:"CRITIQUE" },
  WARNING:  { wrap:"border-warning/20 bg-warning/[0.04]", icon:AlertTriangle, iconColor:"text-warning", badgeBg:"bg-warning/10", badgeText:"text-warning", label:"ALERTE",   avatarColor:"#FDAB3D", filterKey:"ALERTE" },
  INFO:     { wrap:"border-primary/20 bg-primary/[0.04]", icon:Info,          iconColor:"text-primary", badgeBg:"bg-primary/10", badgeText:"text-primary", label:"INFO",     avatarColor:"#635BFF", filterKey:"INFO" },
  SUCCESS:  { wrap:"border-success/20 bg-success/[0.04]", icon:CheckCircle2,  iconColor:"text-success", badgeBg:"bg-success/10", badgeText:"text-success", label:"SUCCÈS",   avatarColor:"#00C875", filterKey:"SUCCES" },
  SYSTEM:   { wrap:"border-border bg-muted/30",           icon:Info,          iconColor:"text-muted-fg",badgeBg:"bg-muted",      badgeText:"text-muted-fg",label:"SYSTÈME",  avatarColor:"#9CA3AF", filterKey:"INFO" },
}

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.INFO
}

function formatTime(iso: string): string {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = now.getTime() - d.getTime()
  const h    = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (h < 1)    return "À l'instant"
  if (h < 24)   return `${h}h`
  if (days < 2) return "Hier"
  return d.toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit" })
}

function initiales(name: string): string {
  return name.trim().split(/\s+/).map(p => p[0]?.toUpperCase() ?? "").slice(0, 2).join("")
}

const FILTERS = [
  { key:"TOUTES",   label:"Toutes"   },
  { key:"NON_LUES", label:"Non lues" },
  { key:"CRITIQUE", label:"Critiques"},
  { key:"ALERTE",   label:"Alertes"  },
  { key:"INFO",     label:"Infos"    },
  { key:"SUCCES",   label:"Succès"   },
]

// ── Fetch / Mutate ────────────────────────────────────────────────────────────
async function fetchNotifications(): Promise<ApiNotif[]> {
  const res = await fetch("/api/notifications")
  if (!res.ok) throw new Error("Impossible de charger les notifications")
  return res.json()
}

async function markRead(payload: { id?: string; all?: boolean }) {
  const res = await fetch("/api/notifications", {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Erreur")
}

async function deleteNotif(params: { id?: string; all?: boolean }) {
  const qs  = params.all ? "all=true" : `id=${params.id}`
  const res = await fetch(`/api/notifications?${qs}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Erreur suppression")
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [filter, setFilter] = useState("TOUTES")
  const queryClient = useQueryClient()

  const { data: notifs = [], isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn:  fetchNotifications,
  })

  // Refresh automatique quand une notification STOMP arrive
  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
    window.addEventListener("engipilot:notification", handler)
    return () => window.removeEventListener("engipilot:notification", handler)
  }, [queryClient])

  const mutation = useMutation({
    mutationFn: markRead,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotif,
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const prev = queryClient.getQueryData<ApiNotif[]>(["notifications"])
      queryClient.setQueryData<ApiNotif[]>(["notifications"], old =>
        params.all ? [] : (old ?? []).filter(n => n.id !== params.id)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications"], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const unreadCount = notifs.filter(n => !n.isRead).length

  const filtered = notifs.filter(n => {
    if (filter === "TOUTES")   return true
    if (filter === "NON_LUES") return !n.isRead
    const cfg = getConfig(n.type)
    return cfg.filterKey === filter
  })

  return (
    <div className="space-y-6 page-enter">

      {/* ══ HEADER ══ */}
      <div className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background:"linear-gradient(135deg, #E2445C08 0%, #ffffff 40%, #635BFF08 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage:"linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {unreadCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 px-2.5 py-1 rounded-full">
                  <Bell className="w-3 h-3" /> {unreadCount} non lues
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <Brain className="w-3 h-3" /> Données réelles
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-foreground tracking-tight">Alert Center</h1>
            <p className="text-sm text-muted-fg mt-1">
              {isLoading ? "Chargement…" : `${notifs.length} notification${notifs.length !== 1 ? "s" : ""} · Base de données`}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => refetch()}
              className="p-2 border border-border rounded-xl bg-white hover:bg-muted transition-colors text-muted-fg shadow-card"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={() => mutation.mutate({ all: true })}
                disabled={mutation.isPending}
                className="flex items-center gap-2 bg-white hover:bg-muted border border-border text-foreground text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-60"
              >
                <CheckCheck className="w-3.5 h-3.5 text-primary" /> Tout marquer lu
              </button>
            )}
            {notifs.length > 0 && (
              <button
                onClick={() => deleteMutation.mutate({ all: true })}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 bg-white hover:bg-danger/5 border border-border hover:border-danger/30 text-muted-fg hover:text-danger text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" /> Tout supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Non lues",  value: String(unreadCount),                                          color:"text-danger",  bg:"bg-danger/10",  border:"border-danger/20"  },
          { label:"Critiques", value: String(notifs.filter(n=>n.type==="AI_ALERT"||n.type==="ERROR").length), color:"text-danger",  bg:"bg-danger/10",  border:"border-danger/20"  },
          { label:"Alertes",   value: String(notifs.filter(n=>n.type==="WARNING").length),          color:"text-warning", bg:"bg-warning/10", border:"border-warning/20" },
          { label:"Succès",    value: String(notifs.filter(n=>n.type==="SUCCESS").length),          color:"text-success", bg:"bg-success/10", border:"border-success/20" },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-2xl p-4 shadow-card flex items-center gap-3 ${s.border}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <Bell className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-fg font-medium uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{isLoading ? "—" : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══ FILTERS ══ */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const count = f.key === "TOUTES"   ? notifs.length
            : f.key === "NON_LUES" ? notifs.filter(n=>!n.isRead).length
            : notifs.filter(n => getConfig(n.type).filterKey === f.key).length
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors border
                ${filter===f.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border text-muted-fg hover:text-foreground shadow-card"}`}>
              {f.label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* ══ NOTIFICATION LIST ══ */}
      <div className="max-w-3xl space-y-2.5">
        {isLoading && (
          <div className="space-y-2.5">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white border border-border rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="bg-white border border-border rounded-2xl py-12 text-center shadow-card">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Tout est à jour</p>
            <p className="text-xs text-muted-fg mt-1">Aucune notification dans cette catégorie</p>
          </div>
        )}

        {filtered.map(n => {
          const cfg  = getConfig(n.type)
          const Icon = cfg.icon
          const isAI = n.type === "AI_ALERT"
          const avatarLabel = isAI ? "IA" : (n.project ? initiales(n.project.name) : "SY")
          return (
            <div
              key={n.id}
              onClick={() => !n.isRead && mutation.mutate({ id: n.id })}
              className={`flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-150 hover:shadow-card group
                ${!n.isRead ? cfg.wrap : "bg-white border-border"}`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-transform group-hover:scale-105"
                  style={{ background: cfg.avatarColor + "20", color: cfg.avatarColor }}
                >
                  {isAI
                    ? <Brain className="w-4 h-4" style={{ color: cfg.avatarColor }} />
                    : avatarLabel
                  }
                </div>
                {!n.isRead && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                      {cfg.label}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} strokeWidth={2.5} />
                    {n.project && (
                      <span className="text-[9px] text-muted-fg font-medium">{n.project.name}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-fg font-mono flex-shrink-0">
                    {formatTime(n.createdAt)}
                  </span>
                </div>
                <p className={`text-sm font-semibold leading-snug ${!n.isRead ? "text-foreground" : "text-muted-fg"}`}>
                  {n.title}
                </p>
                <p className="text-[11px] text-muted-fg mt-0.5 leading-snug">{n.message}</p>
              </div>

              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-muted-fg/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                <button
                  onClick={e => { e.stopPropagation(); deleteMutation.mutate({ id: n.id }) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-danger text-muted-fg/40"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
