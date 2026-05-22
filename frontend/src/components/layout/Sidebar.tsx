"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"
import { ROLE_CONFIG } from "@/lib/rbac"
import type { Permission } from "@/lib/rbac"
import { Search, LogOut, Shield, ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"

interface NavItem {
  href:       string
  emoji:      string
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
      { href: "/dashboard",  emoji: "📊", labelKey: "dashboard",  permission: "view:dashboard" },
      { href: "/chantiers",  emoji: "🏗️", labelKey: "chantiers",  badge: 12, permission: "view:chantiers" },
      { href: "/kanban",     emoji: "📋", labelKey: "kanban",     permission: "view:kanban"    },
      { href: "/planning",   emoji: "📅", labelKey: "planning",   permission: "view:planning"  },
    ],
  },
  {
    sectionKey: "suivi",
    items: [
      { href: "/rapports",          emoji: "📝", labelKey: "rapports",         permission: "view:rapports"          },
      { href: "/analytics",         emoji: "📈", labelKey: "analytics",        permission: "view:analytics"         },
      { href: "/hse",               emoji: "🦺", labelKey: "hse",              badge: 2, danger: true, permission: "view:hse"    },
      { href: "/qualite",           emoji: "✅", labelKey: "qualite",          badge: 4, danger: true, permission: "view:qualite" },
      { href: "/facturation",       emoji: "💰", labelKey: "facturation",      permission: "view:facturation"       },
      { href: "/approvisionnement", emoji: "📦", labelKey: "approvisionnement",permission: "view:approvisionnement" },
      { href: "/documents",         emoji: "🗂️", labelKey: "documents",        permission: "view:documents"         },
    ],
  },
  {
    sectionKey: "ia",
    items: [
      { href: "/ia",   emoji: "🤖", labelKey: "alertesIa",   badge: 3, permission: "view:ia"   },
      { href: "/chat", emoji: "💬", labelKey: "chatCopilot",           permission: "view:chat"  },
    ],
  },
  {
    sectionKey: "equipe",
    items: [
      { href: "/equipes",       emoji: "👥", labelKey: "equipes",       permission: "view:equipes"       },
      { href: "/notifications", emoji: "🔔", labelKey: "notifications", badge: 6, danger: true, permission: "view:notifications" },
      { href: "/onboarding",    emoji: "🚀", labelKey: "onboarding",    permission: "view:onboarding"    },
      { href: "/parametres",    emoji: "⚙️", labelKey: "parametres",    permission: "view:parametres"    },
    ],
  },
  {
    sectionKey: "admin",
    items: [
      { href: "/admin", emoji: "🛡️", labelKey: "adminPage", permission: "view:admin" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { can, isSuperAdmin, role, user } = usePermissions()
  const logout   = useStore(s => s.logout)
  const cfg      = role ? ROLE_CONFIG[role] : null
  const t        = useTranslations("nav")

  const [search, setSearch] = useState("")
  const q = search.toLowerCase().trim()

  return (
    <aside className="w-60 bg-white border-r border-border flex flex-col flex-shrink-0 h-full overflow-hidden">

      {/* ── Logo ── */}
      <div className="px-4 h-14 border-b border-border flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white text-xs font-black">EP</span>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-foreground tracking-tight leading-tight">ENGIPILOT</div>
          <div className="text-[10px] text-muted-fg leading-tight">BTP · IA · SaaS</div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
          <Search className="w-3.5 h-3.5 text-muted-fg flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search")}
            className="bg-transparent text-xs outline-none flex-1 min-w-0 placeholder:text-muted-fg text-foreground"
          />
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-4">
        {NAV.map(({ sectionKey, items }) => {
          const visible = items.filter(item =>
            can(item.permission) && (!q || t(item.labelKey).toLowerCase().includes(q))
          )
          if (visible.length === 0) return null

          return (
            <div key={sectionKey}>
              <p className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider px-2 mb-1">
                {t(`sections.${sectionKey}`)}
              </p>
              <div className="space-y-0.5">
                {visible.map(({ href, emoji, labelKey, badge, danger }) => {
                  const active = pathname === href || pathname.startsWith(href + "/")
                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch={true}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 group",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-[#374151] hover:bg-[#F3F4F6] hover:text-foreground"
                      )}
                    >
                      <span className="text-base leading-none flex-shrink-0 w-5 text-center">{emoji}</span>
                      <span className="flex-1 truncate text-[13px] leading-none">{t(labelKey)}</span>
                      {badge !== undefined && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center leading-none",
                          danger
                            ? "bg-danger/10 text-danger"
                            : active
                            ? "bg-primary/20 text-primary"
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
      <div className="border-t border-border flex-shrink-0">
        {isSuperAdmin ? (
          <div
            className="mx-3 my-3 rounded-xl p-3 ring-1 ring-purple-400/50"
            style={{ background: "linear-gradient(135deg, #635BFF15 0%, #8B5CF615 100%)" }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#635BFF] to-[#8B5CF6]
                              flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-md">
                {(user?.prenom?.[0] ?? "I").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-foreground truncate leading-tight">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-[10px] text-muted-fg leading-tight truncate">{user?.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg
                             bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] text-white shadow-sm">
              <Shield className="w-2.5 h-2.5" />
              SUPER ADMIN
            </span>
            <button
              onClick={() => { logout(); router.push("/login") }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold
                         text-muted-fg hover:text-danger transition-colors py-1 rounded-lg hover:bg-danger/5"
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
