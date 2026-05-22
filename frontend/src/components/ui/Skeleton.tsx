import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted", className)} style={style} />
  )
}

/* ── Page-level skeleton presets ── */

export function KPICardSkeleton() {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-2.5 w-full rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={cn("bg-white border border-border rounded-xl p-5 shadow-card space-y-4", height)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {[55, 75, 45, 85, 65, 90, 50, 70].map((h, i) => (
          <div key={i} className="flex-1 bg-muted rounded-t-md animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <Skeleton className="h-3 w-48" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/50 last:border-0">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ cols = 3, count = 6 }: { cols?: number; count?: number }) {
  return (
    <div className={cn("grid gap-4", {
      "grid-cols-2": cols === 2,
      "grid-cols-3": cols === 3,
      "grid-cols-4": cols === 4,
    })}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-border rounded-xl p-5 shadow-card space-y-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <ChartSkeleton height="h-64" />
    </div>
  )
}

export function ErrorMessage({ message }: { message?: string }) {
  return (
    <div className="bg-danger/8 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message ?? "Une erreur est survenue. Veuillez réessayer."}
    </div>
  )
}

const KANBAN_COL_COUNTS = [3, 4, 3, 4] as const

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 h-full overflow-hidden">
      {["A faire", "En cours", "Contrôle", "Terminé"].map((col, colIdx) => (
        <div key={col} className="flex-1 min-w-[240px] flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-7 rounded-full" />
          </div>
          {Array.from({ length: KANBAN_COL_COUNTS[colIdx] }).map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-4 shadow-sm space-y-2.5">
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
