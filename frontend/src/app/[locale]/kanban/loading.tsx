import { KanbanSkeleton, Skeleton } from "@/components/ui/Skeleton"

export default function KanbanLoading() {
  return (
    <div className="flex flex-col gap-5" style={{ height: "calc(100vh - 56px - 48px)" }}>
      {/* Header skeleton */}
      <div className="flex-shrink-0 bg-white border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex-shrink-0 flex gap-2">
        <Skeleton className="h-9 w-56 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* Kanban board skeleton */}
      <div className="flex-1 min-h-0">
        <KanbanSkeleton />
      </div>
    </div>
  )
}
