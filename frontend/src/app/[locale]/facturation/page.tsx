"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import {
  LayoutDashboard, Settings, Users, FileText, Receipt, Plus, X, Download,
  Mail, CheckCircle, AlertCircle, Clock, Search, Filter, Printer,
  TrendingUp, Banknote, AlertTriangle, ArrowRight, Eye, Trash2, Edit,
  Copy, Upload, Building2, Phone, Globe, MapPin, Hash, CreditCard,
  ChevronDown, MoreHorizontal, Percent, Image as ImageIcon, FileCheck,
  PieChart, BarChart2, RefreshCw, Calendar, Wallet
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type StatutDevis = "BROUILLON" | "ENVOYÉ" | "ACCEPTÉ" | "REFUSÉ" | "EXPIRÉ"
type StatutFacture = "BROUILLON" | "ENVOYÉE" | "PAYÉE" | "PARTIELLEMENT_PAYÉE" | "EN_RETARD" | "ANNULÉE"
type LogoPosition = "left" | "center" | "right"

interface Entreprise {
  logo: string
  cachet: string
  signature: string
  nom: string
  slogan: string
  adresse: string
  ville: string
  pays: string
  telephone: string
  mobile: string
  email: string
  siteWeb: string
  ice: string
  if_: string
  rc: string
  cnss: string
  patente: string
  capital: string
  banque: string
  rib: string
  iban: string
  swift: string
  couleurPrimaire: string
  logoPosition: LogoPosition
}

interface Client {
  id: string
  nom: string
  societe: string
  email: string
  telephone: string
  mobile: string
  adresse: string
  ville: string
  pays: string
  ice: string
  rc: string
  if_: string
  contact: string
}

interface LigneDoc {
  id: string
  designation: string
  description: string
  quantite: number
  unite: string
  prixUHT: number
  tva: number
}

interface Devis {
  id: string
  reference: string
  clientId: string
  clientLib: string
  objet: string
  projet: string
  date: string
  validite: string
  conditionsPaiement: string
  notes: string
  lignes: LigneDoc[]
  statut: StatutDevis
  dateCreation: string
}

interface Facture {
  id: string
  reference: string
  clientId: string
  clientLib: string
  objet: string
  projet: string
  dateEmission: string
  dateEcheance: string
  conditionsPaiement: string
  modePaiement: string
  notes: string
  lignes: LigneDoc[]
  statut: StatutFacture
  montantPaye: number
  dateCreation: string
  devisId?: string
}

// ─── Données initiales ────────────────────────────────────────────────────────

const ENTREPRISE_DEFAUT: Entreprise = {
  logo: "", cachet: "", signature: "",
  nom: "Mon Cabinet d'Ingénierie", slogan: "L'expertise au service de vos projets",
  adresse: "", ville: "Casablanca", pays: "Maroc",
  telephone: "", mobile: "",
  email: "contact@cabinet.ma", siteWeb: "www.cabinet.ma",
  ice: "", if_: "", rc: "",
  cnss: "", patente: "", capital: "",
  banque: "", rib: "",
  iban: "", swift: "",
  couleurPrimaire: "#1e512d", logoPosition: "left",
}

const CLIENTS_INIT: Client[] = []

const DEVIS_INIT: Devis[] = []

const FACTURES_INIT: Facture[] = []

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const TVA_OPTIONS = [0, 7, 10, 14, 20]
const UNITES = ["Forfait", "Unité", "Heure", "Jour", "m²", "ml", "Visite", "Rapport", "Lot"]
const MODES_PAIEMENT = ["Virement", "Chèque", "Espèces", "Carte bancaire"]

function calcHT(lignes: LigneDoc[]) { return lignes.reduce((s, l) => s + l.quantite * l.prixUHT, 0) }
function calcTVATotal(lignes: LigneDoc[]) { return lignes.reduce((s, l) => s + l.quantite * l.prixUHT * l.tva / 100, 0) }
function calcTTC(lignes: LigneDoc[]) { return calcHT(lignes) + calcTVATotal(lignes) }

