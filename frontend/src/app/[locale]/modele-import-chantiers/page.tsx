"use client"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"

const COLUMNS = [
  { key: "code_chantier",    label: "Code Chantier",     required: true,  type: "Texte",   example: "CH-2024-001",     desc: "Identifiant unique du chantier" },
  { key: "nom_chantier",     label: "Nom Chantier",      required: true,  type: "Texte",   example: "Résidence Atlas", desc: "Nom complet du projet" },
  { key: "client",           label: "Client",            required: true,  type: "Texte",   example: "Groupe Alliances", desc: "Nom du maître d'ouvrage" },
  { key: "type_projet",      label: "Type Projet",       required: true,  type: "Liste",   example: "Résidentiel",     desc: "Résidentiel / Industriel / Infrastructure / Tertiaire" },
  { key: "ville",            label: "Ville",             required: true,  type: "Texte",   example: "Casablanca",      desc: "Ville du chantier" },
  { key: "region",           label: "Région",            required: false, type: "Texte",   example: "Grand Casablanca", desc: "Région administrative" },
  { key: "date_debut",       label: "Date Début",        required: true,  type: "Date",    example: "01/01/2024",      desc: "Format JJ/MM/AAAA" },
  { key: "date_fin_prevue",  label: "Date Fin Prévue",   required: true,  type: "Date",    example: "31/12/2025",      desc: "Format JJ/MM/AAAA" },
  { key: "budget_initial",   label: "Budget Initial (MAD)", required: true, type: "Nombre", example: "15000000",      desc: "Budget en dirhams (sans espaces)" },
  { key: "avancement_pct",   label: "Avancement %",      required: false, type: "Nombre", example: "35",              desc: "Pourcentage d'avancement (0-100)" },
  { key: "chef_projet",      label: "Chef de Projet",    required: true,  type: "Texte",   example: "Karim Benali",    desc: "Nom du chef de projet responsable" },
  { key: "chef_chantier",    label: "Chef de Chantier",  required: false, type: "Texte",   example: "Ahmed Khalil",    desc: "Nom du chef de chantier terrain" },
  { key: "statut",           label: "Statut",            required: true,  type: "Liste",   example: "En cours",        desc: "Planifié / En cours / En pause / Terminé" },
  { key: "spi",              label: "SPI",               required: false, type: "Nombre", example: "0.92",            desc: "Schedule Performance Index (optionnel)" },
  { key: "cpi",              label: "CPI",               required: false, type: "Nombre", example: "0.88",            desc: "Cost Performance Index (optionnel)" },
  { key: "description",      label: "Description",       required: false, type: "Texte",   example: "Construction R+7 avec sous-sol", desc: "Description libre du projet" },
]

const SAMPLE_ROWS = [
  ["CH-2024-001", "Résidence Atlas", "Groupe Alliances", "Résidentiel", "Casablanca", "Grand Casablanca", "01/03/2024", "31/12/2025", "15000000", "35", "Karim Benali", "Ahmed Khalil", "En cours", "0.92", "0.88", "Construction R+7 avec parking sous-sol"],
  ["CH-2024-002", "Usine Bouskoura", "MANAGEM", "Industriel", "Bouskoura", "Grand Casablanca", "15/01/2024", "30/06/2025", "42000000", "58", "Sara Idrissi", "Mohamed Tazi", "En cours", "0.72", "0.95", "Unité de production 5000m²"],
  ["CH-2024-003", "Station Énergie Mohammedia", "ONEE", "Infrastructure", "Mohammedia", "Grand Casablanca", "01/06/2024", "31/05/2026", "210000000", "12", "Youssef Amrani", "", "Planifié", "", "", "Station haute tension 225kV"],
]

