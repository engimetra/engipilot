"use client"
import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bell, Search, Plus, LogOut, ChevronDown,
  AlertTriangle, CheckCircle2, Clock, Zap, X, ArrowRight, Menu,
  Layers,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import { useRouter } from "next/navigation"
import { Link, usePathname } from "@/i18n/navigation"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"

const PAGE_LABELS: Record<string, { label: string; emoji: string }> = {
  "/dashboard":     { label: "Dashboard",      emoji: "📊" },
  "/chantiers":     { label: "Chantiers",       emoji: "🏗️" },
  "/kanban":        { label: "Kanban",          emoji: "📋" },
  "/planning":      { label: "Planning",        emoji: "📅" },
  "/analytics":     { label: "Analytics",       emoji: "📈" },
  "/ia":            { label: "Module IA",       emoji: "🤖" },
  "/chat":          { label: "Chat IA",         emoji: "💬" },
  "/hse":           { label: "HSE",             emoji: "🦺" },
  "/qualite":       { label: "Qualité",         emoji: "✅" },
  "/rapports":      { label: "Rapports",        emoji: "📄" },
  "/documents":     { label: "Documents",       emoji: "📁" },
  "/equipes":       { label: "Équipes",         emoji: "👥" },
  "/notifications": { label: "Notifications",   emoji: "🔔" },
  "/parametres":    { label: "Paramètres",      emoji: "⚙️" },
  "/facturation":   { label: "Facturation",     emoji: "💳" },
  "/onboarding":    { label: "Onboarding",      emoji: "🚀" },
  "/admin":         { label: "Administration",  emoji: "🛡️" },
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
  RETARD: { icon: Clock,         bg: "var(--color-danger-light)",   text: "var(--color-danger)",   dot: "var(--color-danger)"   },
  BUDGET: { icon: AlertTriangle, bg: "var(--color-warning-light)",  text: "var(--color-warning)",  dot: "var(--color-warning)"  },
  HSE:    { icon: CheckCircle2,  bg: "var(--color-success-light)",  text: "var(--color-success)",  dot: "var(--color-success)"  },
  IA:     { icon: Zap,           bg: "var(--color-primary-light)",  text: "var(--color-primary)",  dot: "var(--color-primary)"  },
}

const INIT_NOTIFS: QuickNotif[] = [
  { id:"n1", type:"RETARD", title:"Retard critique détecté",  body:"Usine Bouskoura — lot Électricité +28j",  time:"Il y a 5 min",  read:false },
  { id:"n2", type:"BUDGET", title:"Dépassement budgétaire",   body:"Résidence Al Andalous — CPI = 0.87",      time:"Il y a 42 min", read:false },
  { id:"n3", type:"HSE",    title:"Incident HSE clôturé",     body:"NC-047 levée — Bouskoura R+2",            time:"Il y a 1h",     read:false },
  { id:"n4", type:"IA",     title:"Analyse IA disponible",    body:"Prédiction livraison mise à jour",        time:"Il y a 2h",     read:false },
  { id:"n5", type:"BUDGET", title:"Rapport mensuel généré",   body:"Mai 2025 — Résidence Al Andalous",        time:"Il y a 3h",     read:true  },
]

interface ApiProject { id: string; name: string; status: string }

