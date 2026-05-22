import { KPICardSkeleton, ChartSkeleton, Skeleton } from "@/components/ui/Skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse-once">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <ChartSkeleton height="h-72" />
        <ChartSkeleton height="h-72" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <ChartSkeleton height="h-56" />
        <ChartSkeleton height="h-56" />
        <ChartSkeleton height="h-56" />
      </div>
    </div>
  )
}