function downloadCSV() {
  const headers = COLUMNS.map(c => c.label)
  const sampleRows = SAMPLE_ROWS

  const csvLines = [
    headers.join(";"),
    ...sampleRows.map(r => r.map(v => `"${v}"`).join(";")),
  ]

  const blob = new Blob(["﻿" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "modele-import-chantiers-engipilot.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function ModeleImportChantiers() {
  const router = useRouter()
  const locale = useLocale()

  return (
    <div className="space-y-6 max-w-6xl">
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 15mm; size: A3 landscape; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push(`/${locale}/onboarding`)}
              className="print:hidden text-xs text-muted-fg hover:text-foreground transition-colors"
            >
              ← Retour à l'onboarding
            </button>
          </div>
          <h1 className="text-xl font-bold">📊 Modèle import chantiers</h1>
          <p className="text-sm text-muted-fg mt-0.5">
            Template Excel / CSV pour importer vos chantiers dans ENGIPILOT
          </p>
        </div>
        <div className="print:hidden flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-muted text-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-muted/60 transition-colors border"
          >
            🖨️ Imprimer
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ⬇️ Télécharger CSV
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        {[
          { step: "1", titre: "Téléchargez le CSV", desc: "Cliquez sur « Télécharger CSV » pour obtenir le modèle avec des données d'exemple.", color: "blue" },
          { step: "2", titre: "Remplissez vos données", desc: "Ouvrez le fichier dans Excel ou Google Sheets. Remplacez les exemples par vos chantiers réels.", color: "yellow" },
          { step: "3", titre: "Importez dans ENGIPILOT", desc: "Allez dans Chantiers → Importer → sélectionnez votre fichier CSV ou Excel.", color: "green" },
        ].map(s => (
          <div key={s.step} className={`bg-card border rounded-xl p-4 border-l-4 ${
            s.color === "blue" ? "border-l-blue-500" : s.color === "yellow" ? "border-l-yellow-500" : "border-l-green-500"
          }`}>
            <div className={`text-xs font-bold mb-1 ${
              s.color === "blue" ? "text-blue-400" : s.color === "yellow" ? "text-yellow-400" : "text-green-400"
            }`}>ÉTAPE {s.step}</div>
            <p className="font-bold text-sm mb-1">{s.titre}</p>
            <p className="text-xs text-muted-fg">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Colonnes */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-sm">Colonnes du template</h2>
          <div className="flex gap-3 text-xs text-muted-fg">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Obligatoire</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-fg inline-block" />Optionnel</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-fg">#</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-fg">Colonne</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-fg">Type</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-fg">Exemple</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-fg">Description</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((col, i) => (
                <tr key={col.key} className={`border-t border-border/50 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-4 py-2.5 text-muted-fg">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-semibold">{col.label}</span>
                    {col.required && <span className="ml-1.5 text-red-400 font-bold">*</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                      col.type === "Date" ? "bg-blue-500/15 text-blue-400" :
                      col.type === "Nombre" ? "bg-yellow-500/15 text-yellow-400" :
                      col.type === "Liste" ? "bg-purple-500/15 text-purple-400" :
                      "bg-muted text-muted-fg"
                    }`}>{col.type}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-green-400">{col.example}</td>
                  <td className="px-4 py-2.5 text-muted-fg">{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aperçu données exemple */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-sm">Aperçu — données d'exemple (3 lignes)</h2>
          <p className="text-xs text-muted-fg mt-0.5">Ces données sont incluses dans le CSV téléchargeable à remplacer par vos chantiers réels</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                {COLUMNS.slice(0, 9).map(c => (
                  <th key={c.key} className="text-left px-3 py-2.5 font-semibold text-muted-fg whitespace-nowrap">{c.label}</th>
                ))}
                <th className="text-left px-3 py-2.5 font-semibold text-muted-fg">...</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((row, i) => (
                <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
                  {row.slice(0, 9).map((cell, j) => (
                    <td key={j} className="px-3 py-2.5 whitespace-nowrap font-mono">{cell || <span className="text-muted-fg italic">vide</span>}</td>
                  ))}
                  <td className="px-3 py-2.5 text-muted-fg">...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Valeurs acceptées pour les listes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-bold text-sm mb-3">Valeurs acceptées — Type Projet</h3>
          <div className="flex flex-wrap gap-2">
            {["Résidentiel", "Industriel", "Infrastructure", "Tertiaire", "Commercial", "Éducatif", "Hospitalier", "Touristique"].map(v => (
              <span key={v} className="bg-purple-500/15 text-purple-300 text-xs px-2 py-1 rounded font-mono">{v}</span>
            ))}
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-bold text-sm mb-3">Valeurs acceptées — Statut</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { v: "Planifié", color: "bg-blue-500/15 text-blue-300" },
              { v: "En cours", color: "bg-green-500/15 text-green-300" },
              { v: "En pause", color: "bg-yellow-500/15 text-yellow-300" },
              { v: "Terminé", color: "bg-muted text-muted-fg" },
              { v: "Annulé", color: "bg-red-500/15 text-red-300" },
            ].map(({ v, color }) => (
              <span key={v} className={`${color} text-xs px-2 py-1 rounded font-mono`}>{v}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-muted/40 rounded-xl p-4 text-xs text-muted-fg flex gap-3 items-start">
        <span className="text-lg">💡</span>
        <div>
          <span className="font-semibold text-foreground">Conseil :</span> Le séparateur CSV utilisé est le point-virgule (;) compatible Excel France / Maroc.
          Pour Google Sheets : Fichier → Importer → Détecter automatiquement. Les colonnes marquées <span className="text-red-400 font-bold">*</span> sont obligatoires — les lignes incomplètes seront rejetées lors de l'import.
        </div>
      </div>
    </div>
  )
}
