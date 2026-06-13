"use client"
import { useState, useEffect, useCallback } from "react"
import { Users, Shield, BarChart3, Trash2, Plus, CheckCircle, X, Search, MoreVertical, Crown, RefreshCw } from "lucide-react"
import { ROLE_CONFIG } from "@/lib/rbac"
import { RoleGuard } from "@/components/auth/RoleGuard"
import type { RolePlateforme } from "@/types"

// Appels via les routes proxy Next.js (pas d'appel direct au backend)
async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `Erreur ${res.status}`)
  }
  return res.json()
}

const BACKEND_ROLES = ["ADMIN", "CHEF_PROJET", "CHEF_CHANTIER", "CONSULTANT", "LECTEUR"] as const
type BackendRole = typeof BACKEND_ROLES[number]

interface ApiUser {
  id: string
  fullName: string
  email: string
  role: BackendRole
  active: boolean
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:           "Admin",
  ADMIN_ENTREPRISE:"Admin Entreprise",
  CHEF_PROJET:     "Chef de Projet",
  CHEF_CHANTIER:   "Chef de Chantier",
  CONSULTANT:      "Consultant",
  LECTEUR:         "Lecteur",
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  ADMIN:            { bg: "#f5f3ff", color: "#7c3aed" },
  ADMIN_ENTREPRISE: { bg: "#f5f3ff", color: "#6d28d9" },
  CHEF_PROJET:      { bg: "#eff6ff", color: "#1d4ed8" },
  CHEF_CHANTIER:    { bg: "#f0f9ff", color: "#0369a1" },
  CONSULTANT:       { bg: "#f0fdfa", color: "#0f766e" },
  LECTEUR:          { bg: "#f9fafb", color: "#6b7280" },
}

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999, padding: "12px 18px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", background: ok ? "#166534" : "#991b1b", color: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>
      {ok ? <CheckCircle style={{ width: "16px", height: "16px" }} /> : <X style={{ width: "16px", height: "16px" }} />}
      <span style={{ fontSize: "13px", fontWeight: 600 }}>{msg}</span>
      <button onClick={onClose} style={{ marginLeft: "8px", background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.7 }}><X style={{ width: "14px", height: "14px" }} /></button>
    </div>
  )
}

