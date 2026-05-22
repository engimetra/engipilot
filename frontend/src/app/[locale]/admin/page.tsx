"use client"
import { useState } from "react"
import { Users, Building2, Shield, BarChart3, Settings, Trash2, Plus, CheckCircle, X, Search, MoreVertical, Crown } from "lucide-react"
import { ROLE_CONFIG } from "@/lib/rbac"
import { RoleGuard } from "@/components/auth/RoleGuard"
import type { RolePlateforme } from "@/types"

type Status = "Actif" | "Inactif" | "En attente"

interface AdminUser {
  id: string; prenom: string; nom: string; email: string
  role: RolePlateforme; statut: Status; chantiers: number; derniere_connexion: string
}

const ALL_ROLES: RolePlateforme[] = [
  "SUPER_ADMIN", "ADMIN_ENTREPRISE", "CHEF_PROJET",
  "CHEF_CHANTIER", "CONSULTANT", "UTILISATEUR_STANDARD",
]

const INIT_USERS: AdminUser[] = [
  { id:"u1", prenom:"Ismail",  nom:"AMZIL",    email:"ismail.amzil@engipilot.ma",  role:"SUPER_ADMIN",          statut:"Actif",   chantiers:0,  derniere_connexion:"En ligne"  },
  { id:"u2", prenom:"Nadia",   nom:"Amrani",   email:"nadia.amrani@btpmaroc.ma",   role:"ADMIN_ENTREPRISE",     statut:"Actif",   chantiers:12, derniere_connexion:"En ligne"  },
  { id:"u3", prenom:"Sara",    nom:"Bennani",  email:"sara.bennani@btpmaroc.ma",   role:"CHEF_PROJET",          statut:"Actif",   chantiers:5,  derniere_connexion:"Il y a 1h" },
  { id:"u4", prenom:"Ahmed",   nom:"Khalil",   email:"ahmed.khalil@btpmaroc.ma",   role:"CHEF_CHANTIER",        statut:"Actif",   chantiers:3,  derniere_connexion:"Il y a 2h" },
  { id:"u5", prenom:"Youssef", nom:"Chraibi",  email:"y.chraibi@consultant.ma",    role:"CONSULTANT",           statut:"Actif",   chantiers:2,  derniere_connexion:"Il y a 4h" },
  { id:"u6", prenom:"Layla",   nom:"Mansouri", email:"layla.m@btpmaroc.ma",        role:"UTILISATEUR_STANDARD", statut:"Inactif", chantiers:1,  derniere_connexion:"Il y a 3j" },
]

const STATUS_COLORS: Record<Status, string> = {
  "Actif":      "bg-success/10 text-success",
  "Inactif":    "bg-muted text-muted-fg",
  "En attente": "bg-warning/10 text-warning",
}

