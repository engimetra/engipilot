import { Skeleton } from "@/components/ui/Skeleton"

export default function PlanningLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Gantt skeleton */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
        {/* Header months */}
        <div className="flex border-b border-border bg-muted/30">
          <Skeleton className="h-10 w-40 m-2 rounded" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 flex-1 m-2 rounded" />
          ))}
        </div>
        {/* Gantt rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-border/50 last:border-0 px-4 py-3 gap-4">
            <Skeleton className="h-4 w-36 flex-shrink-0" />
            <div className="flex-1 relative h-7">
              <Skeleton
                className="h-6 rounded-lg absolute"
                style={{
                  left: `${10 + i * 5}%`,
                  width: `${20 + (i % 3) * 15}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
