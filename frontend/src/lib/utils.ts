import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ── Tailwind class merger ──────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Format monétaire MAD ──────────────────────────────────────────
export function formatMAD(value: number, compact = false): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value)
}

// ── Format pourcentage ────────────────────────────────────────────
export function formatPct(value: number): string {
  return `${Math.round(value * 10) / 10}%`
}

// ── Format date ───────────────────────────────────────────────────
export function formatDateFR(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(date))
}

// ── Interprétation SPI ────────────────────────────────────────────
export function getSPIStyle(spi: number): {
  label: string
  colorClass: string
  hex: string
  badgeClass: string
} {
  if (spi >= 1.05) return { label: "En avance",       colorClass: "text-success", hex: "#00C875", badgeClass: "badge-ok"      }
  if (spi >= 0.95) return { label: "Dans les délais", colorClass: "text-primary", hex: "#635BFF", badgeClass: "badge-ok"      }
  if (spi >= 0.8)  return { label: "Retard modéré",   colorClass: "text-warning", hex: "#FDAB3D", badgeClass: "badge-warning" }
  return              { label: "Retard critique",  colorClass: "text-danger",  hex: "#E2445C", badgeClass: "badge-danger"  }
}

// ── Interprétation CPI ────────────────────────────────────────────
export function getCPIStyle(cpi: number): { label: string; colorClass: string } {
  if (cpi >= 1.05) return { label: "Sous budget",      colorClass: "text-success" }
  if (cpi >= 0.95) return { label: "Budget maîtrisé",  colorClass: "text-primary" }
  if (cpi >= 0.85) return { label: "Dépassement léger", colorClass: "text-warning" }
  if (cpi >= 0.75) return { label: "Dépassement modéré", colorClass: "text-warning" }
  return              { label: "Dépassement critique", colorClass: "text-danger" }
}

// ── Couleur statut chantier ───────────────────────────────────────
export function getStatutColor(statut: string): string {
  const map: Record<string, string> = {
    EN_COURS: "text-primary",
    PLANIFIE: "text-muted-fg",
    EN_PAUSE: "text-warning",
    TERMINE:  "text-success",
    ANNULE:   "text-danger",
  }
  return map[statut] ?? "text-muted-fg"
}

// ── Couleur priorité ──────────────────────────────────────────────
export function getPrioriteColor(priorite: string): string {
  const map: Record<string, string> = {
    CRITIQUE: "text-danger",
    HAUTE:    "text-warning",
    NORMALE:  "text-primary",
    BASSE:    "text-muted-fg",
  }
  return map[priorite] ?? "text-muted-fg"
}

// ── Abréger un grand nombre ───────────────────────────────────────
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}
