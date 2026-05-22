"use client"
import { useState, useRef, useEffect } from "react"
import {
  Bell, Search, Plus, LogOut, ChevronDown,
  AlertTriangle, CheckCircle2, Clock, Zap, X, ArrowRight, Home,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import { useRouter } from "next/navigation"
import { Link, usePathname } from "@/i18n/navigation"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/chantiers":     "Chantiers",
  "/kanban":        "Kanban",
  "/planning":      "Planning",
  "/analytics":     "Analytics",
  "/ia":            "Module IA",
  "/chat":          "Chat IA",
  "/hse":           "HSE",
  "/qualite":       "Qualité NC",
  "/rapports":      "Rapports",
  "/documents":     "Documents",
  "/equipes":       "Équipes",
  "/notifications": "Notifications",
  "/parametres":    "Paramètres",
  "/facturation":   "Facturation",
  "/onboarding":    "Onboarding",
  "/admin":         "Administration",
}

type NotifType = "RETARD" | "BUDGET" | "HSE" | "IA"

interface QuickNotif {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
}

const NOTIF_CONFIG: Record<NotifType, { icon: React.ElementType; bg: string; text: string; dot: string }> = {
  RETARD: { icon: Clock,         bg: "bg-danger/10",   text: "text-danger",   dot: "bg-danger"   },
  BUDGET: { icon: AlertTriangle, bg: "bg-warning/10",  text: "text-warning",  dot: "bg-warning"  },
  HSE:    { icon: CheckCircle2,  bg: "bg-success/10",  text: "text-success",  dot: "bg-success"  },
  IA:     { icon: Zap,           bg: "bg-primary/10",  text: "text-primary",  dot: "bg-primary"  },
}

const INIT_NOTIFS: QuickNotif[] = [
  { id:"n1", type:"RETARD", title:"Retard critique détecté",      body:"Usine Bouskoura — lot Électricité +28j",  time:"Il y a 5 min",  read:false },
  { id:"n2", type:"BUDGET", title:"Dépassement budgétaire",       body:"Résidence Al Andalous — CPI = 0.87",      time:"Il y a 42 min", read:false },
  { id:"n3", type:"HSE",    title:"Incident HSE clôturé",         body:"NC-047 levée — Bouskoura R+2",            time:"Il y a 1h",     read:false },
  { id:"n4", type:"IA",     title:"Analyse IA disponible",        body:"Prédiction livraison mise à jour",        time:"Il y a 2h",     read:false },
  { id:"n5", type:"BUDGET", title:"Rapport mensuel généré",       body:"Mai 2025 — Résidence Al Andalous",        time:"Il y a 3h",     read:true  },
]

export function Topbar() {
  const { user, logout } = useStore()
  const role = user?.role
  const router = useRouter()
  const pathname = usePathname()

  const [notifs, setNotifs] = useState<QuickNotif[]>(INIT_NOTIFS)
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter(n => !n.read).length

  const segment = "/" + (pathname.split("/")[1] ?? "")
  const pageLabel = PAGE_LABELS[segment] ?? "ENGIPILOT"

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="h-14 bg-white border-b border-border flex items-center gap-3 px-6 flex-shrink-0">
      {/* Back to home + Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-shrink-0">
        <Link
          href="/landing"
          className="flex items-center gap-1.5 text-muted-fg hover:text-primary transition-colors duration-150 group"
          title="Retour à la page d'accueil"
        >
          <span className="w-7 h-7 flex items-center justify-center rounded-lg group-hover:bg-primary/10 transition-colors duration-150">
            <Home className="w-3.5 h-3.5" />
          </span>
          <span className="hidden sm:inline font-medium">ENGIPILOT</span>
        </Link>
        <span className="text-muted-fg hidden sm:inline">/</span>
        <span className="font-semibold text-foreground truncate">{pageLabel}</span>
      </nav>

      {/* Search */}
      <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2 flex-1 max-w-xs ml-2">
        <Search className="w-3.5 h-3.5 text-muted-fg flex-shrink-0" />
        <input
          placeholder="Rechercher..."
          className="bg-transparent text-sm outline-none flex-1 min-w-0 placeholder:text-muted-fg"
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Project selector */}
        <div className="hidden md:flex items-center gap-1.5 bg-muted border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#EAECF0] transition-colors duration-150 group">
          <span className="text-xs text-muted-fg group-hover:text-foreground truncate max-w-[130px] transition-colors">
            Résidence Al Andalous
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-fg flex-shrink-0" />
        </div>

        {/* New button */}
        <button className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors duration-150 shadow-sm">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">Nouveau</span>
        </button>

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Online status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-success font-medium">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          En ligne
        </div>

        {/* ── Notifications bell + dropdown ── */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150
              ${open ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-fg"}`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 flex items-center justify-center
                               bg-danger text-white text-[9px] font-black rounded-full px-0.5 border border-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-2xl shadow-card-lg z-50 overflow-hidden animate-[pageEnter_0.15s_ease]">
              {/* Dropdown header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-foreground" />
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black bg-danger text-white px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-semibold text-primary hover:text-primary-hover transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                    >
                      Tout lire
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-fg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-72 overflow-y-auto">
                {notifs.map(n => {
                  const cfg = NOTIF_CONFIG[n.type]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer
                        hover:bg-muted/40 transition-colors duration-150
                        ${!n.read ? "bg-primary/[0.02]" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${cfg.text}`} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-tight truncate ${n.read ? "text-muted-fg" : "text-foreground"}`}>
                            {n.title}
                          </p>
                          {!n.read && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${cfg.dot}`} />}
                        </div>
                        <p className="text-[11px] text-muted-fg mt-0.5 leading-snug truncate">{n.body}</p>
                        <p className="text-[10px] text-muted-fg/60 mt-1">{n.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/30">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Voir toutes les notifications
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User + role badge */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded-lg px-2 py-1 transition-colors duration-150">
          {role === "SUPER_ADMIN" ? (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#635BFF] to-[#8B5CF6]
                            flex items-center justify-center text-[10px] font-black text-white ring-2 ring-purple-300/50">
              SA
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/20">
              {user?.prenom?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div className="hidden lg:flex flex-col leading-none">
            <span className="text-sm font-semibold text-foreground">
              {user ? `${user.prenom} ${user.nom ?? ""}`.trim() : "Utilisateur"}
            </span>
            {role && (
              <span className={`text-[10px] font-bold mt-0.5 ${
                role === "SUPER_ADMIN" ? "text-purple-500" : "text-muted-fg"
              }`}>
                {role === "SUPER_ADMIN" ? "⚡ SUPER ADMIN" : role.replace("_", " ")}
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-fg hidden lg:inline" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/10 text-muted-fg hover:text-danger transition-colors duration-150"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
