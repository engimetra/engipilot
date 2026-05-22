/**
 * ENGIPILOT — Service génération PDF avec jsPDF
 * Génère rapports journaliers, bilans EVM, rapports HSE
 */
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface RapportData {
  chantier: string; date: string; numero: string
  meteo: string; effectif: number; avancement: number
  travaux: string; beton?: number; acier?: number
  problemes?: string
}

interface EVMData {
  chantier: string; bat: number; va: number; vp: number; cr: number
  spi: number; cpi: number; eac: number; interpretation: string
}

function header(doc: jsPDF, titre: string) {
  doc.setFillColor(30, 64, 175) // blue-800
  doc.rect(0, 0, 210, 28, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("🏗️ ENGIPILOT", 14, 12)
  doc.setFontSize(10)
  doc.text("Plateforme Intelligente de Supervision des Chantiers BTP", 14, 20)
  doc.setFontSize(14)
  doc.text(titre, 14, 35)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-MA")}`, 160, 35)
}

export const pdfService = {
  /**
   * Génère le PDF d'un rapport journalier
   */
  genererRapportJournalier(data: RapportData): void {
    const doc = new jsPDF()
    header(doc, "RAPPORT JOURNALIER DE CHANTIER")

    // Infos générales
    doc.setFontSize(12); doc.setFont("helvetica", "bold")
    doc.text("Informations générales", 14, 50)
    autoTable(doc, {
      startY: 55,
      head: [],
      body: [
        ["Chantier", data.chantier, "N° Rapport", data.numero],
        ["Date", data.date, "Météo", data.meteo],
        ["Effectif", data.effectif.toString(), "Avancement", `${data.avancement}%`],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 35 }, 2: { fontStyle: "bold", cellWidth: 35 } },
    })

    // Travaux
    const finalY = (doc as any).lastAutoTable.finalY + 8
    doc.setFont("helvetica", "bold"); doc.setFontSize(12)
    doc.text("Travaux réalisés", 14, finalY)
    doc.setFont("helvetica", "normal"); doc.setFontSize(10)
    doc.text(doc.splitTextToSize(data.travaux, 180), 14, finalY + 7)

    // Quantités
    if (data.beton || data.acier) {
      autoTable(doc, {
        startY: finalY + 35,
        head: [["Matériau", "Quantité"]],
        body: [
          ...(data.beton ? [["Béton coulé", `${data.beton} m³`]] : []),
          ...(data.acier ? [["Acier posé", `${data.acier} kg`]] : []),
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 64, 175] },
      })
    }

    // Signature
    doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text("ENGIPILOT — Document généré automatiquement", 14, 285)
    doc.text("Page 1/1", 190, 285, { align: "right" })

    doc.save(`${data.numero}-rapport-journalier.pdf`)
  },

  /**
   * Génère le rapport EVM avec graphiques et KPIs
   */
  genererRapportEVM(evm: EVMData): void {
    const doc = new jsPDF()
    header(doc, "RAPPORT KPIs EVM — EARNED VALUE MANAGEMENT")

    // KPIs principaux
    doc.setFontSize(12); doc.setFont("helvetica", "bold")
    doc.text(`Chantier : ${evm.chantier}`, 14, 50)

    autoTable(doc, {
      startY: 56,
      head: [["Indicateur", "Valeur", "Interprétation"]],
      body: [
        ["BAT — Budget à l'achèvement", `${(evm.bat/1000000).toFixed(2)} M MAD`, "Référence"],
        ["VA — Valeur Acquise", `${(evm.va/1000000).toFixed(2)} M MAD`, "Travaux réalisés"],
        ["VP — Valeur Planifiée", `${(evm.vp/1000000).toFixed(2)} M MAD`, "Planning référence"],
        ["CR — Coût Réel", `${(evm.cr/1000000).toFixed(2)} M MAD`, "Dépenses réelles"],
        ["SPI — Schedule Performance", evm.spi.toFixed(3), evm.spi >= 0.95 ? "✓ OK" : evm.spi >= 0.80 ? "⚠ Modéré" : "🔴 Critique"],
        ["CPI — Cost Performance", evm.cpi.toFixed(3), evm.cpi >= 0.95 ? "✓ OK" : evm.cpi >= 0.85 ? "⚠ Modéré" : "🔴 Critique"],
        ["EAC — Estimé à l'achèvement", `${(evm.eac/1000000).toFixed(2)} M MAD`, `${((evm.eac-evm.bat)/evm.bat*100).toFixed(1)}% vs BAT`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 64, 175] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFont("helvetica", "bold")
    doc.text("Interprétation IA :", 14, finalY)
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(evm.interpretation, 180), 14, finalY + 6)

    doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text("ENGIPILOT — Rapport EVM généré automatiquement", 14, 285)
    doc.save(`rapport-evm-${evm.chantier.replace(/\s+/g, "-")}.pdf`)
  },
}
