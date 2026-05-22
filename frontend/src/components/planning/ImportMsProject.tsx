"use client"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FileDown, CheckCircle2, AlertTriangle, Loader2, ChevronDown } from "lucide-react"

interface ImportResult {
  message:     string
  importees:   number
  erreurs:     string[]
  projectName: string
}

interface Props {
  projectId: string
}

async function importMsProject(file: File, projectId: string): Promise<ImportResult> {
  const form = new FormData()
  form.append("file", file, file.name)
  const res = await fetch(`/api/projects/${projectId}/import/ms-project`, {
    method: "POST",
    body:   form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? "Erreur import")
  }
  return res.json()
}

export function ImportMsProject({ projectId }: Props) {
  const queryClient  = useQueryClient()
  const [open, setOpen] = useState(false)

  const { mutate, isPending, data, error, reset } = useMutation<ImportResult, Error, File>({
    mutationFn: (file) => importMsProject(file, projectId),
    onSuccess: () => {
      // Invalider le Kanban et le Gantt pour afficher les nouvelles tâches
      queryClient.invalidateQueries({ queryKey: ["tasks",   projectId] })
      queryClient.invalidateQueries({ queryKey: ["gantt",   projectId] })
    },
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    reset()
    mutate(file)
  }

  return (
    <div className="inline-block">
      <label className={`cursor-pointer ${isPending ? "pointer-events-none" : ""}`}>
        <span className={`flex items-center gap-2 border rounded-xl px-4 py-2 text-xs font-semibold transition-all shadow-card
          ${isPending
            ? "bg-muted text-muted-fg border-border"
            : "bg-white hover:bg-muted border-border text-foreground hover:border-primary/40"}`}
        >
          {isPending
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Import en cours…</>
            : <><FileDown className="w-3.5 h-3.5 text-primary" /> Importer MS Project</>}
        </span>
        <input
          type="file"
          accept=".mpp,.mpt,.xml"
          className="hidden"
          onChange={handleFile}
          disabled={isPending}
        />
      </label>

      {/* Résultat */}
      {data && (
        <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-xl text-xs space-y-1 min-w-[260px]">
          <div className="flex items-center gap-2 font-semibold text-success">
            <CheckCircle2 className="w-4 h-4" />
            {data.message}
          </div>
          {data.projectName && (
            <p className="text-muted-fg">Fichier : {data.projectName}</p>
          )}
          {data.erreurs.length > 0 && (
            <details>
              <summary className="flex items-center gap-1 text-warning cursor-pointer font-semibold">
                <ChevronDown className="w-3.5 h-3.5" />
                {data.erreurs.length} avertissement(s)
              </summary>
              <ul className="mt-1 space-y-0.5 pl-4">
                {data.erreurs.map((e, i) => (
                  <li key={i} className="text-muted-fg">{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Erreur globale */}
      {error && (
        <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs flex items-center gap-2 text-danger">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error.message}
        </div>
      )}
    </div>
  )
}
