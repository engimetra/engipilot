"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"
import { ROLE_CONFIG } from "@/lib/rbac"
import type { Permission } from "@/lib/rbac"
import {
  Search, LogOut, Shield, ChevronDown, X,
  LayoutDashboard, HardHat, SquareKanban, CalendarDays,
  FileText, BarChart2, ShieldCheck, CheckSquare,
  CreditCard, Package, FolderOpen,
  Bot, MessageSquare,
  Users, Bell, Rocket, Settings, ShieldAlert,
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
      { href: "/equipes",       icon: Users,      labelKey: "equipes",       permission: "view:equipes"       },
      { href: "/notifications", icon: Bell,       labelKey: "notifications", badge: 6, danger: true, permission: "view:notifications" },
      { href: "/onboarding",    icon: Rocket,     labelKey: "onboarding",    permission: "view:onboarding"    },
      { href: "/parametres",    icon: Settings,   labelKey: "parametres",    permission: "view:parametres"    },
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

  return (
    <aside className="w-64 lg:w-60 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 h-full overflow-hidden">

      {/* ── Logo + Close (mobile) ── */}
      <div className="px-4 h-14 border-b border-sidebar-border flex items-center gap-3 flex-shrink-0">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0 shadow-xs">
          <span className="text-white text-[11px] font-black tracking-tight">EP</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[13px] text-foreground tracking-tight leading-tight">ENGIPILOT</div>
          <div className="text-[10px] text-muted-fg leading-tight">BTP · IA · SaaS</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-fg hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Fermer le menu"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-md px-2.5 py-1.5 border border-border">
          <Search className="w-3 h-3 text-muted-fg flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search")}
            className="bg-transparent text-xs outline-none flex-1 min-w-0 placeholder:text-muted-fg text-foreground"
          />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 pb-3 overflow-y-auto space-y-4">
        {NAV.map(({ sectionKey, items }) => {
          const visible = items.filter(item =>
            can(item.permission) && (!q || t(item.labelKey).toLowerCase().includes(q))
          )
          if (visible.length === 0) return null

          return (
            <div key={sectionKey}>
              <p className="text-[10px] font-semibold text-muted-fg/70 uppercase tracking-widest px-2 mb-1">
                {t(`sections.${sectionKey}`)}
              </p>
              <div className="space-y-px">
                {visible.map(({ href, icon: Icon, labelKey, badge, danger }) => {
                  const active = pathname === href || pathname.startsWith(href + "/")
                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch={true}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors duration-150 group",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-fg hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "flex-shrink-0 transition-colors duration-150",
                          active ? "text-primary" : "text-muted-fg group-hover:text-foreground"
                        )}
                        style={{ width: 15, height: 15 }}
                        strokeWidth={active ? 2.25 : 1.75}
                      />
                      <span className="flex-1 truncate text-[13px] leading-none">{t(labelKey)}</span>
                      {badge !== undefined && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center leading-none tabular-nums",
                          danger
                            ? "bg-danger/10 text-danger"
                            : active
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-fg"
                        )}>
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

      {/* ── Footer ── */}
      <div className="border-t border-sidebar-border flex-shrink-0">
        {isSuperAdmin ? (
          <div
            className="mx-3 my-3 rounded-xl p-3 ring-1 ring-purple/30"
            style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, transparent), color-mix(in srgb, var(--color-purple) 8%, transparent))" }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple
                              flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-xs">
                {(user?.prenom?.[0] ?? "I").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-[10px] text-muted-fg leading-tight truncate">{user?.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md
                             bg-gradient-to-r from-primary to-purple text-white">
              <Shield className="w-2.5 h-2.5" />
              SUPER ADMIN
            </span>
            <button
              onClick={() => { logout(); router.push("/login") }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-medium
                         text-muted-fg hover:text-danger transition-colors py-1 rounded-md hover:bg-danger/5"
            >
              <LogOut className="w-3 h-3" /> {t("logout")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { logout(); router.push("/login") }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors duration-150 group"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2",
              cfg?.bg    ?? "bg-primary/10",
              cfg?.ring  ?? "ring-primary/20",
              cfg?.color ?? "text-primary"
            )}>
              {(user?.prenom?.[0] ?? "U").toUpperCase()}{(user?.nom?.[0] ?? "").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {user ? `${user.prenom} ${user.nom}` : "Utilisateur"}
              </p>
              <p className="text-[11px] text-muted-fg leading-tight">
                {cfg ? cfg.label : "Utilisateur"}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-fg group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>
        )}
      </div>
    </aside>
  )
}
