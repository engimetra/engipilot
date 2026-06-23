"use client"
import { useStore } from "@/store/useStore"
import Link from "next/link"
import { ShieldCheck, Building2, SquareKanban, FileText, BarChart3, Users, ClipboardCheck, Zap, ArrowRight } from "lucide-react"
import type { RolePlateforme } from "@/types"

const ROLE_CONFIG: Record<RolePlateforme, { greeting: string; description: string; links: { label: string; href: string; icon: React.ReactNode; color: string }[] }> = {
  SUPER_ADMIN: { greeting: "Console Super Admin", description: "Supervision globale de la plateforme Engipilot",
    links: [{ label: "Admin", href: "/admin", icon: <ShieldCheck className="w-4 h-4"/>, color: "bg-purple-100 text-purple-700" },
             { label: "Facturation", href: "/facturation", icon: <Zap className="w-4 h-4"/>, color: "bg-amber-100 text-amber-700" },
             { label: "Rapports", href: "/rapports", icon: <BarChart3 className="w-4 h-4"/>, color: "bg-green-100 text-green-700" }] },
  ADMIN_ENTREPRISE: { greeting: "Tableau de bord Administrateur", description: "Gérez vos projets, équipes et abonnements",
    links: [{ label: "Chantiers", href: "/chantiers", icon: <Building2 className="w-4 h-4"/>, color: "bg-blue-100 text-blue-700" },
             { label: "Équipes", href: "/equipes", icon: <Users className="w-4 h-4"/>, color: "bg-green-100 text-green-700" },
             { label: "Facturation", href: "/facturation", icon: <Zap className="w-4 h-4"/>, color: "bg-amber-100 text-amber-700" }] },
  ADMIN: { greeting: "Tableau de bord Administrateur", description: "Gérez vos projets, équipes et abonnements",
    links: [{ label: "Chantiers", href: "/chantiers", icon: <Building2 className="w-4 h-4"/>, color: "bg-blue-100 text-blue-700" },
             { label: "Équipes", href: "/equipes", icon: <Users className="w-4 h-4"/>, color: "bg-green-100 text-green-700" },
             { label: "Facturation", href: "/facturation", icon: <Zap className="w-4 h-4"/>, color: "bg-amber-100 text-amber-700" }] },
  CHEF_PROJET: { greeting: "Tableau de bord Chef de Projet", description: "Suivez l'avancement de vos projets et tâches",
    links: [{ label: "Chantiers", href: "/chantiers", icon: <Building2 className="w-4 h-4"/>, color: "bg-blue-100 text-blue-700" },
             { label: "Kanban", href: "/kanban", icon: <SquareKanban className="w-4 h-4"/>, color: "bg-indigo-100 text-indigo-700" },
             { label: "Planning", href: "/planning", icon: <ClipboardCheck className="w-4 h-4"/>, color: "bg-amber-100 text-amber-700" }] },
  CHEF_CHANTIER: { greeting: "Tableau de bord Conducteur de Travaux", description: "Gérez les tâches terrain, rapports et HSE",
    links: [{ label: "Kanban", href: "/kanban", icon: <SquareKanban className="w-4 h-4"/>, color: "bg-indigo-100 text-indigo-700" },
             { label: "HSE", href: "/hse", icon: <ShieldCheck className="w-4 h-4"/>, color: "bg-red-100 text-red-700" },
             { label: "Rapports", href: "/rapports", icon: <FileText className="w-4 h-4"/>, color: "bg-green-100 text-green-700" }] },
  CONSULTANT: { greeting: "Espace Consultant", description: "Consultez les projets et exportez les données",
    links: [{ label: "Chantiers", href: "/chantiers", icon: <Building2 className="w-4 h-4"/>, color: "bg-blue-100 text-blue-700" },
             { label: "Rapports", href: "/rapports", icon: <BarChart3 className="w-4 h-4"/>, color: "bg-purple-100 text-purple-700" }] },
  LECTEUR: { greeting: "Espace Lecture", description: "Consultez les projets et rapports disponibles",
    links: [{ label: "Chantiers", href: "/chantiers", icon: <Building2 className="w-4 h-4"/>, color: "bg-blue-100 text-blue-700" },
             { label: "Rapports", href: "/rapports", icon: <BarChart3 className="w-4 h-4"/>, color: "bg-purple-100 text-purple-700" }] },
  UTILISATEUR_STANDARD: { greeting: "Mon espace de travail", description: "Consultez et gérez vos tâches assignées",
    links: [{ label: "Kanban", href: "/kanban", icon: <SquareKanban className="w-4 h-4"/>, color: "bg-indigo-100 text-indigo-700" },
             { label: "Documents", href: "/documents", icon: <FileText className="w-4 h-4"/>, color: "bg-green-100 text-green-700" }] },
}

export function RoleDashboard() {
  const { user } = useStore()
  const role = user?.role ?? "UTILISATEUR_STANDARD"
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.UTILISATEUR_STANDARD
  return (
    <div className="mb-6 rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-transparent p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{config.greeting}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
        </div>
        <span className="shrink-0 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{role.replace(/_/g, " ")}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {config.links.map(link => (
          <Link key={link.href + link.label} href={link.href}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:shadow-sm hover:scale-[1.02] ${link.color}`}>
            {link.icon}{link.label}<ArrowRight className="w-3 h-3 opacity-60" />
          </Link>
        ))}
      </div>
    </div>
  )
}