function mad(n: number) {
  return n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MAD"
}
function fmtDate(s: string) {
  if (!s) return "—"
  const [y, m, d] = s.split("-")
  return `${d}/${m}/${y}`
}
function nextRef(list: Array<{ reference: string }>, prefix: string) {
  const year = new Date().getFullYear()
  const nums = list
    .filter(x => x.reference.startsWith(`${prefix}-${year}`))
    .map(x => parseInt(x.reference.slice(-5) || "0"))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${year}-${String(next).padStart(5, "0")}`
}
function today() { return new Date().toISOString().slice(0, 10) }
function addDays(d: string, n: number) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}
function uid() { return Math.random().toString(36).slice(2) }

// ─── localStorage ─────────────────────────────────────────────────────────────

function load<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* noop */ }
}

// ─── Statut badges ────────────────────────────────────────────────────────────

const STATUT_DEVIS: Record<StatutDevis, { label: string; bg: string; color: string }> = {
  BROUILLON: { label: "Brouillon",  bg: "#F3F4F6", color: "#6B7280" },
  ENVOYÉ:    { label: "Envoyé",     bg: "#DBEAFE", color: "#1D4ED8" },
  ACCEPTÉ:   { label: "Accepté",    bg: "#D1FAE5", color: "#059669" },
  REFUSÉ:    { label: "Refusé",     bg: "#FEE2E2", color: "#DC2626" },
  EXPIRÉ:    { label: "Expiré",     bg: "#FEF3C7", color: "#D97706" },
}
const STATUT_FACTURE: Record<StatutFacture, { label: string; bg: string; color: string }> = {
  BROUILLON:           { label: "Brouillon",          bg: "#F3F4F6", color: "#6B7280" },
  ENVOYÉE:             { label: "Envoyée",             bg: "#DBEAFE", color: "#1D4ED8" },
  PAYÉE:               { label: "Payée",               bg: "#D1FAE5", color: "#059669" },
  PARTIELLEMENT_PAYÉE: { label: "Part. payée",         bg: "#CCFBF1", color: "#0D9488" },
  EN_RETARD:           { label: "En retard",           bg: "#FEE2E2", color: "#DC2626" },
  ANNULÉE:             { label: "Annulée",             bg: "#E5E7EB", color: "#374151" },
}

function BadgeSt({ statut, type }: { statut: string; type: "devis" | "facture" }) {
  const cfg = type === "devis"
    ? STATUT_DEVIS[statut as StatutDevis]
    : STATUT_FACTURE[statut as StatutFacture]
  if (!cfg) return null
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, onClose, color = "#1e512d" }: { msg: string; onClose: () => void; color?: string }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium animate-pulse"
      style={{ background: color, animationIterationCount: 1 }}>
      <CheckCircle className="w-4 h-4 shrink-0" />
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, size = "lg" }: {
  title: string; onClose: () => void; children: React.ReactNode; size?: "sm" | "lg" | "xl" | "full"
}) {
  const w = size === "full" ? "w-full max-w-6xl" : size === "xl" ? "w-full max-w-4xl" : size === "lg" ? "w-full max-w-2xl" : "w-full max-w-md"
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className={`bg-card border border-border rounded-2xl shadow-2xl ${w} max-h-[94vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-fg hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Field / Input helpers ────────────────────────────────────────────────────

const iCls = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 transition placeholder:text-muted-fg"
const sCls = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 transition"

function Field({ label, children, col2 }: { label: string; children: React.ReactNode; col2?: boolean }) {
  return (
    <div className={col2 ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-muted-fg uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Upload image helper ──────────────────────────────────────────────────────

function ImageUpload({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsDataURL(f)
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="block text-xs font-medium text-muted-fg uppercase tracking-wide">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-[#1e512d] transition bg-muted min-h-[80px] justify-center">
        {value
          ? <img src={value} alt={label} className="max-h-16 max-w-full object-contain rounded" />
          : <><ImageIcon className="w-7 h-7 text-muted-fg" /><span className="text-xs text-muted-fg">Cliquez pour importer</span></>
        }
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <button onClick={() => onChange("")} className="text-xs text-red-500 hover:text-red-700 self-start">Supprimer</button>
      )}
    </div>
  )
}

// ─── Document Preview (Devis ou Facture) ─────────────────────────────────────

function DocumentView({ doc, entreprise, type }: {
  doc: Devis | Facture; entreprise: Entreprise; type: "devis" | "facture"
}) {
  const color = entreprise.couleurPrimaire || "#1e512d"
  const ht = calcHT(doc.lignes)
  const tvaTotal = calcTVATotal(doc.lignes)
  const ttc = calcTTC(doc.lignes)
  const fd = "dateEmission" in doc ? (doc as Facture) : null
  const titre = type === "devis" ? "DEVIS" : "FACTURE"

  const logoEl = entreprise.logo
    ? <img src={entreprise.logo} alt="logo" className="max-h-16 max-w-40 object-contain" />
    : <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-3 w-36 h-14 text-xs text-gray-400 gap-1"><Building2 className="w-4 h-4" /><span>Votre Logo</span></div>

  const logoSection = (
    <div className={`flex ${entreprise.logoPosition === "center" ? "justify-center" : entreprise.logoPosition === "right" ? "justify-end" : "justify-start"}`}>
      {logoEl}
    </div>
  )

  return (
    <div className="bg-white text-gray-900 text-sm" style={{ fontFamily: "Arial, sans-serif", minHeight: "297mm", padding: "15mm" }}>
      {/* EN-TÊTE */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          {logoSection}
          <div className="mt-2">
            <div className="font-bold text-base" style={{ color }}>{entreprise.nom}</div>
            {entreprise.slogan && <div className="text-xs text-gray-500 italic">{entreprise.slogan}</div>}
            <div className="text-xs text-gray-600 mt-1 leading-5">
              {entreprise.adresse && <div>{entreprise.adresse}</div>}
              {(entreprise.ville || entreprise.pays) && <div>{[entreprise.ville, entreprise.pays].filter(Boolean).join(", ")}</div>}
              {entreprise.telephone && <div>Tél : {entreprise.telephone}</div>}
              {entreprise.mobile && <div>Mobile : {entreprise.mobile}</div>}
              {entreprise.email && <div>Email : {entreprise.email}</div>}
              {entreprise.siteWeb && <div>Web : {entreprise.siteWeb}</div>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold mb-2" style={{ color }}>{titre}</div>
          <table className="text-xs ml-auto">
            <tbody>
              <tr><td className="text-gray-500 pr-3">N° :</td><td className="font-semibold">{doc.reference}</td></tr>
              <tr><td className="text-gray-500 pr-3">Date :</td><td>{"date" in doc ? fmtDate((doc as Devis).date) : fmtDate((doc as Facture).dateEmission)}</td></tr>
              {"date" in doc
                ? <tr><td className="text-gray-500 pr-3">Validité :</td><td>{fmtDate((doc as Devis).validite)}</td></tr>
                : <tr><td className="text-gray-500 pr-3">Échéance :</td><td className="font-semibold text-red-600">{fmtDate((doc as Facture).dateEcheance)}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-full h-0.5 mb-5" style={{ background: color }} />

      {/* INFOS LÉGALES ÉMETTEUR */}
      <div className="flex gap-2 text-xs text-gray-500 mb-5 flex-wrap">
        {entreprise.ice && <span>ICE : {entreprise.ice}</span>}
        {entreprise.if_ && <><span>|</span><span>IF : {entreprise.if_}</span></>}
        {entreprise.rc && <><span>|</span><span>RC : {entreprise.rc}</span></>}
        {entreprise.cnss && <><span>|</span><span>CNSS : {entreprise.cnss}</span></>}
        {entreprise.patente && <><span>|</span><span>Patente : {entreprise.patente}</span></>}
      </div>

      {/* BLOC CLIENT + OBJET */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-xs font-semibold text-white px-3 py-1 rounded-t-lg" style={{ background: color }}>FACTURER À</div>
          <div className="border border-gray-200 rounded-b-lg p-3 text-xs leading-5">
            <div className="font-semibold">{doc.clientLib}</div>
            {doc.lignes.length === 0 ? null : null}
            <div className="text-gray-500 text-xs">(Voir détails client)</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-white px-3 py-1 rounded-t-lg" style={{ background: color }}>OBJET / PROJET</div>
          <div className="border border-gray-200 rounded-b-lg p-3 text-xs leading-5">
            <div className="font-semibold">{doc.objet}</div>
            {doc.projet && <div className="text-gray-500">Projet : {doc.projet}</div>}
            {doc.conditionsPaiement && <div className="text-gray-500">Paiement : {doc.conditionsPaiement}</div>}
            {fd?.modePaiement && <div className="text-gray-500">Mode : {fd.modePaiement}</div>}
          </div>
        </div>
      </div>

      {/* TABLEAU LIGNES */}
      <table className="w-full text-xs mb-4 border-collapse">
        <thead>
          <tr style={{ background: color }} className="text-white">
            <th className="py-2 px-2 text-left rounded-tl-lg w-6">N°</th>
            <th className="py-2 px-2 text-left">Désignation</th>
            <th className="py-2 px-2 text-right w-12">Qté</th>
            <th className="py-2 px-2 text-right w-14">Unité</th>
            <th className="py-2 px-2 text-right w-20">PU HT</th>
            <th className="py-2 px-2 text-right w-12">TVA</th>
            <th className="py-2 px-2 text-right rounded-tr-lg w-24">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {doc.lignes.map((l, i) => (
            <tr key={l.id} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="py-2 px-2 text-center text-gray-400">{String(i + 1).padStart(2, "0")}</td>
              <td className="py-2 px-2">
                <div className="font-medium">{l.designation}</div>
                {l.description && <div className="text-gray-500 text-xs">{l.description}</div>}
              </td>
              <td className="py-2 px-2 text-right">{l.quantite}</td>
              <td className="py-2 px-2 text-right text-gray-500">{l.unite}</td>
              <td className="py-2 px-2 text-right">{mad(l.prixUHT)}</td>
              <td className="py-2 px-2 text-right">{l.tva}%</td>
              <td className="py-2 px-2 text-right font-medium">{mad(l.quantite * l.prixUHT)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAUX */}
      <div className="flex justify-end mb-6">
        <table className="text-xs w-64">
          <tbody>
            <tr className="border-t border-gray-200">
              <td className="py-1 text-gray-500">Total HT</td>
              <td className="py-1 text-right font-medium">{mad(ht)}</td>
            </tr>
            {TVA_OPTIONS.filter(r => doc.lignes.some(l => l.tva === r)).map(r => {
              const base = doc.lignes.filter(l => l.tva === r).reduce((s, l) => s + l.quantite * l.prixUHT, 0)
              return (
                <tr key={r} className="border-t border-gray-100">
                  <td className="py-1 text-gray-500">TVA {r}% (base : {mad(base)})</td>
                  <td className="py-1 text-right">{mad(base * r / 100)}</td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-gray-400">
              <td className="py-2 font-bold text-sm">TOTAL TTC</td>
              <td className="py-2 text-right font-bold text-sm" style={{ color }}>{mad(ttc)}</td>
            </tr>
            {fd && fd.montantPaye > 0 && (
              <>
                <tr><td className="py-1 text-gray-500">Montant payé</td><td className="py-1 text-right text-green-600">- {mad(fd.montantPaye)}</td></tr>
                <tr className="border-t border-gray-200"><td className="py-1 font-semibold">Solde restant</td><td className="py-1 text-right font-semibold text-red-600">{mad(Math.max(0, ttc - fd.montantPaye))}</td></tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* NOTES + SIGNATURE */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          {doc.notes && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes / Conditions</div>
              <div className="text-xs text-gray-600 border border-gray-200 rounded p-2 leading-5">{doc.notes}</div>
            </div>
          )}
          {type === "devis" && (
            <div className="text-xs text-gray-400 mt-2">
              Ce devis est valable jusqu'au {fmtDate((doc as Devis).validite)}.
            </div>
          )}
        </div>
        <div className="flex gap-4 justify-end">
          {entreprise.cachet && (
            <div className="text-center">
              <img src={entreprise.cachet} alt="Cachet" className="max-h-16 max-w-20 object-contain mx-auto" />
              <div className="text-xs text-gray-400 mt-1">Cachet</div>
            </div>
          )}
          {entreprise.signature && (
            <div className="text-center">
              <img src={entreprise.signature} alt="Signature" className="max-h-16 max-w-20 object-contain mx-auto" />
              <div className="text-xs text-gray-400 mt-1">Signature</div>
            </div>
          )}
          {!entreprise.cachet && !entreprise.signature && (
            <div className="border-t border-gray-300 w-36 text-center pt-1 text-xs text-gray-400">Signature &amp; Cachet</div>
          )}
        </div>
      </div>

      {/* PIED DE PAGE */}
      <div className="w-full h-0.5 mb-3" style={{ background: color }} />
      <div className="text-xs text-gray-500 text-center">
        {[entreprise.banque && `Banque : ${entreprise.banque}`, entreprise.rib && `RIB : ${entreprise.rib}`, entreprise.iban && `IBAN : ${entreprise.iban}`, entreprise.swift && `SWIFT : ${entreprise.swift}`].filter(Boolean).join("  |  ")}
      </div>
      <div className="text-xs text-gray-400 text-center mt-1">
        {entreprise.nom} — {entreprise.adresse}, {entreprise.ville} — {entreprise.telephone} — {entreprise.email}
      </div>
    </div>
  )
}

// ─── Print PDF ────────────────────────────────────────────────────────────────

function printDoc(doc: Devis | Facture, entreprise: Entreprise, type: "devis" | "facture") {
  const color = entreprise.couleurPrimaire || "#1e512d"
  const ht = calcHT(doc.lignes)
  const tvaT = calcTVATotal(doc.lignes)
  const ttc = calcTTC(doc.lignes)
  const fd = "dateEmission" in doc ? (doc as Facture) : null
  const titre = type === "devis" ? "DEVIS" : "FACTURE"

  const logoHtml = entreprise.logo
    ? `<img src="${entreprise.logo}" style="max-height:60px;max-width:160px;object-fit:contain;">`
    : `<div style="border:2px dashed #ccc;border-radius:8px;padding:8px;width:120px;height:50px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999;">Votre Logo</div>`

  const lignesHtml = doc.lignes.map((l, i) => `
    <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
      <td style="padding:6px 4px;text-align:center;color:#9ca3af;font-size:11px;">${String(i+1).padStart(2,"0")}</td>
      <td style="padding:6px 4px;font-size:11px;"><strong>${l.designation}</strong>${l.description ? `<br><span style="color:#6b7280;font-size:10px;">${l.description}</span>` : ""}</td>
      <td style="padding:6px 4px;text-align:right;font-size:11px;">${l.quantite}</td>
      <td style="padding:6px 4px;text-align:right;color:#6b7280;font-size:11px;">${l.unite}</td>
      <td style="padding:6px 4px;text-align:right;font-size:11px;">${mad(l.prixUHT)}</td>
      <td style="padding:6px 4px;text-align:right;font-size:11px;">${l.tva}%</td>
      <td style="padding:6px 4px;text-align:right;font-weight:600;font-size:11px;">${mad(l.quantite * l.prixUHT)}</td>
    </tr>`).join("")

  const html = `<!DOCTYPE html><html><head><title>${titre} ${doc.reference}</title>
  <style>
    @page{size:A4;margin:15mm}
    body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;margin:0}
    table{border-collapse:collapse;width:100%}
    .no-print{display:none}
  </style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
    <div>
      <div style="margin-bottom:6px;">${logoHtml}</div>
      <strong style="color:${color};font-size:13px;">${entreprise.nom}</strong>
      ${entreprise.slogan ? `<div style="font-size:10px;color:#6b7280;font-style:italic;">${entreprise.slogan}</div>` : ""}
      <div style="font-size:10px;color:#6b7280;line-height:1.6;margin-top:4px;">
        ${[entreprise.adresse, [entreprise.ville, entreprise.pays].filter(Boolean).join(", "), entreprise.telephone && `Tél : ${entreprise.telephone}`, entreprise.email && `Email : ${entreprise.email}`].filter(Boolean).map(x => `<div>${x}</div>`).join("")}
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:22px;font-weight:700;color:${color};margin-bottom:8px;">${titre}</div>
      <table style="font-size:10px;margin-left:auto;width:auto;">
        <tr><td style="color:#6b7280;padding-right:8px;">N° :</td><td style="font-weight:600;">${doc.reference}</td></tr>
        <tr><td style="color:#6b7280;">Date :</td><td>${"date" in doc ? fmtDate((doc as Devis).date) : fmtDate((doc as Facture).dateEmission)}</td></tr>
        ${"date" in doc ? `<tr><td style="color:#6b7280;">Validité :</td><td>${fmtDate((doc as Devis).validite)}</td></tr>` : `<tr><td style="color:#6b7280;">Échéance :</td><td style="color:#dc2626;font-weight:600;">${fmtDate((doc as Facture).dateEcheance)}</td></tr>`}
      </table>
    </div>
  </div>
  <div style="height:2px;background:${color};margin-bottom:12px;"></div>
  <div style="font-size:10px;color:#9ca3af;margin-bottom:12px;">
    ${[entreprise.ice && `ICE : ${entreprise.ice}`, entreprise.if_ && `IF : ${entreprise.if_}`, entreprise.rc && `RC : ${entreprise.rc}`].filter(Boolean).join(" | ")}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
    <div>
      <div style="background:${color};color:#fff;font-size:10px;font-weight:600;padding:4px 8px;border-radius:6px 6px 0 0;">FACTURER À</div>
      <div style="border:1px solid #e5e7eb;border-radius:0 0 6px 6px;padding:8px;font-size:11px;line-height:1.6;">
        <strong>${doc.clientLib}</strong>
      </div>
    </div>
    <div>
      <div style="background:${color};color:#fff;font-size:10px;font-weight:600;padding:4px 8px;border-radius:6px 6px 0 0;">OBJET / PROJET</div>
      <div style="border:1px solid #e5e7eb;border-radius:0 0 6px 6px;padding:8px;font-size:11px;line-height:1.6;">
        <strong>${doc.objet}</strong>
        ${doc.projet ? `<div style="color:#6b7280;">Projet : ${doc.projet}</div>` : ""}
        ${doc.conditionsPaiement ? `<div style="color:#6b7280;">Paiement : ${doc.conditionsPaiement}</div>` : ""}
      </div>
    </div>
  </div>
  <table style="margin-bottom:16px;">
    <thead><tr style="background:${color};color:#fff;">
      <th style="padding:6px 4px;text-align:left;border-radius:6px 0 0 0;width:24px;">N°</th>
      <th style="padding:6px 4px;text-align:left;">Désignation</th>
      <th style="padding:6px 4px;text-align:right;width:40px;">Qté</th>
      <th style="padding:6px 4px;text-align:right;width:50px;">Unité</th>
      <th style="padding:6px 4px;text-align:right;width:80px;">PU HT</th>
      <th style="padding:6px 4px;text-align:right;width:40px;">TVA</th>
      <th style="padding:6px 4px;text-align:right;border-radius:0 6px 0 0;width:90px;">Total HT</th>
    </tr></thead>
    <tbody>${lignesHtml}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
    <table style="width:240px;font-size:11px;">
      <tr style="border-top:1px solid #e5e7eb;"><td style="padding:4px;color:#6b7280;">Total HT</td><td style="padding:4px;text-align:right;font-weight:500;">${mad(ht)}</td></tr>
      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:4px;color:#6b7280;">TVA</td><td style="padding:4px;text-align:right;">${mad(tvaT)}</td></tr>
      <tr style="border-top:2px solid #9ca3af;">
        <td style="padding:6px 4px;font-weight:700;font-size:13px;">TOTAL TTC</td>
        <td style="padding:6px 4px;text-align:right;font-weight:700;font-size:13px;color:${color};">${mad(ttc)}</td>
      </tr>
      ${fd && fd.montantPaye > 0 ? `
        <tr><td style="padding:4px;color:#6b7280;">Montant payé</td><td style="padding:4px;text-align:right;color:#059669;">- ${mad(fd.montantPaye)}</td></tr>
        <tr style="border-top:1px solid #e5e7eb;"><td style="padding:4px;font-weight:600;">Solde restant</td><td style="padding:4px;text-align:right;font-weight:600;color:#dc2626;">${mad(Math.max(0, ttc - fd.montantPaye))}</td></tr>
      ` : ""}
    </table>
  </div>
  ${doc.notes ? `<div style="font-size:10px;color:#6b7280;border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:12px;"><strong>Notes :</strong> ${doc.notes}</div>` : ""}
  <div style="height:2px;background:${color};margin-bottom:8px;"></div>
  <div style="font-size:10px;color:#9ca3af;text-align:center;">
    ${[entreprise.banque && `Banque : ${entreprise.banque}`, entreprise.rib && `RIB : ${entreprise.rib}`, entreprise.iban && `IBAN : ${entreprise.iban}`].filter(Boolean).join(" | ")}
  </div>
  <div style="font-size:10px;color:#9ca3af;text-align:center;margin-top:4px;">
    ${entreprise.nom} — ${entreprise.adresse}, ${entreprise.ville} — ${entreprise.email}
  </div>
  </body></html>`

  const w = window.open("", "_blank")
  if (!w) return
  w.document.write(html)
  w.document.close()
  setTimeout(() => { w.print() }, 600)
}

// ─── Formulaire Devis / Facture ───────────────────────────────────────────────

function FormDoc({ type, clients, devisExistant, factureExistante, onSave, onClose }: {
  type: "devis" | "facture"
  clients: Client[]
  devisExistant?: Devis | null
  factureExistante?: Facture | null
  onSave: (d: Devis | Facture) => void
  onClose: () => void
}) {
  const isFacture = type === "facture"
  const src = devisExistant ?? factureExistante

  const [clientId, setClientId] = useState(src?.clientId ?? "")
  const [clientLib, setClientLib] = useState(src?.clientLib ?? "")
  const [objet, setObjet] = useState(src?.objet ?? "")
  const [projet, setProjet] = useState(src?.projet ?? "")
  const [date, setDate] = useState("date" in (src ?? {}) ? (src as Devis)?.date ?? today() : today())
  const [dateEmission, setDateEmission] = useState("dateEmission" in (src ?? {}) ? (src as Facture)?.dateEmission ?? today() : today())
  const [validite, setValidite] = useState("validite" in (src ?? {}) ? (src as Devis)?.validite ?? addDays(today(), 30) : addDays(today(), 30))
  const [dateEcheance, setDateEcheance] = useState("dateEcheance" in (src ?? {}) ? (src as Facture)?.dateEcheance ?? addDays(today(), 30) : addDays(today(), 30))
  const [conditions, setConditions] = useState(src?.conditionsPaiement ?? "30 jours net")
  const [modePaiement, setModePaiement] = useState("modePaiement" in (src ?? {}) ? (src as Facture)?.modePaiement ?? "Virement" : "Virement")
  const [notes, setNotes] = useState(src?.notes ?? "")
  const [montantPaye, setMontantPaye] = useState("montantPaye" in (src ?? {}) ? (src as Facture)?.montantPaye ?? 0 : 0)
  const [lignes, setLignes] = useState<LigneDoc[]>(src?.lignes ?? [
    { id: uid(), designation: "", description: "", quantite: 1, unite: "Forfait", prixUHT: 0, tva: 20 }
  ])

  const ht = calcHT(lignes)
  const tvaT = calcTVATotal(lignes)
  const ttc = calcTTC(lignes)

  function selectClient(id: string) {
    const c = clients.find(x => x.id === id)
    setClientId(id)
    setClientLib(c ? `${c.societe || c.nom}` : "")
  }

  function addLigne() {
    setLignes(l => [...l, { id: uid(), designation: "", description: "", quantite: 1, unite: "Forfait", prixUHT: 0, tva: 20 }])
  }
  function updateLigne(idx: number, k: keyof LigneDoc, v: string | number) {
    setLignes(l => l.map((x, i) => i === idx ? { ...x, [k]: v } : x))
  }
  function removeLigne(idx: number) { setLignes(l => l.filter((_, i) => i !== idx)) }

  function handleSave() {
    if (!clientLib.trim() || !objet.trim()) return
    if (isFacture) {
      const f: Facture = {
        id: factureExistante?.id ?? uid(),
        reference: factureExistante?.reference ?? "",
        clientId, clientLib, objet, projet,
        dateEmission, dateEcheance, conditionsPaiement: conditions,
        modePaiement, notes, lignes,
        statut: factureExistante?.statut ?? "BROUILLON",
        montantPaye, dateCreation: factureExistante?.dateCreation ?? today(),
        devisId: factureExistante?.devisId,
      }
      onSave(f)
    } else {
      const d: Devis = {
        id: devisExistant?.id ?? uid(),
        reference: devisExistant?.reference ?? "",
        clientId, clientLib, objet, projet,
        date, validite, conditionsPaiement: conditions, notes, lignes,
        statut: devisExistant?.statut ?? "BROUILLON",
        dateCreation: devisExistant?.dateCreation ?? today(),
      }
      onSave(d)
    }
  }

  const inputR = `${iCls} focus:ring-[#1e512d]`
  const selectR = `${sCls} focus:ring-[#1e512d]`

  return (
    <Modal title={`${src ? "Modifier" : "Nouveau"} ${isFacture ? "Facture" : "Devis"}`} onClose={onClose} size="full">
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Client */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Informations client</h3>
          <Field label="Client existant">
            <select className={selectR} value={clientId} onChange={e => selectClient(e.target.value)}>
              <option value="">— Saisie libre —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.societe || c.nom}</option>)}
            </select>
          </Field>
          <Field label="Nom / Raison sociale *">
            <input className={inputR} value={clientLib} onChange={e => setClientLib(e.target.value)} placeholder="Nom ou société du client" />
          </Field>
        </div>
        {/* Infos document */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Informations {isFacture ? "facture" : "devis"}</h3>
          <div className="grid grid-cols-2 gap-3">
            {isFacture ? (
              <>
                <Field label="Date émission"><input className={inputR} type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} /></Field>
                <Field label="Date échéance"><input className={inputR} type="date" value={dateEcheance} onChange={e => setDateEcheance(e.target.value)} /></Field>
              </>
            ) : (
              <>
                <Field label="Date"><input className={inputR} type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
                <Field label="Validité jusqu'au"><input className={inputR} type="date" value={validite} onChange={e => setValidite(e.target.value)} /></Field>
              </>
            )}
            <Field label="Conditions paiement">
              <input className={inputR} value={conditions} onChange={e => setConditions(e.target.value)} placeholder="30 jours net" />
            </Field>
            {isFacture && (
              <Field label="Mode paiement">
                <select className={selectR} value={modePaiement} onChange={e => setModePaiement(e.target.value)}>
                  {MODES_PAIEMENT.map(m => <option key={m}>{m}</option>)}
                </select>
              </Field>
            )}
          </div>
          <Field label="Objet *">
            <input className={inputR} value={objet} onChange={e => setObjet(e.target.value)} placeholder="Objet du document..." />
          </Field>
          <Field label="Projet">
            <input className={inputR} value={projet} onChange={e => setProjet(e.target.value)} placeholder="Nom du projet (optionnel)" />
          </Field>
        </div>
      </div>

      {/* Lignes */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 mb-3">Lignes de prestation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Désignation", "Description", "Qté", "Unité", "PU HT (MAD)", "TVA %", "Total HT", ""].map(h => (
                  <th key={h} className="px-2 py-2 text-left text-xs font-medium text-muted-fg whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="px-2 py-1.5">
                    <input className={inputR} value={l.designation} onChange={e => updateLigne(i, "designation", e.target.value)} placeholder="Prestation..." style={{ minWidth: 160 }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input className={inputR} value={l.description} onChange={e => updateLigne(i, "description", e.target.value)} placeholder="Détail optionnel" style={{ minWidth: 120 }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input className={inputR} type="number" min={0} value={l.quantite} onChange={e => updateLigne(i, "quantite", Number(e.target.value))} style={{ width: 60 }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select className={selectR} value={l.unite} onChange={e => updateLigne(i, "unite", e.target.value)} style={{ minWidth: 90 }}>
                      {UNITES.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input className={inputR} type="number" min={0} value={l.prixUHT} onChange={e => updateLigne(i, "prixUHT", Number(e.target.value))} style={{ width: 100 }} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select className={selectR} value={l.tva} onChange={e => updateLigne(i, "tva", Number(e.target.value))} style={{ width: 70 }}>
                      {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium text-sm text-foreground whitespace-nowrap">
                    {mad(l.quantite * l.prixUHT)}
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => removeLigne(i)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addLigne} className="mt-3 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-border text-muted-fg hover:border-[#1e512d] hover:text-[#1e512d] transition">
          <Plus className="w-4 h-4" /> Ajouter une ligne
        </button>
      </div>

      {/* Récap + notes */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <Field label="Notes / Conditions particulières">
          <textarea className={`${inputR} h-20 resize-none`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, conditions, délais..." />
        </Field>
        <div className="rounded-xl border border-border bg-muted p-4 text-sm flex flex-col gap-1.5">
          <div className="flex justify-between text-muted-fg"><span>Total HT</span><span className="font-medium text-foreground">{mad(ht)}</span></div>
          {TVA_OPTIONS.filter(r => lignes.some(l => l.tva === r)).map(r => {
            const base = lignes.filter(l => l.tva === r).reduce((s, l) => s + l.quantite * l.prixUHT, 0)
            return <div key={r} className="flex justify-between text-muted-fg"><span>TVA {r}%</span><span>{mad(base * r / 100)}</span></div>
          })}
          <div className="flex justify-between font-bold border-t border-border pt-2 mt-1 text-base">
            <span>Total TTC</span><span style={{ color: "#1e512d" }}>{mad(ttc)}</span>
          </div>
          {isFacture && (
            <>
              <div className="border-t border-border pt-2 mt-1">
                <Field label="Montant payé (MAD)">
                  <input className={inputR} type="number" min={0} max={ttc} value={montantPaye} onChange={e => setMontantPaye(Number(e.target.value))} />
                </Field>
              </div>
              <div className="flex justify-between font-semibold text-red-600">
                <span>Solde restant</span><span>{mad(Math.max(0, ttc - montantPaye))}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition">Annuler</button>
        <button onClick={handleSave} className="px-6 py-2 rounded-lg text-sm font-medium text-white transition" style={{ background: "#1e512d" }}>
          {src ? "Enregistrer" : `Créer le ${isFacture ? "facture" : "devis"}`}
        </button>
      </div>
    </Modal>
  )
}

// ─── Tab Dashboard ────────────────────────────────────────────────────────────

function TabDashboard({ devis, factures, clients, color }: {
  devis: Devis[]; factures: Facture[]; clients: Client[]; color: string
}) {
  const caTotal = factures.filter(f => f.statut === "PAYÉE").reduce((s, f) => s + calcTTC(f.lignes), 0)
  const impayes = factures.filter(f => ["EN_RETARD", "ENVOYÉE", "PARTIELLEMENT_PAYÉE"].includes(f.statut))
    .reduce((s, f) => s + Math.max(0, calcTTC(f.lignes) - f.montantPaye), 0)
  const nbPayees = factures.filter(f => f.statut === "PAYÉE").length
  const tauxConv = devis.length > 0 ? Math.round((devis.filter(d => d.statut === "ACCEPTÉ").length / devis.length) * 100) : 0

  const kpis = [
    { label: "Total devis", value: devis.length.toString(), icon: <FileText className="w-5 h-5" />, color: "#6366F1", bg: "#EEF2FF" },
    { label: "Total factures", value: factures.length.toString(), icon: <Receipt className="w-5 h-5" />, color: "#0EA5E9", bg: "#E0F2FE" },
    { label: "CA encaissé", value: mad(caTotal), icon: <Banknote className="w-5 h-5" />, color: "#059669", bg: "#D1FAE5" },
    { label: "Impayés", value: mad(impayes), icon: <AlertTriangle className="w-5 h-5" />, color: "#DC2626", bg: "#FEE2E2" },
    { label: "Factures payées", value: nbPayees.toString(), icon: <CheckCircle className="w-5 h-5" />, color: "#059669", bg: "#D1FAE5" },
    { label: "Taux conversion devis", value: `${tauxConv}%`, icon: <TrendingUp className="w-5 h-5" />, color, bg: "#DCFCE7" },
  ]

  // CA mensuel (6 derniers mois) depuis factures PAYÉES
  const months: { label: string; val: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear(), m = d.getMonth() + 1
    const key = `${y}-${String(m).padStart(2, "0")}`
    const val = factures
      .filter(f => f.statut === "PAYÉE" && f.dateCreation.startsWith(key))
      .reduce((s, f) => s + calcTTC(f.lignes), 0)
    months.push({ label: d.toLocaleString("fr-MA", { month: "short" }), val })
  }
  const maxVal = Math.max(...months.map(m => m.val), 1)

  // Top clients
  const topClients = clients.map(c => ({
    ...c,
    ca: factures.filter(f => f.clientId === c.id && f.statut === "PAYÉE").reduce((s, f) => s + calcTTC(f.lignes), 0)
  })).sort((a, b) => b.ca - a.ca).slice(0, 4)

  const recent = [...factures].sort((a, b) => b.dateCreation.localeCompare(a.dateCreation)).slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-fg">{k.label}</span>
              <span className="p-1.5 rounded-lg" style={{ background: k.bg, color: k.color }}>{k.icon}</span>
            </div>
            <span className="text-lg font-bold text-foreground leading-tight">{k.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique CA mensuel */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4" style={{ color }} /> CA mensuel encaissé</h3>
          <div className="flex items-end gap-2 h-32">
            {months.map((m, i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-1">
                <div className="w-full rounded-t-md transition-all" style={{
                  height: `${Math.max(4, (m.val / maxVal) * 100)}%`,
                  background: m.val > 0 ? color : "#E5E7EB",
                  opacity: m.val > 0 ? 1 : 0.4
                }} />
                <span className="text-xs text-muted-fg">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-fg text-right">Total : {mad(months.reduce((s, m) => s + m.val, 0))}</div>
        </div>

        {/* Top clients */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Users className="w-4 h-4" style={{ color }} /> Top clients</h3>
          <div className="flex flex-col gap-2">
            {topClients.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0" style={{ background: color }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{c.societe || c.nom}</div>
                  <div className="w-full h-1.5 rounded-full bg-muted mt-1">
                    <div className="h-1.5 rounded-full" style={{ width: `${topClients[0].ca > 0 ? (c.ca / topClients[0].ca) * 100 : 0}%`, background: color }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground shrink-0">{mad(c.ca)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dernières factures */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Dernières factures</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {["Référence", "Client", "Montant TTC", "Statut", "Échéance"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-muted-fg uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {recent.map(f => (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{f.reference}</td>
                  <td className="px-5 py-3 text-foreground">{f.clientLib}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">{mad(calcTTC(f.lignes))}</td>
                  <td className="px-5 py-3"><BadgeSt statut={f.statut} type="facture" /></td>
                  <td className="px-5 py-3 text-muted-fg">{fmtDate(f.dateEcheance)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-fg">Aucune facture</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tab Paramètres ───────────────────────────────────────────────────────────

function TabParametres({ entreprise, onSave }: { entreprise: Entreprise; onSave: (e: Entreprise) => void }) {
  const [form, setForm] = useState<Entreprise>(entreprise)
  const set = (k: keyof Entreprise) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const inputR = `${iCls} focus:ring-[#1e512d]`
  const selectR = `${sCls} focus:ring-[#1e512d]`

  function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 pb-3 border-b border-border text-sm">
          <span style={{ color: form.couleurPrimaire || "#1e512d" }}>{icon}</span> {title}
        </h3>
        <div className="grid grid-cols-2 gap-4">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Logo + identité visuelle */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4 pb-3 border-b border-border text-sm">
          <Building2 className="w-4 h-4" style={{ color: form.couleurPrimaire || "#1e512d" }} /> Identité visuelle
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <ImageUpload value={form.logo} onChange={v => setForm(f => ({ ...f, logo: v }))} label="Logo entreprise (PNG, JPG, SVG)" />
          <ImageUpload value={form.cachet} onChange={v => setForm(f => ({ ...f, cachet: v }))} label="Cachet numérique" />
          <ImageUpload value={form.signature} onChange={v => setForm(f => ({ ...f, signature: v }))} label="Signature numérique" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-muted-fg uppercase tracking-wide mb-1">Couleur principale</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.couleurPrimaire} onChange={e => setForm(f => ({ ...f, couleurPrimaire: e.target.value }))} className="w-10 h-9 rounded-lg border border-border cursor-pointer" />
              <input className={`${inputR} flex-1`} value={form.couleurPrimaire} onChange={e => setForm(f => ({ ...f, couleurPrimaire: e.target.value }))} placeholder="#1e512d" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-fg uppercase tracking-wide mb-1">Position du logo</label>
            <select className={selectR} value={form.logoPosition} onChange={e => setForm(f => ({ ...f, logoPosition: e.target.value as LogoPosition }))}>
              <option value="left">Gauche</option>
              <option value="center">Centré</option>
              <option value="right">Droite</option>
            </select>
          </div>
        </div>
      </div>

      <Section title="Informations entreprise" icon={<Building2 className="w-4 h-4" />}>
        <Field label="Nom de l'entreprise *" col2><input className={inputR} value={form.nom} onChange={set("nom")} /></Field>
        <Field label="Slogan (optionnel)" col2><input className={inputR} value={form.slogan} onChange={set("slogan")} /></Field>
        <Field label="Adresse" col2><input className={inputR} value={form.adresse} onChange={set("adresse")} /></Field>
        <Field label="Ville"><input className={inputR} value={form.ville} onChange={set("ville")} /></Field>
        <Field label="Pays"><input className={inputR} value={form.pays} onChange={set("pays")} /></Field>
        <Field label="Téléphone"><input className={inputR} value={form.telephone} onChange={set("telephone")} /></Field>
        <Field label="Mobile"><input className={inputR} value={form.mobile} onChange={set("mobile")} /></Field>
        <Field label="Email"><input className={inputR} type="email" value={form.email} onChange={set("email")} /></Field>
        <Field label="Site Web"><input className={inputR} value={form.siteWeb} onChange={set("siteWeb")} /></Field>
      </Section>

      <Section title="Informations légales" icon={<Hash className="w-4 h-4" />}>
        <Field label="ICE"><input className={inputR} value={form.ice} onChange={set("ice")} /></Field>
        <Field label="IF"><input className={inputR} value={form.if_} onChange={set("if_")} /></Field>
        <Field label="RC"><input className={inputR} value={form.rc} onChange={set("rc")} /></Field>
        <Field label="CNSS"><input className={inputR} value={form.cnss} onChange={set("cnss")} /></Field>
        <Field label="Patente"><input className={inputR} value={form.patente} onChange={set("patente")} /></Field>
        <Field label="Capital social"><input className={inputR} value={form.capital} onChange={set("capital")} /></Field>
      </Section>

      <Section title="Coordonnées bancaires" icon={<CreditCard className="w-4 h-4" />}>
        <Field label="Banque"><input className={inputR} value={form.banque} onChange={set("banque")} /></Field>
        <Field label="RIB"><input className={inputR} value={form.rib} onChange={set("rib")} /></Field>
        <Field label="IBAN" col2><input className={inputR} value={form.iban} onChange={set("iban")} /></Field>
        <Field label="SWIFT / BIC"><input className={inputR} value={form.swift} onChange={set("swift")} /></Field>
      </Section>

      <div className="flex gap-3">
        <button onClick={() => onSave(form)} className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition" style={{ background: form.couleurPrimaire || "#1e512d" }}>
          <CheckCircle className="w-4 h-4 inline mr-2" />Enregistrer les paramètres
        </button>
      </div>
    </div>
  )
}

// ─── Tab Clients ──────────────────────────────────────────────────────────────

function TabClients({ clients, factures, devis, color, onAdd, onEdit, onDelete }: {
  clients: Client[]; factures: Facture[]; devis: Devis[]; color: string
  onAdd: (c: Client) => void; onEdit: (c: Client) => void; onDelete: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<"new" | Client | null>(null)
  const [viewClient, setViewClient] = useState<Client | null>(null)

  const filtered = clients.filter(c =>
    `${c.nom} ${c.societe} ${c.email} ${c.ville}`.toLowerCase().includes(search.toLowerCase())
  )

  function caClient(id: string) {
    return factures.filter(f => f.clientId === id && f.statut === "PAYÉE").reduce((s, f) => s + calcTTC(f.lignes), 0)
  }

  const inputR = `${iCls} focus:ring-[#1e512d]`

  function ClientForm({ src, onSave, onClose }: { src?: Client; onSave: (c: Client) => void; onClose: () => void }) {
    const [form, setForm] = useState<Omit<Client, "id">>(src ?? {
      nom: "", societe: "", email: "", telephone: "", mobile: "",
      adresse: "", ville: "", pays: "Maroc", ice: "", rc: "", if_: "", contact: ""
    })
    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
    function handleSave() {
      if (!form.nom.trim()) return
      onSave({ ...form, id: src?.id ?? uid() })
      onClose()
    }
    return (
      <Modal title={src ? "Modifier client" : "Nouveau client"} onClose={onClose}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom *" col2><input className={inputR} value={form.nom} onChange={set("nom")} required /></Field>
          <Field label="Société"><input className={inputR} value={form.societe} onChange={set("societe")} /></Field>
          <Field label="Contact"><input className={inputR} value={form.contact} onChange={set("contact")} /></Field>
          <Field label="Email"><input className={inputR} type="email" value={form.email} onChange={set("email")} /></Field>
          <Field label="Téléphone"><input className={inputR} value={form.telephone} onChange={set("telephone")} /></Field>
          <Field label="Mobile"><input className={inputR} value={form.mobile} onChange={set("mobile")} /></Field>
          <Field label="Adresse" col2><input className={inputR} value={form.adresse} onChange={set("adresse")} /></Field>
          <Field label="Ville"><input className={inputR} value={form.ville} onChange={set("ville")} /></Field>
          <Field label="Pays"><input className={inputR} value={form.pays} onChange={set("pays")} /></Field>
          <Field label="ICE"><input className={inputR} value={form.ice} onChange={set("ice")} /></Field>
          <Field label="RC"><input className={inputR} value={form.rc} onChange={set("rc")} /></Field>
          <Field label="IF"><input className={inputR} value={form.if_} onChange={set("if_")} /></Field>
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition">Annuler</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-lg text-sm font-medium text-white" style={{ background: color }}>Enregistrer</button>
        </div>
      </Modal>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <input className={`${inputR} pl-9 w-64`} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setModal("new")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: color }}>
          <Plus className="w-4 h-4" /> Nouveau client
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            {["Nom / Société", "Email", "Téléphone", "Ville", "Devis", "Factures", "CA payé", "Actions"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-fg uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{c.societe || c.nom}</div>
                  {c.societe && <div className="text-xs text-muted-fg">{c.nom}</div>}
                </td>
                <td className="px-4 py-3 text-muted-fg">{c.email}</td>
                <td className="px-4 py-3 text-muted-fg">{c.telephone}</td>
                <td className="px-4 py-3 text-foreground">{c.ville}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ background: color }}>{devis.filter(d => d.clientId === c.id).length}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ background: "#0EA5E9" }}>{factures.filter(f => f.clientId === c.id).length}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{mad(caClient(c.id))}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewClient(c)} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground transition" title="Historique"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => setModal(c)} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground transition" title="Modifier"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (window.confirm("Supprimer ce client ?")) onDelete(c.id) }} className="p-1.5 rounded hover:bg-red-50 text-muted-fg hover:text-red-600 transition" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-fg">Aucun client</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <ClientForm
          src={modal === "new" ? undefined : modal}
          onSave={c => { modal === "new" ? onAdd(c) : onEdit(c); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}

      {viewClient && (
        <Modal title={`Historique — ${viewClient.societe || viewClient.nom}`} onClose={() => setViewClient(null)} size="xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Devis</h4>
              {devis.filter(d => d.clientId === viewClient.id).map(d => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-border text-sm">
                  <span className="font-mono text-xs text-foreground">{d.reference}</span>
                  <span className="text-muted-fg truncate mx-2 flex-1">{d.objet}</span>
                  <span className="font-semibold text-foreground shrink-0">{mad(calcTTC(d.lignes))}</span>
                  <BadgeSt statut={d.statut} type="devis" />
                </div>
              ))}
              {devis.filter(d => d.clientId === viewClient.id).length === 0 && <div className="text-muted-fg text-sm">Aucun devis</div>}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Factures</h4>
              {factures.filter(f => f.clientId === viewClient.id).map(f => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-border text-sm gap-2">
                  <span className="font-mono text-xs text-foreground">{f.reference}</span>
                  <span className="text-muted-fg truncate flex-1">{f.objet}</span>
                  <span className="font-semibold text-foreground shrink-0">{mad(calcTTC(f.lignes))}</span>
                  <BadgeSt statut={f.statut} type="facture" />
                </div>
              ))}
              {factures.filter(f => f.clientId === viewClient.id).length === 0 && <div className="text-muted-fg text-sm">Aucune facture</div>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Tab Devis ────────────────────────────────────────────────────────────────

function TabDevis({ devis, setDevis, clients, factures, setFactures, entreprise, onToast }: {
  devis: Devis[]; setDevis: (d: Devis[]) => void
  clients: Client[]; factures: Facture[]; setFactures: (f: Facture[]) => void
  entreprise: Entreprise; onToast: (m: string) => void
}) {
  const color = entreprise.couleurPrimaire || "#1e512d"
  const [filtreStatut, setFiltreStatut] = useState("TOUS")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<Devis | null>(null)
  const [preview, setPreview] = useState<Devis | null>(null)
  const [editing, setEditing] = useState<Devis | null>(null)

  const filtered = useMemo(() => devis.filter(d => {
    if (filtreStatut !== "TOUS" && d.statut !== filtreStatut) return false
    if (search && !`${d.reference} ${d.clientLib} ${d.objet}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [devis, filtreStatut, search])

  const inputR = `${iCls} focus:ring-[${color}]`

  function saveDevis(d: Devis) {
    const isNew = !d.reference
    if (!d.reference) d.reference = nextRef(devis, "DEV")
    if (editing) {
      setDevis(devis.map(x => x.id === d.id ? d : x))
      onToast(`Devis ${d.reference} modifié`)
    } else {
      setDevis([...devis, d])
      onToast(`Devis ${d.reference} créé`)
    }
    setForm(null); setEditing(null)
  }

  function convertir(d: Devis) {
    const newRef = nextRef(factures, "FAC")
    const f: Facture = {
      id: uid(), reference: newRef, clientId: d.clientId, clientLib: d.clientLib,
      objet: d.objet, projet: d.projet, dateEmission: today(),
      dateEcheance: addDays(today(), 30), conditionsPaiement: d.conditionsPaiement,
      modePaiement: "Virement", notes: `Issu du devis ${d.reference}`, lignes: d.lignes,
      statut: "BROUILLON", montantPaye: 0, dateCreation: today(), devisId: d.id,
    }
    setFactures([...factures, f])
    setDevis(devis.map(x => x.id === d.id ? { ...x, statut: "ACCEPTÉ" } : x))
    onToast(`Facture ${newRef} créée depuis ${d.reference}`)
  }

  function dupliquer(d: Devis) {
    const newRef = nextRef(devis, "DEV")
    const copy: Devis = { ...d, id: uid(), reference: newRef, statut: "BROUILLON", dateCreation: today(), date: today() }
    setDevis([...devis, copy])
    onToast(`Devis ${newRef} créé (copie)`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
            <input className={`${inputR} pl-9 w-52`} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className={`${iCls} w-auto focus:ring-[${color}]`} value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
            <option value="TOUS">Tous statuts</option>
            {Object.entries(STATUT_DEVIS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({} as Devis) }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: color }}>
          <Plus className="w-4 h-4" /> Nouveau devis
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            {["Référence", "Client", "Objet", "Total TTC", "Statut", "Date", "Actions"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-fg uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-foreground">{d.reference}</td>
                <td className="px-4 py-3 text-foreground">{d.clientLib}</td>
                <td className="px-4 py-3 text-muted-fg max-w-[150px] truncate">{d.objet}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{mad(calcTTC(d.lignes))}</td>
                <td className="px-4 py-3"><BadgeSt statut={d.statut} type="devis" /></td>
                <td className="px-4 py-3 text-muted-fg">{fmtDate(d.date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreview(d)} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="Aperçu"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => printDoc(d, entreprise, "devis")} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="PDF"><Printer className="w-4 h-4" /></button>
                    <button onClick={() => { onToast(`Email simulé pour ${d.reference}`) }} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="Email"><Mail className="w-4 h-4" /></button>
                    <button onClick={() => dupliquer(d)} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="Dupliquer"><Copy className="w-4 h-4" /></button>
                    {d.statut === "ACCEPTÉ" && (
                      <button onClick={() => convertir(d)} className="p-1.5 rounded hover:bg-green-50 text-muted-fg hover:text-green-600" title="Convertir en facture"><ArrowRight className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => { setEditing(d); setForm(d) }} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="Modifier"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => {
                      if (window.confirm("Supprimer ce devis ?")) {
                        setDevis(devis.filter(x => x.id !== d.id)); onToast("Devis supprimé")
                      }
                    }} className="p-1.5 rounded hover:bg-red-50 text-muted-fg hover:text-red-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-fg">Aucun devis</td></tr>}
          </tbody>
        </table>
      </div>

      {form !== null && (
        <FormDoc type="devis" clients={clients} devisExistant={editing} onSave={d => saveDevis(d as Devis)} onClose={() => { setForm(null); setEditing(null) }} />
      )}

      {preview && (
        <Modal title={`Aperçu — ${preview.reference}`} onClose={() => setPreview(null)} size="full">
          <div className="flex justify-end gap-3 mb-4 no-print">
            <button onClick={() => printDoc(preview, entreprise, "devis")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: color }}>
              <Printer className="w-4 h-4" /> Télécharger PDF
            </button>
          </div>
          <div className="border border-border rounded-xl overflow-hidden shadow-inner">
            <DocumentView doc={preview} entreprise={entreprise} type="devis" />
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Tab Factures ─────────────────────────────────────────────────────────────

function TabFactures({ factures, setFactures, clients, entreprise, onToast }: {
  factures: Facture[]; setFactures: (f: Facture[]) => void
  clients: Client[]; entreprise: Entreprise; onToast: (m: string) => void
}) {
  const color = entreprise.couleurPrimaire || "#1e512d"
  const [filtreStatut, setFiltreStatut] = useState("TOUS")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<Facture | null>(null)
  const [editing, setEditing] = useState<Facture | null>(null)
  const [preview, setPreview] = useState<Facture | null>(null)

  const filtered = useMemo(() => factures.filter(f => {
    if (filtreStatut !== "TOUS" && f.statut !== filtreStatut) return false
    if (search && !`${f.reference} ${f.clientLib} ${f.objet}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [factures, filtreStatut, search])

  const inputR = `${iCls} focus:ring-[${color}]`

  function saveFacture(f: Facture) {
    if (!f.reference) f.reference = nextRef(factures, "FAC")
    if (editing) {
      setFactures(factures.map(x => x.id === f.id ? f : x))
      onToast(`Facture ${f.reference} modifiée`)
    } else {
      setFactures([...factures, f])
      onToast(`Facture ${f.reference} créée`)
    }
    setForm(null); setEditing(null)
  }

  function setStatut(id: string, statut: StatutFacture) {
    setFactures(factures.map(f => f.id === id ? { ...f, statut } : f))
    onToast(`Statut mis à jour : ${STATUT_FACTURE[statut].label}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
            <input className={`${inputR} pl-9 w-52`} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className={`${iCls} w-auto focus:ring-[${color}]`} value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
            <option value="TOUS">Tous statuts</option>
            {Object.entries(STATUT_FACTURE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({} as Facture) }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: color }}>
          <Plus className="w-4 h-4" /> Nouvelle facture
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            {["Référence", "Client", "Objet", "Total TTC", "Payé", "Solde", "Statut", "Échéance", "Actions"].map(h => (
              <th key={h} className="px-3 py-3 text-left text-xs font-medium text-muted-fg uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(f => {
              const ttc = calcTTC(f.lignes)
              const solde = Math.max(0, ttc - f.montantPaye)
              return (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs text-foreground">{f.reference}</td>
                  <td className="px-3 py-3 text-foreground">{f.clientLib}</td>
                  <td className="px-3 py-3 text-muted-fg max-w-[120px] truncate">{f.objet}</td>
                  <td className="px-3 py-3 font-semibold text-foreground">{mad(ttc)}</td>
                  <td className="px-3 py-3 text-green-600 font-medium">{mad(f.montantPaye)}</td>
                  <td className="px-3 py-3 text-red-600 font-medium">{solde > 0 ? mad(solde) : "—"}</td>
                  <td className="px-3 py-3"><BadgeSt statut={f.statut} type="facture" /></td>
                  <td className="px-3 py-3 text-muted-fg">{fmtDate(f.dateEcheance)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPreview(f)} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="Aperçu"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => printDoc(f, entreprise, "facture")} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="PDF"><Printer className="w-4 h-4" /></button>
                      <button onClick={() => onToast(`Email simulé pour ${f.reference}`)} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="Email"><Mail className="w-4 h-4" /></button>
                      {f.statut !== "PAYÉE" && f.statut !== "ANNULÉE" && (
                        <button onClick={() => setStatut(f.id, "PAYÉE")} className="p-1.5 rounded hover:bg-green-50 text-muted-fg hover:text-green-600" title="Marquer payée"><CheckCircle className="w-4 h-4" /></button>
                      )}
                      {f.statut !== "EN_RETARD" && f.statut !== "PAYÉE" && f.statut !== "ANNULÉE" && (
                        <button onClick={() => setStatut(f.id, "EN_RETARD")} className="p-1.5 rounded hover:bg-red-50 text-muted-fg hover:text-red-600" title="Marquer en retard"><AlertCircle className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => { setEditing(f); setForm(f) }} className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-foreground" title="Modifier"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => {
                        if (window.confirm("Supprimer cette facture ?")) {
                          setFactures(factures.filter(x => x.id !== f.id)); onToast("Facture supprimée")
                        }
                      }} className="p-1.5 rounded hover:bg-red-50 text-muted-fg hover:text-red-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-fg">Aucune facture</td></tr>}
          </tbody>
        </table>
      </div>

      {form !== null && (
        <FormDoc type="facture" clients={clients} factureExistante={editing} onSave={f => saveFacture(f as Facture)} onClose={() => { setForm(null); setEditing(null) }} />
      )}

      {preview && (
        <Modal title={`Aperçu — ${preview.reference}`} onClose={() => setPreview(null)} size="full">
          <div className="flex justify-end gap-3 mb-4">
            <button onClick={() => printDoc(preview, entreprise, "facture")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: color }}>
              <Printer className="w-4 h-4" /> Télécharger PDF
            </button>
          </div>
          <div className="border border-border rounded-xl overflow-hidden shadow-inner">
            <DocumentView doc={preview} entreprise={entreprise} type="facture" />
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

type TabId = "dashboard" | "parametres" | "clients" | "devis" | "factures"

export default function FacturationPage() {
  const [entreprise, setEntreprise] = useState<Entreprise>(ENTREPRISE_DEFAUT)
  const [clients, setClients] = useState<Client[]>(CLIENTS_INIT)
  const [devis, setDevis] = useState<Devis[]>(DEVIS_INIT)
  const [factures, setFactures] = useState<Facture[]>(FACTURES_INIT)
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [toast, setToast] = useState<string | null>(null)

  // Charger localStorage
  useEffect(() => {
    setEntreprise(load("engipilot_company", ENTREPRISE_DEFAUT))
    setClients(load("engipilot_clients", CLIENTS_INIT))
    setDevis(load("engipilot_devis", DEVIS_INIT))
    setFactures(load("engipilot_factures", FACTURES_INIT))
  }, [])

  function saveEntreprise(e: Entreprise) { setEntreprise(e); save("engipilot_company", e); setToast("Paramètres enregistrés") }
  function saveClients(c: Client[]) { setClients(c); save("engipilot_clients", c) }
  function saveDevis(d: Devis[]) { setDevis(d); save("engipilot_devis", d) }
  function saveFactures(f: Facture[]) { setFactures(f); save("engipilot_factures", f) }

  const color = entreprise.couleurPrimaire || "#1e512d"

  const tabs: { key: TabId; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard",  label: "Dashboard",  icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "parametres", label: "Paramètres", icon: <Settings className="w-4 h-4" /> },
    { key: "clients",    label: "Clients",    icon: <Users className="w-4 h-4" /> },
    { key: "devis",      label: "Devis",      icon: <FileText className="w-4 h-4" /> },
    { key: "factures",   label: "Factures",   icon: <Receipt className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
          <p className="text-sm text-muted-fg mt-0.5">Devis, factures et gestion clients — {entreprise.nom}</p>
        </div>
        <div className="flex items-center gap-3">
          {entreprise.logo
            ? <img src={entreprise.logo} alt="logo" className="h-8 max-w-24 object-contain rounded" />
            : <div className="flex items-center gap-1.5 text-sm text-muted-fg border border-dashed border-border rounded-lg px-3 py-1.5">
                <Building2 className="w-4 h-4" /> {entreprise.nom}
              </div>
          }
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === t.key ? "text-foreground" : "text-muted-fg hover:text-foreground"
            }`}>
            {t.icon} {t.label}
            {activeTab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: color }} />
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "dashboard" && <TabDashboard devis={devis} factures={factures} clients={clients} color={color} />}
      {activeTab === "parametres" && <TabParametres entreprise={entreprise} onSave={saveEntreprise} />}
      {activeTab === "clients" && (
        <TabClients
          clients={clients} factures={factures} devis={devis} color={color}
          onAdd={c => saveClients([...clients, c])}
          onEdit={c => saveClients(clients.map(x => x.id === c.id ? c : x))}
          onDelete={id => saveClients(clients.filter(x => x.id !== id))}
        />
      )}
      {activeTab === "devis" && (
        <TabDevis
          devis={devis} setDevis={saveDevis}
          clients={clients} factures={factures} setFactures={saveFactures}
          entreprise={entreprise} onToast={setToast}
        />
      )}
      {activeTab === "factures" && (
        <TabFactures
          factures={factures} setFactures={saveFactures}
          clients={clients} entreprise={entreprise} onToast={setToast}
        />
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} color={color} />}
    </div>
  )
}
