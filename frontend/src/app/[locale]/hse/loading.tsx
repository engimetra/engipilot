import { KPICardSkeleton, TableRowSkeleton, Skeleton } from "@/components/ui/Skeleton"

export default function HseLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TableRowSkeleton rows={4} />
        <TableRowSkeleton rows={4} />
      </div>
    </div>
  )
}
