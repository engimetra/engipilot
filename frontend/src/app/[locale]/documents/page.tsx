"use client"
import { useState, useRef, useCallback, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Upload, Download, Eye, FileText, Image, Archive, File,
  X, Clock, GitBranch, CheckCircle2, AlertCircle, Search,
  ChevronDown, Trash2, MoreVertical,
} from "lucide-react"

type Doc = {
  id: string
  nom: string
  type: string
  taille: string
  tailleBytes: number
  version: string
  date: string
  icon: string
  category: string
  blob?: string
  uploader: string
  versions: { v: string; date: string; uploader: string; taille: string }[]
}

// ── Types API ──────────────────────────────────────────────────────────────────
interface ApiDoc {
  id: string
  name: string
  type: string
  mimeType: string | null
  size: number | null
  url: string
  version: string
  createdAt: string
  uploadedBy: { firstName: string; lastName: string } | null
}

function apiDocToUi(d: ApiDoc): Doc {
  const ext  = d.name.split(".").pop()?.toUpperCase() ?? d.type
  const type = ["PDF","DWG","DXF","XLSX","ZIP","JPG","JPEG","PNG"].find(e => d.name.toUpperCase().endsWith(e)) ?? ext
  return {
    id:          d.id,
    nom:         d.name.replace(/\.[^.]+$/, ""),
    type,
    taille:      d.size != null ? formatBytes(d.size) : "—",
    tailleBytes: d.size ?? 0,
    version:     d.version,
    date:        new Date(d.createdAt).toLocaleDateString("fr-FR"),
    icon:        fileIcon(type),
    category:    fileCategory(type),
    blob:        d.url,
    uploader:    d.uploadedBy ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : "—",
    versions:    [{ v: d.version, date: new Date(d.createdAt).toLocaleDateString("fr-FR"), uploader: d.uploadedBy ? `${d.uploadedBy.firstName[0]}. ${d.uploadedBy.lastName}` : "—", taille: d.size != null ? formatBytes(d.size) : "—" }],
  }
}

const ACCEPT = ".pdf,.dwg,.dxf,.xlsx,.zip,.jpg,.jpeg,.png"
const MAX_BYTES = 50 * 1024 * 1024
const CATEGORIES = ["Tous","plans","rapports","photos","reglementaire","contrats"]
const LABELS: Record<string,string> = { plans:"Plans", rapports:"Rapports", photos:"Photos", reglementaire:"Réglementaire", contrats:"Contrats" }

function formatBytes(b: number) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB"
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB"
  if (b >= 1e3) return (b / 1e3).toFixed(0) + " KB"
  return b + " B"
}

function fileIcon(type: string) {
  if (["JPG","JPEG","PNG"].includes(type)) return "🖼️"
  if (type === "PDF") return "📄"
  if (type === "XLSX") return "📊"
  if (type === "ZIP") return "📦"
  if (["DWG","DXF"].includes(type)) return "📐"
  return "📁"
}

function fileCategory(type: string) {
  if (["JPG","JPEG","PNG"].includes(type)) return "photos"
  if (type === "PDF") return "rapports"
  if (type === "XLSX") return "plans"
  if (type === "ZIP") return "photos"
  return "plans"
}

const TYPE_EXT: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/zip": "ZIP", "application/x-zip-compressed": "ZIP",
  "image/jpeg": "JPG", "image/png": "PNG",
}

