import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// ─── Palette ────────────────────────────────────────────────────────────────
const PRIMARY  = [99, 91, 255]  as [number, number, number]
const DARK     = [26, 29, 39]   as [number, number, number]
const MUTED    = [107, 114, 128] as [number, number, number]
const WHITE    = [255, 255, 255] as [number, number, number]
const LIGHT_BG = [248, 248, 252] as [number, number, number]

// ─── Types ───────────────────────────────────────────────────────────────────
export interface RapportPDFData {
  num:              string
  date:             string
  chantier:         string
  auteur:           string
  meteo:            string
  avancement:       number
  effectif:         number
  heuresTravaillees?: number
  beton?:           number
  acier?:           number
  observations:     string
  problemes?:       string
  incidentsSecurite?: boolean
}

export interface AnalyticsPDFData {
  period:         number
  totalProjects:  number
  avgProgress:    number
  avgSpi:         number | null
  budgetPct:      number
  totalBudget:    number
  totalActual:    number
  totalIncidents: number
  projects: {
    name: string
    spi:  number | null
    cpi:  number | null
    prevu: number
    reel:  number
  }[]
  incidentsByStatus: { label: string; count: number }[]
}

export interface EvmPDFData {
  projectName: string
  bac: number; pv: number; ev: number; ac: number
  spi: number; cpi: number; cv: number; sv: number
  eac: number; vac: number; tcpi: number
  progress: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function header(doc: jsPDF, title: string, subtitle: string) {
  // Banner
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, 210, 28, "F")

  // Logo text
  doc.setTextColor(...WHITE)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("ENGIPILOT", 14, 12)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Supervision Intelligente des Chantiers", 14, 19)

  // Title block
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text(title, 210 - 14, 12, { align: "right" })

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(subtitle, 210 - 14, 19, { align: "right" })

  // Reset color
  doc.setTextColor(...DARK)
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(
      `Généré par ENGIPILOT · ${new Date().toLocaleString("fr-FR")} · Document non contractuel`,
      14,
      doc.internal.pageSize.height - 8
    )
    doc.text(`${i} / ${pages}`, 210 - 14, doc.internal.pageSize.height - 8, { align: "right" })
  }
}

function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFillColor(...LIGHT_BG)
  doc.roundedRect(14, y, 182, 8, 2, 2, "F")
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...PRIMARY)
  doc.text(text, 18, y + 5.5)
  doc.setTextColor(...DARK)
  return y + 13
}

function kv(doc: jsPDF, y: number, label: string, value: string, col = 14): number {
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED)
  doc.text(label, col, y)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...DARK)
  doc.text(value, col + 45, y)
  return y + 6
}

