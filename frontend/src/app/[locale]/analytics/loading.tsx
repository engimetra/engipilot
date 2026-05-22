import { ChartSkeleton, KPICardSkeleton, Skeleton } from "@/components/ui/Skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ChartSkeleton height="h-80" />
        <ChartSkeleton height="h-80" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ChartSkeleton height="h-64" />
        <ChartSkeleton height="h-64" />
        <ChartSkeleton height="h-64" />
      </div>
    </div>
  )
}