function ModalAddUser({ onClose, onAdd }: { onClose: () => void; onAdd: (u: ApiUser) => void }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "CHEF_CHANTIER" as BackendRole })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.password.length < 8) { setError("Le mot de passe doit comporter au moins 8 caractères"); return }
    setLoading(true)
    try {
      const data = await adminFetch("/users", { method: "POST", body: JSON.stringify(form) })
      onAdd({ id: data.id, fullName: form.fullName, email: form.email, role: form.role, active: true })
    } catch (err: unknown) {
      const msg = (err as {response?: {data?: {error?: string}}})?.response?.data?.error
      setError(msg ?? "Erreur lors de la création")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "440px", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Créer un utilisateur</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "4px", cursor: "pointer", color: "#fff" }}><X style={{ width: "16px", height: "16px" }} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: "24px", display: "grid", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nom complet</label>
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Prénom Nom" required className="input" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="utilisateur@entreprise.ma" required className="input" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mot de passe temporaire</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 8 caractères" required className="input" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rôle</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as BackendRole }))} className="input" style={{ width: "100%" }}>
              {BACKEND_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {error && <p style={{ fontSize: "12px", color: "#dc2626", background: "#fee2e2", padding: "8px 12px", borderRadius: "8px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn-outline">Annuler</button>
            <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 20px", background: loading ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? <RefreshCw style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: "14px", height: "14px" }} />}
              {loading ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminPageContent() {
  const [users, setUsers]       = useState<ApiUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [filterRole, setFilter] = useState("")
  const [showAdd, setShowAdd]   = useState(false)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetch("/users")
      setUsers(data)
    } catch { /* silence */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function changeRole(id: string, role: string) {
    await adminFetch(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as BackendRole } : u))
    showToast("Rôle mis à jour")
    setMenuOpen(null)
  }

  async function deactivateUser(id: string) {
    await adminFetch(`/users/${id}`, { method: "DELETE" })
    setUsers(prev => prev.filter(u => u.id !== id))
    showToast("Utilisateur désactivé")
    setMenuOpen(null)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${u.fullName} ${u.email}`.toLowerCase().includes(q)
    const matchRole = !filterRole || u.role === filterRole
    return matchSearch && matchRole
  })

  const initials = (name: string) => name.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6 page-enter">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
      {showAdd && <ModalAddUser onClose={() => setShowAdd(false)} onAdd={u => { setUsers(p => [u, ...p]); setShowAdd(false); showToast(`Compte créé pour ${u.email}`) }} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Administration</h1>
          <p style={{ fontSize: "13px", color: "var(--color-muted-fg)", marginTop: "4px" }}>Gestion des utilisateurs, rôles et permissions</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={loadUsers} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
            <RefreshCw style={{ width: "14px", height: "14px" }} /> Actualiser
          </button>
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }}>
            <Plus style={{ width: "14px", height: "14px" }} /> Créer un utilisateur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Utilisateurs actifs",  value: users.filter(u => u.active).length, icon: Users,     color: "#1d4ed8", bg: "#eff6ff" },
          { label: "Rôles disponibles",    value: BACKEND_ROLES.length,               icon: Shield,    color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Admins",               value: users.filter(u => u.role === "ADMIN").length, icon: Crown, color: "#d97706", bg: "#fffbeb" },
          { label: "Consultants",          value: users.filter(u => u.role === "CONSULTANT").length, icon: BarChart3, color: "#0f766e", bg: "#f0fdfa" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.icon style={{ width: "20px", height: "20px", color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: "22px", fontWeight: 900, color: "#1e293b", lineHeight: 1 }}>{loading ? "—" : s.value}</p>
              <p style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 14px", flex: 1, maxWidth: "320px" }}>
          <Search style={{ width: "15px", height: "15px", color: "#94a3b8", flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
            style={{ background: "transparent", fontSize: "13px", outline: "none", flex: 1, color: "#1e293b" }} />
        </div>
        <select value={filterRole} onChange={e => setFilter(e.target.value)}
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 14px", fontSize: "13px", color: "#475569", outline: "none" }}>
          <option value="">Tous les rôles</option>
          {BACKEND_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "auto" }}>{filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Chargement...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                {["Utilisateur", "Rôle", "Statut", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const rc = ROLE_COLORS[u.role] ?? { bg: "#f1f5f9", color: "#64748b" }
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg, ${rc.color} 0%, #0ea5e9 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                          {initials(u.fullName)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: "#1e293b" }}>{u.fullName}</p>
                          <p style={{ fontSize: "11.5px", color: "#94a3b8" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, background: rc.bg, color: rc.color, padding: "3px 10px", borderRadius: "99px" }}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, background: u.active ? "#dcfce7" : "#fee2e2", color: u.active ? "#166534" : "#dc2626", padding: "3px 10px", borderRadius: "99px" }}>
                        {u.active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                          style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", color: "#64748b" }}>
                          <MoreVertical style={{ width: "14px", height: "14px" }} />
                        </button>
                        {menuOpen === u.id && (
                          <div style={{ position: "absolute", right: 0, top: "36px", zIndex: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "200px", overflow: "hidden" }}>
                            <div style={{ padding: "6px", borderBottom: "1px solid #f1f5f9" }}>
                              <p style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Changer le rôle</p>
                              {BACKEND_ROLES.filter(r => r !== u.role).map(r => (
                                <button key={r} onClick={() => changeRole(u.id, r)}
                                  style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer", fontSize: "12.5px", color: "#1e293b", fontWeight: 500, borderRadius: "8px" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                >
                                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ROLE_COLORS[r]?.color ?? "#94a3b8", flexShrink: 0 }} />
                                  {ROLE_LABELS[r]}
                                </button>
                              ))}
                            </div>
                            <div style={{ padding: "6px" }}>
                              <button onClick={() => deactivateUser(u.id)}
                                style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer", fontSize: "12.5px", color: "#dc2626", fontWeight: 600, borderRadius: "8px" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <Trash2 style={{ width: "13px", height: "13px" }} /> Désactiver
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Aucun utilisateur trouvé</div>
        )}
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