// ─── Rapport Journalier PDF ───────────────────────────────────────────────────
export function exportRapportPDF(data: RapportPDFData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

  header(doc, data.num, `Rapport Journalier · ${data.date}`)

  let y = 36

  // Infos générales
  y = sectionTitle(doc, y, "INFORMATIONS GÉNÉRALES")
  y = kv(doc, y, "Chantier",        data.chantier)
  y = kv(doc, y, "Date",            data.date)
  y = kv(doc, y, "Auteur",          data.auteur)
  y = kv(doc, y, "Météo",           data.meteo)
  y = kv(doc, y, "Effectif présent",`${data.effectif} ouvriers`)
  if (data.heuresTravaillees != null)
    y = kv(doc, y, "Heures travaillées", `${data.heuresTravaillees} h`)
  y += 4

  // Avancement
  y = sectionTitle(doc, y, "AVANCEMENT")
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED)
  doc.text("Avancement global", 14, y)
  // Progress bar
  doc.setFillColor(230, 230, 240)
  doc.roundedRect(60, y - 4, 100, 5, 2, 2, "F")
  const pct = Math.min(100, Math.max(0, data.avancement))
  const barColor: [number, number, number] = pct > 75 ? [0, 200, 117] : pct > 50 ? [99, 91, 255] : [253, 171, 61]
  doc.setFillColor(...barColor)
  doc.roundedRect(60, y - 4, pct, 5, 2, 2, "F")
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...DARK)
  doc.text(`${pct}%`, 165, y)
  y += 8

  if (data.beton != null || data.acier != null) {
    const rows: [string, string][] = []
    if (data.beton != null) rows.push(["Béton coulé", `${data.beton} m³`])
    if (data.acier != null) rows.push(["Acier posé",  `${data.acier} kg`])
    autoTable(doc, {
      startY: y,
      head: [["Matériau", "Quantité"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // Observations
  y = sectionTitle(doc, y, "OBSERVATIONS DU JOUR")
  const obsLines = doc.splitTextToSize(data.observations || "Aucune observation.", 178)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...DARK)
  doc.text(obsLines, 14, y)
  y += obsLines.length * 5 + 4

  if (data.problemes) {
    y = sectionTitle(doc, y, "PROBLÈMES RENCONTRÉS")
    const probLines = doc.splitTextToSize(data.problemes, 178)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(probLines, 14, y)
    y += probLines.length * 5 + 4
  }

  // Incidents HSE badge
  if (data.incidentsSecurite) {
    doc.setFillColor(254, 226, 226)
    doc.roundedRect(14, y, 182, 10, 2, 2, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(185, 28, 28)
    doc.text("⚠  INCIDENT SÉCURITÉ SIGNALÉ — Notification HSE déclenchée", 18, y + 6.5)
    doc.setTextColor(...DARK)
    y += 14
  }

  footer(doc)
  doc.save(`${data.num}.pdf`)
}

// ─── Analytics PDF ───────────────────────────────────────────────────────────
export function exportAnalyticsPDF(data: AnalyticsPDFData): void {
  const doc  = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  const today = new Date().toLocaleDateString("fr-FR")

  header(doc, "Data Intelligence", `Tous projets · ${data.period}j · ${today}`)

  let y = 36

  // Résumé global
  y = sectionTitle(doc, y, "RÉSUMÉ GLOBAL")
  const cols = [
    ["Projets actifs",   String(data.totalProjects)],
    ["Avancement moyen", `${data.avgProgress} %`],
    ["SPI moyen",        data.avgSpi != null ? data.avgSpi.toFixed(2) : "N/D"],
    ["Budget consommé",  `${data.budgetPct} %`],
  ]
  cols.forEach(([label, val], i) => {
    const col = i < 2 ? 14 : 110
    const baseY = y + (i % 2) * 6
    if (i === 0 || i === 2) {
      kv(doc, baseY, label, val, col)
    } else {
      kv(doc, baseY, label, val, col)
    }
  })
  // Lay out as 2-column grid
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED)
  kv(doc, y,     cols[0][0], cols[0][1], 14)
  kv(doc, y + 6, cols[1][0], cols[1][1], 14)
  kv(doc, y,     cols[2][0], cols[2][1], 110)
  kv(doc, y + 6, cols[3][0], cols[3][1], 110)
  y += 18

  // Budget global
  const totalBudgetK = Math.round(data.totalBudget / 1_000)
  const totalActualK = Math.round(data.totalActual / 1_000)
  kv(doc, y, "Budget total prévu",   `${totalBudgetK.toLocaleString("fr-FR")} k MAD`, 14)
  kv(doc, y, "Coût total réalisé",   `${totalActualK.toLocaleString("fr-FR")} k MAD`, 110)
  y += 10

  // Performance par projet
  y = sectionTitle(doc, y, "PERFORMANCE PAR PROJET")

  autoTable(doc, {
    startY: y,
    head: [["Projet", "SPI", "CPI", "Budget prévu (k)", "Coût réel (k)", "Statut SPI"]],
    body: data.projects.map(p => [
      p.name,
      p.spi  != null ? p.spi.toFixed(2)  : "N/D",
      p.cpi  != null ? p.cpi.toFixed(2)  : "N/D",
      p.prevu.toLocaleString("fr-FR"),
      p.reel.toLocaleString("fr-FR"),
      p.spi == null ? "—" : p.spi >= 0.95 ? "✓ Conforme" : p.spi >= 0.85 ? "⚠ Alerte" : "✗ Critique",
    ]),
    theme: "striped",
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 5: { fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 5) {
        const v = String(d.cell.raw)
        d.cell.styles.textColor = v.startsWith("✓") ? [0, 160, 90] : v.startsWith("⚠") ? [180, 120, 0] : v.startsWith("✗") ? [185, 28, 28] : MUTED
      }
    },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Incidents
  if (data.incidentsByStatus.length > 0) {
    y = sectionTitle(doc, y, `INCIDENTS — ${data.totalIncidents} au total`)

    autoTable(doc, {
      startY: y,
      head: [["Statut", "Nombre"]],
      body: data.incidentsByStatus.map(i => [i.label, String(i.count)]),
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      tableWidth: 80,
    })
  }

  footer(doc)
  doc.save(`Analytics_ENGIPILOT_${today.replace(/\//g, "-")}.pdf`)
}

// ─── EVM KPI PDF ─────────────────────────────────────────────────────────────
export function exportEvmPDF(data: EvmPDFData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

  const today = new Date().toLocaleDateString("fr-FR")
  header(doc, "Rapport EVM", `${data.projectName} · ${today}`)

  let y = 36

  y = sectionTitle(doc, y, "EARNED VALUE MANAGEMENT — VALEURS")

  autoTable(doc, {
    startY: y,
    head: [["Indicateur", "Valeur", "Description"]],
    body: [
      ["BAC — Budget at Completion", `${data.bac.toLocaleString("fr-FR")} MAD`, "Budget total prévu"],
      ["PV — Planned Value",         `${data.pv.toLocaleString("fr-FR")} MAD`, "Valeur planifiée à ce jour"],
      ["EV — Earned Value",          `${data.ev.toLocaleString("fr-FR")} MAD`, "Valeur acquise réelle"],
      ["AC — Actual Cost",           `${data.ac.toLocaleString("fr-FR")} MAD`, "Coût réel dépensé"],
      ["EAC — Estimate at Completion",`${data.eac.toLocaleString("fr-FR")} MAD`,"Coût final estimé"],
      ["VAC — Variance at Completion",`${data.vac.toLocaleString("fr-FR")} MAD`,"Écart budget final"],
    ],
    theme: "striped",
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  y = sectionTitle(doc, y, "INDICES DE PERFORMANCE")

  const spiOk  = data.spi  >= 0.95
  const cpiOk  = data.cpi  >= 0.95

  autoTable(doc, {
    startY: y,
    head: [["Indice", "Valeur", "Seuil", "Statut"]],
    body: [
      ["SPI — Schedule Performance", data.spi.toFixed(2),  "≥ 0.95", spiOk  ? "✓ Conforme" : "⚠ Alerte"],
      ["CPI — Cost Performance",     data.cpi.toFixed(2),  "≥ 0.95", cpiOk  ? "✓ Conforme" : "⚠ Alerte"],
      ["CV — Cost Variance",         data.cv.toFixed(2),   "≥ 0",    data.cv >= 0  ? "✓ OK" : "⚠ Dépassement"],
      ["SV — Schedule Variance",     data.sv.toFixed(2),   "≥ 0",    data.sv >= 0  ? "✓ OK" : "⚠ Retard"],
      ["TCPI",                       data.tcpi.toFixed(3), "≤ 1.10", data.tcpi <= 1.1 ? "✓ Atteignable" : "⚠ Difficile"],
    ],
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 3: { fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const val = String(data.cell.raw)
        data.cell.styles.textColor = val.startsWith("✓") ? [0, 160, 90] : [185, 28, 28]
      }
    },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Progress bar
  y = sectionTitle(doc, y, "AVANCEMENT PHYSIQUE")
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...MUTED)
  doc.text("Progression globale", 14, y)
  doc.setFillColor(230, 230, 240)
  doc.roundedRect(60, y - 4, 100, 5, 2, 2, "F")
  const pct = Math.min(100, Math.max(0, data.progress))
  const barColor: [number, number, number] = pct > 75 ? [0, 200, 117] : pct > 50 ? [99, 91, 255] : [253, 171, 61]
  doc.setFillColor(...barColor)
  doc.roundedRect(60, y - 4, pct, 5, 2, 2, "F")
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...DARK)
  doc.text(`${pct}%`, 165, y)

  footer(doc)
  doc.save(`EVM_${data.projectName.replace(/\s+/g, "_")}_${today.replace(/\//g, "-")}.pdf`)
}