export default function DocumentsPage() {
  const queryClient = useQueryClient()
  const [cat,      setCat]      = useState("Tous")
  const [search,   setSearch]   = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [errors,   setErrors]   = useState<string[]>([])
  const [previewDoc,  setPreviewDoc]  = useState<Doc | null>(null)
  const [versionsDoc, setVersionsDoc] = useState<Doc | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Fetch depuis l'API ────────────────────────────────────────────────────
  const { data: apiDocs = [], isLoading } = useQuery<ApiDoc[]>({
    queryKey: ["documents"],
    queryFn:  () => fetch("/api/documents").then(r => r.json()),
  })

  const docs: Doc[] = apiDocs.map(apiDocToUi)

  // ── Upload via API → MinIO + Prisma ───────────────────────────────────────
  const { mutateAsync: uploadDoc, isPending: uploading_ } = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/documents", { method: "POST", body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Erreur upload")
      }
      return res.json() as Promise<ApiDoc>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  })

  const { mutate: deleteDoc_ } = useMutation({
    mutationFn: (id: string) => fetch(`/api/documents?id=${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  })

  const uploading = uploading_ ? ["pending"] : []

  const filtered = docs.filter(d =>
    (cat === "Tous" || d.category === cat) &&
    (d.nom.toLowerCase().includes(search.toLowerCase()) || d.type.includes(search.toUpperCase()))
  )

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files)
    const newErrors: string[] = []

    for (const file of list) {
      if (file.size > MAX_BYTES) {
        newErrors.push(`${file.name} dépasse 50 Mo (${formatBytes(file.size)})`)
        continue
      }
      const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE"
      const allowed = ["PDF","DWG","DXF","XLSX","ZIP","JPG","JPEG","PNG"]
      if (!allowed.includes(ext)) {
        newErrors.push(`${file.name} : format non supporté`)
        continue
      }
      try {
        await uploadDoc(file)
      } catch (e) {
        newErrors.push(`${file.name} : ${(e as Error).message}`)
      }
    }

    if (newErrors.length) {
      setErrors(newErrors)
      setTimeout(() => setErrors([]), 5000)
    }
  }, [uploadDoc])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files)
    e.target.value = ""
  }

  const downloadDoc = (doc: Doc) => {
    if (doc.blob) {
      const a = document.createElement("a")
      a.href = doc.blob
      a.download = `${doc.nom}.${doc.type.toLowerCase()}`
      a.click()
    }
  }

  const deleteDoc = (id: string) => {
    deleteDoc_(id)
    if (previewDoc?.id === id)  setPreviewDoc(null)
    if (versionsDoc?.id === id) setVersionsDoc(null)
  }

  return (
    <div className="space-y-5 page-enter">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gestion Documents</h1>
          <p className="text-sm text-muted-fg mt-0.5">{docs.length} fichiers · Upload · Versions · Historique</p>
        </div>
        <button className="btn-primary" onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4" strokeWidth={2.5} />
          Uploader
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={onInputChange}
      />

      {/* Erreurs */}
      {errors.length > 0 && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {errors.map((e, i) => <p key={i} className="text-xs text-danger">{e}</p>)}
          </div>
          <button onClick={() => setErrors([])} className="text-danger/60 hover:text-danger">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Zone drag-and-drop */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer select-none
          ${dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${dragOver ? "text-primary" : "text-muted-fg"}`} />
        <p className="text-sm font-semibold text-foreground">
          {dragOver ? "Relâchez pour uploader" : "Glisser-déposer vos fichiers ici"}
        </p>
        <p className="text-xs text-muted-fg mt-1">PDF · DWG · DXF · XLSX · ZIP · JPG · PNG — max 50 Mo</p>
        <p className="text-xs text-primary mt-2 font-medium">ou cliquez pour parcourir</p>
      </div>

      {/* Upload en cours */}
      {uploading.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-primary font-medium">
            Upload en cours ({uploading.length} fichier{uploading.length > 1 ? "s" : ""})…
          </p>
        </div>
      )}

      {/* Filtres + Recherche */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2 flex-1 max-w-xs shadow-card">
          <Search className="w-4 h-4 text-muted-fg flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document..."
            className="bg-transparent text-sm outline-none flex-1 min-w-0 placeholder:text-muted-fg"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-fg hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                ${cat === c ? "bg-primary text-white" : "bg-white border border-border text-muted-fg hover:text-foreground shadow-card"}`}
            >
              {c === "Tous" ? `Tous (${docs.length})` : `${LABELS[c]} (${docs.filter(d => d.category === c).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Grille documents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(doc => (
          <div
            key={doc.id}
            className="bg-white border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer relative"
          >
            {/* Menu contextuel */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); deleteDoc(doc.id) }}
                className="p-1 rounded-lg hover:bg-danger/10 text-muted-fg hover:text-danger transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Icône + badge type */}
            <div className="flex flex-col items-center mb-3" onClick={() => setPreviewDoc(doc)}>
              <span className="text-3xl mb-2">{doc.icon}</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-foreground">{doc.type}</span>
            </div>

            {/* Infos */}
            <div onClick={() => setPreviewDoc(doc)}>
              <p className="text-sm font-semibold text-foreground text-center leading-tight line-clamp-2">{doc.nom}</p>
              <p className="text-xs text-muted-fg text-center mt-1">{doc.taille}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-xs text-primary font-semibold">{doc.version}</span>
                <span className="text-muted-fg text-xs">·</span>
                <span className="text-xs text-muted-fg">{doc.date.slice(0, 5)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
              <button
                onClick={e => { e.stopPropagation(); setPreviewDoc(doc) }}
                className="flex items-center gap-1 bg-muted border border-border px-2.5 py-1.5 rounded-lg text-xs font-medium hover:border-primary hover:text-primary transition-colors"
              >
                <Eye className="w-3 h-3" />Voir
              </button>
              <button
                onClick={e => { e.stopPropagation(); downloadDoc(doc) }}
                className="flex items-center gap-1 bg-muted border border-border px-2.5 py-1.5 rounded-lg text-xs font-medium hover:border-success hover:text-success transition-colors"
              >
                <Download className="w-3 h-3" />DL
              </button>
              <button
                onClick={e => { e.stopPropagation(); setVersionsDoc(doc) }}
                className="flex items-center gap-1 bg-muted border border-border px-2.5 py-1.5 rounded-lg text-xs font-medium hover:border-warning hover:text-warning transition-colors"
                title="Versions"
              >
                <GitBranch className="w-3 h-3" />{doc.versions.length}
              </button>
            </div>
          </div>
        ))}

        {/* Carte upload rapide */}
        <div
          className="bg-white border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-6 h-6 text-muted-fg" />
          <p className="text-xs text-muted-fg font-medium">Nouveau document</p>
        </div>
      </div>

      {filtered.length === 0 && uploading.length === 0 && (
        <div className="text-center py-12 text-muted-fg">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucun document trouvé</p>
        </div>
      )}

      {/* ── MODAL PRÉVISUALISATION ── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setPreviewDoc(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{previewDoc.icon}</span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">{previewDoc.nom}</h2>
                  <p className="text-xs text-muted-fg">{previewDoc.type} · {previewDoc.taille} · {previewDoc.version}</p>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* Prévisualisation image si dispo */}
              {previewDoc.blob && ["JPG","JPEG","PNG"].includes(previewDoc.type) ? (
                <img src={previewDoc.blob} alt={previewDoc.nom} className="w-full rounded-xl border border-border object-contain max-h-64" />
              ) : (
                <div className="bg-muted rounded-xl p-8 flex flex-col items-center gap-3">
                  <span className="text-5xl">{previewDoc.icon}</span>
                  <p className="text-sm text-muted-fg">Prévisualisation non disponible pour ce type de fichier</p>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label:"Type", value: previewDoc.type },
                  { label:"Taille", value: previewDoc.taille },
                  { label:"Version", value: previewDoc.version },
                  { label:"Ajouté le", value: previewDoc.date },
                  { label:"Uploader", value: previewDoc.uploader },
                  { label:"Catégorie", value: LABELS[previewDoc.category] ?? previewDoc.category },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-fg">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
              <button
                onClick={() => downloadDoc(previewDoc)}
                className="btn-primary flex-1 justify-center"
              >
                <Download className="w-4 h-4" /> Télécharger
              </button>
              <button
                onClick={() => { setPreviewDoc(null); setVersionsDoc(previewDoc) }}
                className="flex items-center gap-2 justify-center flex-1 px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground"
              >
                <GitBranch className="w-4 h-4" /> Versions ({previewDoc.versions.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VERSIONS ── */}
      {versionsDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setVersionsDoc(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" /> Historique des versions
                </h2>
                <p className="text-xs text-muted-fg mt-0.5">{versionsDoc.nom}</p>
              </div>
              <button onClick={() => setVersionsDoc(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
              {versionsDoc.versions.map((v, i) => (
                <div key={v.v} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors
                  ${i === 0 ? "bg-primary/5 border-primary/20" : "border-border bg-muted/20"}`}>
                  <div className={`mt-0.5 flex-shrink-0 ${i === 0 ? "text-primary" : "text-muted-fg"}`}>
                    {i === 0 ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${i === 0 ? "text-primary" : "text-foreground"}`}>{v.v}</span>
                      {i === 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">Actuelle</span>}
                    </div>
                    <p className="text-xs text-muted-fg mt-0.5">{v.date} · {v.uploader} · {v.taille}</p>
                  </div>
                  <button
                    onClick={() => downloadDoc(versionsDoc)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-fg hover:text-success transition-colors"
                    title="Télécharger cette version"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
              <button
                onClick={() => inputRef.current?.click()}
                className="btn-primary w-full justify-center"
              >
                <Upload className="w-4 h-4" /> Uploader nouvelle version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
