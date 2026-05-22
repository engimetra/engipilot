// ================================================================
// ENGIPILOT — Types TypeScript (Supabase-ready)
// ================================================================

// ── Enums / union types ─────────────────────────────────────────
export type RolePlateforme =
  | "SUPER_ADMIN"          // Ismail AMZIL — accès total plateforme
  | "ADMIN_ENTREPRISE"     // Gestion projets, équipes, budgets
  | "CHEF_PROJET"          // Gestion projets assignés
  | "CHEF_CHANTIER"        // Terrain, rapports, HSE
  | "CONSULTANT"           // Lecture seule + exports
  | "UTILISATEUR_STANDARD" // Accès limité aux projets assignés

export type PlanAbonnement  = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE"
export type StatutProjet    = "PLANIFIE" | "EN_COURS" | "EN_PAUSE" | "TERMINE" | "ANNULE"
export type PrioriteProjet  = "CRITIQUE" | "HAUTE" | "NORMALE" | "BASSE"
export type StatutTache     = "A_FAIRE" | "EN_COURS" | "CONTROLE_QUALITE" | "TERMINE"
export type StatutLot       = "PLANIFIE" | "EN_COURS" | "RETARD" | "TERMINE"
export type StatutRapport   = "BROUILLON" | "SOUMIS" | "VALIDE"
export type StatutNC        = "OUVERTE" | "EN_COURS" | "RESOLUE" | "FERMEE"
export type PrioriteNC      = "CRITIQUE" | "MAJEURE" | "MINEURE"
export type TypeIncident    = "ACCIDENT_ARRET" | "ACCIDENT_SANS_ARRET" | "PRESQU_ACCIDENT" | "MALADIE_PRO"
export type TypeNotification = "RETARD" | "BUDGET" | "HSE" | "IA" | "TACHE" | "DOCUMENT" | "MENTION" | "SYSTEME"
export type TypeDocument    = "PLAN" | "RAPPORT" | "PV" | "CONTRAT" | "FACTURE" | "PHOTO" | "AUTRE"
export type ModeIA          = "chat" | "pv" | "rapport" | "risques"

// ── Entities ────────────────────────────────────────────────────
export interface Utilisateur {
  id: string
  email: string
  prenom: string
  nom: string
  role: RolePlateforme
  organisation_id: string
  avatar_url?: string
  telephone?: string
  actif: boolean
  derniere_connexion?: string
  created_at: string
  updated_at: string
}

export interface Organisation {
  id: string
  nom: string
  plan_abonnement: PlanAbonnement
}

export interface Projet {
  id: string
  organisation_id: string
  code_projet: string
  nom: string
  description?: string
  statut: StatutProjet
  priorite: PrioriteProjet
  avancement_physique: number
  avancement_theorique: number
  budget_previsionnel: number
  cout_reel: number
  date_debut: string
  date_fin_prevue: string
  date_fin_reelle?: string
  ville?: string
  client?: string
  chef_chantier?: string
  created_at: string
  updated_at: string
}

export interface Lot {
  id: string
  projet_id: string
  code: string
  nom: string
  avancement: number
  budget?: number
  cout_reel: number
  date_debut?: string
  date_fin_prevue?: string
  statut: StatutLot
}

export interface Tache {
  id: string
  projet_id: string
  lot_id?: string
  titre: string
  description?: string
  statut: StatutTache
  priorite: PrioriteProjet
  responsable?: string
  date_echeance?: string
  avancement: number
  created_at: string
}

export interface KTask extends Tache {
  tags?: string[]
  comment_count?: number
  attach_count?: number
}

export interface Tag {
  id: string
  label: string
  couleur: string
}

export interface CommentaireTache {
  id: string
  tache_id: string
  auteur_id: string
  auteur_prenom: string
  contenu: string
  created_at: string
}

export interface Jalon {
  id: string
  projet_id: string
  label: string
  date: string
  done: boolean
}

export interface RapportJournalier {
  id: string
  projet_id: string
  date_rapport: string
  numero_rapport: string
  meteo?: string
  temperature_celsius?: number
  effectif_total: number
  travaux_realises?: string
  beton_coule_m3?: number
  acier_kg?: number
  avancement_journalier?: number
  problemes?: string
  statut: StatutRapport
  created_at: string
}

export interface NonConformite {
  id: string
  projet_id: string
  organisation_id: string
  reference: string
  description: string
  priorite: PrioriteNC
  statut: StatutNC
  lot?: string
  zone?: string
  responsable?: string
  date_constat?: string
  date_resolution?: string
  created_at: string
}

export interface IncidentHSE {
  id: string
  projet_id: string
  type: TypeIncident
  description: string
  date_incident: string
  lieu?: string
  nombre_jours_arret: number
  nombre_blesses: number
  mesures_prises?: string
  declare_inspection_travail: boolean
  created_at: string
}

export interface Notification {
  id: string
  organisation_id: string
  projet_id?: string
  tache_id?: string
  destinataire_id: string
  type: TypeNotification
  titre: string
  corps?: string
  lu: boolean
  lien?: string
  created_at: string
}

export interface Document {
  id: string
  organisation_id: string
  projet_id?: string
  nom: string
  type: TypeDocument
  url: string
  taille_octets?: number
  version?: string
  tags?: string[]
  uploade_par?: string
  created_at: string
}

export interface MembreEquipe {
  id: string
  projet_id: string
  utilisateur_id: string
  role_chantier: string
  corps_metier?: string
  taux_horaire?: number
  date_entree?: string
  date_sortie?: string
  actif: boolean
}

// ── Calculs EVM / HSE ───────────────────────────────────────────
export interface EVMResult {
  projet_id: string
  bat: number; va: number; vp: number; cr: number
  spi: number; cpi: number
  sv: number; cv: number
  eac: number; etc: number; vac: number; tcpi?: number
  interpretation_spi: string
  interpretation_cpi: string
  niveau_alerte: "OK" | "ATTENTION" | "CRITIQUE"
}

export interface KPIsHSE {
  tf: number; tg: number
  heures_travaillees: number
  accidents_arret: number
  jours_arret: number
}

// ── Auth ────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string
  token_type: string
  user: Utilisateur
}

// ── Supabase table name map ─────────────────────────────────────
export type TableName =
  | "utilisateurs"
  | "organisations"
  | "projets"
  | "lots"
  | "taches"
  | "jalons"
  | "rapports_journaliers"
  | "non_conformites"
  | "incidents_hse"
  | "notifications"
  | "documents"
  | "membres_equipe"
  | "commentaires_taches"
  | "tags"