function Toast({ msg, onClose }: { readonly msg: string; readonly onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-[pageEnter_0.2s_ease]">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-semibold">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

function RoleBadge({ role }: { readonly role: RolePlateforme }) {
  const cfg   = ROLE_CONFIG[role]
  const isSA  = role === "SUPER_ADMIN"
  const cls   = isSA ? "bg-[#635BFF]/10 text-[#635BFF]" : `${cfg.bg} ${cfg.color}`
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cls}`}>
      {isSA && <Crown className="w-2.5 h-2.5" />}
      {cfg.shortLabel}
    </span>
  )
}

function ModalAddUser({ onClose, onAdd }: { readonly onClose: () => void; readonly onAdd: (u: AdminUser) => void }) {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", role: "CHEF_CHANTIER" as RolePlateforme })

  function submit() {
    onAdd({
      id: `u${Date.now()}`,
      prenom: form.prenom, nom: form.nom, email: form.email,
      role: form.role, statut: "En attente",
      chantiers: 0, derniere_connexion: "Jamais",
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={e => { if (e.key === "Escape") onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Inviter un utilisateur</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); submit() }} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-prenom" className="text-xs font-semibold text-muted-fg block mb-1">Prénom</label>
              <input id="add-prenom" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                placeholder="Karim" required className="input" />
            </div>
            <div>
              <label htmlFor="add-nom" className="text-xs font-semibold text-muted-fg block mb-1">Nom</label>
              <input id="add-nom" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Benali" required className="input" />
            </div>
          </div>
          <div>
            <label htmlFor="add-email" className="text-xs font-semibold text-muted-fg block mb-1">Email</label>
            <input id="add-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="utilisateur@entreprise.ma" required className="input" />
          </div>
          <div>
            <label htmlFor="add-role" className="text-xs font-semibold text-muted-fg block mb-1">Rôle</label>
            <select id="add-role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as RolePlateforme }))} className="input">
              {ALL_ROLES.filter(r => r !== "SUPER_ADMIN").map(r =>
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              )}
            </select>
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <button type="button" onClick={onClose} className="btn-outline">Annuler</button>
            <button type="submit" className="btn-primary"><Plus className="w-4 h-4" /> Inviter</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminPageContent() {
  const [users, setUsers] = useState<AdminUser[]>(INIT_USERS)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<RolePlateforme | "">("")
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  function toggleStatus(id: string) {
    setUsers(prev => prev.map(u => u.id === id
      ? { ...u, statut: u.statut === "Actif" ? "Inactif" : "Actif" }
      : u
    ))
    showToast("Statut utilisateur mis à jour")
    setMenuOpen(null)
  }

  function deleteUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id))
    showToast("Utilisateur supprimé")
    setMenuOpen(null)
  }

  function addUser(u: AdminUser) {
    setUsers(prev => [u, ...prev])
    setShowAdd(false)
    showToast(`Invitation envoyée à ${u.email}`)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q)
    const matchRole = !filterRole || u.role === filterRole
    return matchSearch && matchRole
  })

  const stats = [
    { label: "Utilisateurs actifs",  value: users.filter(u => u.statut === "Actif").length, icon: Users,     color: "text-primary",   bg: "bg-primary/10"   },
    { label: "Chantiers supervisés", value: 12,                                              icon: Building2, color: "text-success",   bg: "bg-success/10"   },
    { label: "Rôles configurés",     value: ALL_ROLES.length,                                icon: Shield,    color: "text-warning",   bg: "bg-warning/10"   },
    { label: "Requêtes IA ce mois",  value: "847",                                           icon: BarChart3, color: "text-[#635BFF]", bg: "bg-[#635BFF]/10" },
  ]

  return (
    <div className="space-y-6 page-enter">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
      {showAdd && <ModalAddUser onClose={() => setShowAdd(false)} onAdd={addUser} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="text-sm text-muted-fg mt-0.5">Gestion des utilisateurs, rôles et permissions de la plateforme</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Inviter un utilisateur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-4 shadow-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground">{s.value}</p>
              <p className="text-xs text-muted-fg">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-muted-fg flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-fg" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value as RolePlateforme | "")}
          className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none">
          <option value="">Tous les rôles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
        </select>
        <span className="text-xs text-muted-fg ml-auto">{filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* Users table */}
      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-fg uppercase tracking-wider">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-fg uppercase tracking-wider">Rôle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-fg uppercase tracking-wider">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-fg uppercase tracking-wider">Chantiers</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-fg uppercase tracking-wider">Dernière connexion</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const cfg      = ROLE_CONFIG[u.role]
              const isSA     = u.role === "SUPER_ADMIN"
              const avatarCls = isSA
                ? "bg-gradient-to-br from-[#635BFF] to-[#8B5CF6] text-white ring-purple-300/50"
                : `${cfg.bg} ${cfg.color} ${cfg.ring}`
              return (
                <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ring-1 ${avatarCls}`}>
                        {u.prenom[0]}{u.nom[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-muted-fg">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[u.statut]}`}>{u.statut}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">{u.chantiers}</td>
                  <td className="px-4 py-3 text-muted-fg text-xs">{u.derniere_connexion}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-fg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpen === u.id && (
                        <div className="absolute right-0 top-8 z-10 bg-white border border-border rounded-xl shadow-lg w-48 overflow-hidden">
                          <button onClick={() => { showToast(`Rôle de ${u.prenom} modifié`); setMenuOpen(null) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted text-foreground transition-colors">
                            <Settings className="w-3.5 h-3.5 text-muted-fg" /> Modifier le rôle
                          </button>
                          {u.role !== "SUPER_ADMIN" && (
                            <button onClick={() => toggleStatus(u.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted text-foreground transition-colors">
                              <CheckCircle className="w-3.5 h-3.5 text-muted-fg" />
                              {u.statut === "Actif" ? "Désactiver" : "Activer"}
                            </button>
                          )}
                          {u.role !== "SUPER_ADMIN" && (
                            <>
                              <div className="h-px bg-border my-1" />
                              <button onClick={() => deleteUser(u.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-danger/5 text-danger transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Supprimer
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-fg text-sm">Aucun utilisateur trouvé</div>
        )}
      </div>

      {/* System settings */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Shield,   title: "Sécurité & Accès",   desc: "2FA, sessions actives, logs d'audit",       action: "Configurer" },
          { icon: Settings, title: "Paramètres système", desc: "Langue, fuseau horaire, format date",        action: "Modifier"   },
          { icon: BarChart3,title: "Logs & Activité",    desc: "Historique des connexions et actions admin", action: "Consulter"  },
        ].map(card => (
          <div key={card.title} className="bg-white border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <card.icon className="w-4 h-4 text-muted-fg" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{card.title}</p>
              <p className="text-xs text-muted-fg mt-0.5">{card.desc}</p>
            </div>
            <button onClick={() => showToast(`${card.title} — fonctionnalité disponible`)}
              className="btn-outline text-xs self-start">
              {card.action} →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <RoleGuard permission="view:admin">
      <AdminPageContent />
    </RoleGuard>
  )
}
