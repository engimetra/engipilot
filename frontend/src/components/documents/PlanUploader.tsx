"use client"
import { useState, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Upload, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react"

interface UploadResult {
  id: string
  name: string
  url: string
}

interface Props {
  projectId: string
  onUploaded?: (doc: UploadResult) => void
}

const ALLOWED_EXT = ["pdf", "dwg", "dxf", "png", "jpg", "jpeg", "xlsx"]
const MAX_BYTES   = 50 * 1024 * 1024

async function uploadFile(file: File, projectId: string): Promise<UploadResult> {
  const form = new FormData()
  form.append("file",      file)
  form.append("projectId", projectId)
  const res = await fetch("/api/documents", { method: "POST", body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? "Erreur upload")
  }
  return res.json()
}

export function PlanUploader({ projectId, onUploaded }: Props) {
  const queryClient = useQueryClient()
  const [dragOver,  setDragOver]  = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { mutate, isPending, isSuccess, reset } = useMutation({
    mutationFn: (file: File) => uploadFile(file, projectId),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] })
      onUploaded?.(doc)
      setTimeout(reset, 3000)
    },
  })

  function validate(file: File): string | null {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_EXT.includes(ext)) return `Extension non supportée: .${ext}`
    if (file.size > MAX_BYTES) return `Fichier trop lourd (max 50 Mo)`
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setLocalError(err); setTimeout(() => setLocalError(null), 4000); return }
    setLocalError(null)
    mutate(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(handleFile)
  }, [projectId])

  return (
    <div className="space-y-3">
      {/* Zone drop */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer select-none
          ${dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : isSuccess
              ? "border-success bg-success/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        {isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-primary">Upload en cours…</p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <p className="text-sm font-semibold text-success">Fichier uploadé avec succès</p>
          </div>
        ) : (
          <>
            <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${dragOver ? "text-primary" : "text-muted-fg"}`} />
            <p className="text-sm font-semibold text-foreground">
              Glisser-déposer vos plans ici
            </p>
            <p className="text-xs text-muted-fg mt-1">
              PDF · DWG · DXF · PNG · JPG · XLSX — max 50 Mo
            </p>
            <label className="mt-4 inline-block cursor-pointer">
              <span className="bg-primary/10 border border-primary/20 text-primary rounded-lg px-4 py-2 text-xs font-semibold hover:bg-primary/20 transition">
                Parcourir les fichiers
              </span>
              <input
                type="file"
                accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.xlsx"
                multiple
                className="hidden"
                onChange={e => Array.from(e.target.files ?? []).forEach(handleFile)}
                disabled={isPending}
              />
            </label>
          </>
        )}
      </div>

      {/* Erreur */}
      {localError && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <p className="text-xs text-danger flex-1">{localError}</p>
          <button onClick={() => setLocalError(null)} className="text-danger/60 hover:text-danger">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
