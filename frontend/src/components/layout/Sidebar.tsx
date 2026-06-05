"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"
import { ROLE_CONFIG } from "@/lib/rbac"
import type { Permission } from "@/lib/rbac"
import {
  Search, LogOut, Shield, X,
  LayoutDashboard, HardHat, SquareKanban, CalendarDays,
  FileText, BarChart2, ShieldCheck, CheckSquare,
  CreditCard, Package, FolderOpen,
  Bot, MessageSquare,
  Users, Bell, Rocket, Settings, ShieldAlert,
  ChevronRight,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"

interface NavItem {
  href:       string
  icon:       React.ElementType
  labelKey:   string
  badge?:     number
  danger?:    boolean
  permission: Permission
}

interface NavSection {
  sectionKey: string
  items:      NavItem[]
}

const NAV: NavSection[] = [
  {
    sectionKey: "principal",
    items: [
      { href: "/dashboard",  icon: LayoutDashboard, labelKey: "dashboard",  permission: "view:dashboard" },
      { href: "/chantiers",  icon: HardHat,         labelKey: "chantiers",  badge: 12, permission: "view:chantiers" },
      { href: "/kanban",     icon: SquareKanban,    labelKey: "kanban",     permission: "view:kanban"    },
      { href: "/planning",   icon: CalendarDays,    labelKey: "planning",   permission: "view:planning"  },
    ],
  },
  {
    sectionKey: "suivi",
    items: [
      { href: "/rapports",          icon: FileText,     labelKey: "rapports",          permission: "view:rapports"          },
      { href: "/analytics",         icon: BarChart2,    labelKey: "analytics",         permission: "view:analytics"         },
      { href: "/hse",               icon: ShieldCheck,  labelKey: "hse",               badge: 2,  danger: true, permission: "view:hse"    },
      { href: "/qualite",           icon: CheckSquare,  labelKey: "qualite",           badge: 4,  danger: true, permission: "view:qualite" },
      { href: "/facturation",       icon: CreditCard,   labelKey: "facturation",       permission: "view:facturation"       },
      { href: "/approvisionnement", icon: Package,      labelKey: "approvisionnement", permission: "view:approvisionnement" },
      { href: "/documents",         icon: FolderOpen,   labelKey: "documents",         permission: "view:documents"         },
    ],
  },
  {
    sectionKey: "ia",
    items: [
      { href: "/ia",   icon: Bot,           labelKey: "alertesIa",   badge: 3, permission: "view:ia"   },
      { href: "/chat", icon: MessageSquare, labelKey: "chatCopilot",           permission: "view:chat"  },
    ],
  },
  {
    sectionKey: "equipe",
    items: [
      { href: "/equipes",       icon: Users,    labelKey: "equipes",       permission: "view:equipes"       },
      { href: "/notifications", icon: Bell,     labelKey: "notifications", badge: 6, danger: true, permission: "view:notifications" },
      { href: "/onboarding",    icon: Rocket,   labelKey: "onboarding",    permission: "view:onboarding"    },
      { href: "/parametres",    icon: Settings, labelKey: "parametres",    permission: "view:parametres"    },
    ],
  },
  {
    sectionKey: "admin",
    items: [
      { href: "/admin", icon: ShieldAlert, labelKey: "adminPage", permission: "view:admin" },
    ],
  },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { can, isSuperAdmin, role, user } = usePermissions()
  const logout   = useStore(s => s.logout)
  const cfg      = role ? ROLE_CONFIG[role] : null
  const t        = useTranslations("nav")

  const [search, setSearch] = useState("")
  const q = search.toLowerCase().trim()

  const initials = [
    (user?.prenom?.[0] ?? "").toUpperCase(),
    (user?.nom?.[0] ?? "").toUpperCase(),
  ].join("")

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{
        width: "240px",
        background: "var(--color-sidebar)",
        borderRight: "1px solid var(--color-sidebar-border)",
      }}
    >
      {/* ── Logo header ── */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: "56px", borderBottom: "1px solid var(--color-sidebar-border)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0 flex-1">
          {/* Logo mark */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: "30px",
              height: "30px",
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)",
              boxShadow: "0 2px 8px rgba(91,82,245,0.35)",
            }}
          >
            <span style={{ color: "#fff", fontSize: "10px", fontWeight: 900, letterSpacing: "-0.05em" }}>EP</span>
          </div>
          {/* Brand name */}
          <div className="min-w-0">
            <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-foreground)", lineHeight: 1 }}>
              ENGIPILOT
            </div>
            <div style={{ fontSize: "9.5px", color: "var(--color-muted-fg-2)", lineHeight: 1.4, marginTop: "1px" }}>
              BTP · IA · SaaS
            </div>
          </div>
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden flex items-center justify-center rounded-lg transition-colors"
            style={{ width: "28px", height: "28px", color: "var(--color-muted-fg)" }}
            aria-label="Fermer"
          >
            <X style={{ width: "14px", height: "14px" }} />
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors"
          style={{
            background: "var(--color-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          <Search style={{ width: "12px", height: "12px", color: "var(--color-muted-fg-2)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search")}
            style={{
              background: "transparent",
              fontSize: "12px",
              outline: "none",
              flex: 1,
              minWidth: 0,
              color: "var(--color-foreground)",
            }}
            className="placeholder:text-muted-fg-2"
          />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 pb-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {NAV.map(({ sectionKey, items }) => {
          const visible = items.filter(item =>
            can(item.permission) && (!q || t(item.labelKey).toLowerCase().includes(q))
          )
          if (visible.length === 0) return null

          return (
            <div key={sectionKey} style={{ marginTop: "16px" }}>
              {/* Section label */}
              <p
                className="px-2 mb-1"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-muted-fg-2)",
                }}
              >
                {t(`sections.${sectionKey}`)}
              </p>

              {/* Nav items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {visible.map(({ href, icon: Icon, labelKey, badge, danger }) => {
                  const active = pathname === href || pathname.startsWith(href + "/")
                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch={true}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: active ? 600 : 450,
                        letterSpacing: "-0.01em",
                        transition: "background 0.12s ease, color 0.12s ease",
                        color: active ? "var(--color-primary)" : "var(--color-muted-fg)",
                        background: active ? "var(--color-primary-light)" : "transparent",
                        textDecoration: "none",
                        position: "relative",
                      }}
                      className={cn(
                        "group",
                        !active && "hover:bg-sidebar-hover hover:text-foreground-2"
                      )}
                    >
                      {/* Active indicator */}
                      {active && (
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "16px",
                            borderRadius: "0 3px 3px 0",
                            background: "var(--color-primary)",
                          }}
                        />
                      )}

                      <Icon
                        style={{
                          width: "14px",
                          height: "14px",
                          flexShrink: 0,
                          color: active ? "var(--color-primary)" : "var(--color-muted-fg-2)",
                          transition: "color 0.12s ease",
                        }}
                        strokeWidth={active ? 2.25 : 1.75}
                      />

                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t(labelKey)}
                      </span>

                      {badge !== undefined && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 5px",
                            borderRadius: "99px",
                            lineHeight: 1,
                            background: danger
                              ? "var(--color-danger-light)"
                              : active
                              ? "var(--color-primary-light)"
                              : "var(--color-muted)",
                            color: danger
                              ? "var(--color-danger)"
                              : active
                              ? "var(--color-primary)"
                              : "var(--color-muted-fg)",
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User footer ── */}
      <div style={{ borderTop: "1px solid var(--color-sidebar-border)", flexShrink: 0 }}>
        {isSuperAdmin ? (
          <div
            className="mx-3 my-3 rounded-xl p-3"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-purple-light) 100%)",
              border: "1px solid rgba(91,82,245,0.15)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full text-white"
                style={{
                  width: "32px",
                  height: "32px",
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)",
                  fontSize: "11px",
                  fontWeight: 800,
                  boxShadow: "0 2px 6px rgba(91,82,245,0.3)",
                }}
              >
                {(user?.prenom?.[0] ?? "S").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-foreground)", lineHeight: 1.2 }} className="truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p style={{ fontSize: "10px", color: "var(--color-muted-fg)", lineHeight: 1.4 }} className="truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "99px",
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)",
                  color: "#fff",
                  letterSpacing: "0.04em",
                }}
              >
                <Shield style={{ width: "9px", height: "9px" }} />
                SUPER ADMIN
              </span>

              <button
                onClick={() => { logout(); router.push("/login") }}
                className="flex items-center gap-1 transition-colors rounded-md hover:bg-danger/10 hover:text-danger px-2 py-1"
                style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-muted-fg)" }}
              >
                <LogOut style={{ width: "10px", height: "10px" }} />
                Déco
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { logout(); router.push("/login") }}
            className="w-full flex items-center gap-3 px-4 transition-colors group"
            style={{ padding: "12px 16px" }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ring-2"
              style={{
                width: "32px",
                height: "32px",
                background: cfg?.bg ?? "var(--color-primary-light)",
                color: cfg?.color ?? "var(--color-primary)",
                boxShadow: `0 0 0 2px ${cfg?.ring ?? "var(--color-primary-light)"}`,
              }}
            >
              {initials || "U"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-foreground)", lineHeight: 1.2 }} className="truncate">
                {user ? `${user.prenom} ${user.nom}` : "Utilisateur"}
              </p>
              <p style={{ fontSize: "10.5px", color: "var(--color-muted-fg)", lineHeight: 1.4 }}>
                {cfg?.label ?? "Utilisateur"}
              </p>
            </div>
            <ChevronRight
              style={{ width: "13px", height: "13px", color: "var(--color-muted-fg-2)" }}
              className="group-hover:text-foreground transition-colors"
            />
          </button>
        )}
      </div>
    </aside>
  )
}