export function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user, logout, projetActif, setProjetActif } = useStore()
  const role   = user?.role
  const router = useRouter()
  const pathname = usePathname()

  const [notifs, setNotifs]       = useState<QuickNotif[]>(INIT_NOTIFS)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen]   = useState(false)
  const [projOpen, setProjOpen]   = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef  = useRef<HTMLDivElement>(null)
  const projRef  = useRef<HTMLDivElement>(null)

  const { data: projects = [] } = useQuery<ApiProject[]>({
    queryKey: ["topbar-projects"],
    queryFn:  () => fetch("/api/projects").then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : []),
    staleTime: 5 * 60 * 1000,
  })

  const activeProject = projetActif ?? (projects[0] ? { id: projects[0].id, nom: projects[0].name } as never : null)
  const activeLabel   = (projetActif as {nom?: string} | null)?.nom ?? projects[0]?.name ?? "Sélectionner projet"

  const unreadCount = notifs.filter(n => !n.read).length

  const segment  = "/" + (pathname.split("/")[1] ?? "")
  const pageMeta = PAGE_LABELS[segment]

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false)
      if (projRef.current  && !projRef.current.contains(e.target as Node))  setProjOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })))
  const markRead    = (id: string) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n))

  const initials = [
    (user?.prenom?.[0] ?? "").toUpperCase(),
    (user?.nom?.[0]    ?? "").toUpperCase(),
  ].join("") || "U"

  return (
    <header
      style={{
        height: "56px",
        background: "var(--color-card)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 20px",
        flexShrink: 0,
        boxShadow: "var(--shadow-topbar)",
        zIndex: 20,
      }}
    >
      {/* Hamburger — mobile */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        style={{ width: "32px", height: "32px", flexShrink: 0, color: "var(--color-muted-fg)" }}
        aria-label="Menu"
      >
        <Menu style={{ width: "18px", height: "18px" }} />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
        <Link
          href="/landing"
          className="flex items-center gap-1.5 transition-colors rounded-lg px-2 py-1 hover:bg-muted"
          style={{ color: "var(--color-muted-fg)", fontSize: "13px", fontWeight: 500 }}
        >
          <Layers style={{ width: "13px", height: "13px" }} />
          <span className="hidden sm:inline">ENGIPILOT</span>
        </Link>
        {pageMeta && (
          <>
            <span style={{ color: "var(--color-muted-fg)", fontSize: "16px", lineHeight: 1, userSelect: "none" }}>/</span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-foreground)",
                letterSpacing: "-0.01em",
              }}
            >
              {pageMeta.label}
            </span>
          </>
        )}
      </nav>

      {/* Search bar */}
      <div
        className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 ml-3 flex-1 max-w-sm transition-colors"
        style={{
          background: "var(--color-muted)",
          border: "1px solid var(--color-border)",
          cursor: "text",
        }}
      >
        <Search style={{ width: "13px", height: "13px", color: "var(--color-muted-fg-2)", flexShrink: 0 }} />
        <input
          placeholder="Rechercher..."
          style={{
            background: "transparent",
            fontSize: "13px",
            outline: "none",
            flex: 1,
            minWidth: 0,
            color: "var(--color-foreground)",
          }}
          className="placeholder:text-muted-fg-2"
        />
        <kbd
          style={{
            fontSize: "10px",
            padding: "1px 5px",
            borderRadius: "4px",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted-fg-2)",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1.5">

        {/* Project selector */}
        <div className="relative hidden md:block" ref={projRef}>
          <div
            onClick={() => setProjOpen(v => !v)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-muted cursor-pointer"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-card)" }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--color-success)" }} />
            <span style={{ fontSize: "12px", color: "var(--color-foreground-2)", fontWeight: 500, maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeLabel}
            </span>
            <ChevronDown style={{ width: "12px", height: "12px", color: "var(--color-muted-fg-2)", flexShrink: 0 }} />
          </div>
          {projOpen && projects.length > 0 && (
            <div className="absolute left-0 top-full mt-1 overflow-hidden" style={{ minWidth: "200px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "10px", boxShadow: "var(--shadow-float)", zIndex: 50 }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setProjetActif({ id: p.id, nom: p.name } as never); setProjOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                  style={{ fontSize: "12px", fontWeight: (projetActif as {id?: string} | null)?.id === p.id ? 700 : 500, color: "var(--color-foreground)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.status === "COMPLETED" ? "var(--color-muted-fg)" : "var(--color-success)" }} />
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New button */}
        <button
          onClick={() => router.push("/chantiers")}
          className="flex items-center gap-1.5 transition-all"
          style={{
            background: "#2563eb",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 1px 2px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#1d4ed8")}
          onMouseLeave={e => (e.currentTarget.style.background = "#2563eb")}
        >
          <Plus style={{ width: "13px", height: "13px" }} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nouveau</span>
        </button>

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Online status */}
        <div
          className="hidden lg:flex items-center gap-1.5"
          style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--color-success)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-success)", animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          En ligne
        </div>

        {/* ── Notifications ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: "32px",
              height: "32px",
              background: notifOpen ? "var(--color-primary-light)" : "transparent",
              color: notifOpen ? "var(--color-primary)" : "var(--color-muted-fg)",
            }}
            onMouseEnter={e => { if (!notifOpen) e.currentTarget.style.background = "var(--color-muted)" }}
            onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.background = "transparent" }}
          >
            <Bell style={{ width: "16px", height: "16px" }} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  minWidth: "14px",
                  height: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--color-danger)",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: 800,
                  borderRadius: "99px",
                  padding: "0 3px",
                  border: "2px solid var(--color-card)",
                  lineHeight: 1,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 overflow-hidden"
              style={{
                width: "320px",
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "14px",
                boxShadow: "var(--shadow-float)",
                zIndex: 50,
                animation: "slideDown 0.15s cubic-bezier(0.4,0,0.2,1) both",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center gap-2">
                  <Bell style={{ width: "13px", height: "13px", color: "var(--color-foreground)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        background: "var(--color-danger)",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: "99px",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)", padding: "3px 8px", borderRadius: "6px", cursor: "pointer" }}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      Tout lire
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    style={{ width: "24px", height: "24px", color: "var(--color-muted-fg)" }}
                  >
                    <X style={{ width: "13px", height: "13px" }} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {notifs.map(n => {
                  const cfg  = NOTIF_CONFIG[n.type]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className="flex items-start gap-3 cursor-pointer transition-colors"
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--color-border-subtle)",
                        background: !n.read ? "#dbeafe" : "#f8fafc",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#bfdbfe")}
                      onMouseLeave={e => (e.currentTarget.style.background = !n.read ? "#dbeafe" : "#f8fafc")}
                    >
                      <div
                        className="flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
                        style={{ width: "28px", height: "28px", background: cfg.bg }}
                      >
                        <Icon style={{ width: "13px", height: "13px", color: cfg.text }} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: n.read ? 500 : 700,
                              color: n.read ? "var(--color-muted-fg)" : "var(--color-foreground)",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "180px",
                            }}
                          >
                            {n.title}
                          </p>
                          {!n.read && (
                            <span
                              className="flex-shrink-0 mt-1"
                              style={{ width: "6px", height: "6px", borderRadius: "99px", background: cfg.dot }}
                            />
                          )}
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--color-muted-fg)", marginTop: "2px", lineHeight: 1.4 }} className="truncate">
                          {n.body}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--color-muted-fg-2)", marginTop: "3px" }}>{n.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div
                className="px-4 py-2.5"
                style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-muted)" }}
              >
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center justify-center gap-1.5 transition-colors"
                  style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)" }}
                >
                  Voir toutes les notifications
                  <ArrowRight style={{ width: "13px", height: "13px" }} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── User menu ── */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(v => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
            style={{ cursor: "pointer", border: "none", background: "transparent" }}
          >
            {role === "SUPER_ADMIN" ? (
              <div
                className="flex items-center justify-center rounded-full text-white flex-shrink-0"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)",
                  fontSize: "10px",
                  fontWeight: 900,
                  boxShadow: "0 0 0 2px rgba(124,58,237,0.25)",
                }}
              >
                SA
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  fontSize: "11px",
                  fontWeight: 800,
                  boxShadow: "0 0 0 2px var(--color-primary-light)",
                }}
              >
                {initials}
              </div>
            )}

            <div className="hidden lg:flex flex-col text-left leading-none">
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--color-foreground)",
                  letterSpacing: "-0.01em",
                }}
              >
                {user ? `${user.prenom} ${user.nom ?? ""}`.trim() : "Utilisateur"}
              </span>
              {role && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: role === "SUPER_ADMIN" ? "var(--color-purple)" : "var(--color-muted-fg)",
                    marginTop: "1px",
                  }}
                >
                  {role === "SUPER_ADMIN" ? "⚡ Super Admin" : role.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <ChevronDown
              style={{ width: "13px", height: "13px", color: "var(--color-muted-fg-2)" }}
              className="hidden lg:inline"
            />
          </button>

          {userOpen && (
            <div
              className="absolute right-0 top-full mt-2 overflow-hidden"
              style={{
                width: "200px",
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-float)",
                zIndex: 50,
                animation: "slideDown 0.15s cubic-bezier(0.4,0,0.2,1) both",
              }}
            >
              <div className="p-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-foreground)" }}>
                  {user ? `${user.prenom} ${user.nom ?? ""}`.trim() : "Utilisateur"}
                </p>
                <p style={{ fontSize: "11px", color: "var(--color-muted-fg)", marginTop: "2px" }} className="truncate">
                  {user?.email ?? ""}
                </p>
              </div>
              <div className="p-1.5">
                <Link
                  href="/parametres"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 hover:bg-muted transition-colors"
                  style={{ fontSize: "12.5px", color: "var(--color-foreground-2)", fontWeight: 500 }}
                >
                  Paramètres
                </Link>
                <button
                  onClick={() => { logout(); router.push("/login") }}
                  className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 hover:bg-danger/8 transition-colors"
                  style={{ fontSize: "12.5px", color: "var(--color-danger)", fontWeight: 500 }}
                >
                  <LogOut style={{ width: "13px", height: "13px" }} />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
