import { Skeleton } from "@/components/ui/Skeleton"

export default function ChatLoading() {
  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Sidebar conversations */}
      <div className="w-72 flex-shrink-0 bg-white border border-border rounded-xl p-4 space-y-3 overflow-hidden">
        <Skeleton className="h-9 w-full rounded-lg" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
      {/* Chat area */}
      <div className="flex-1 bg-white border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-hidden">
          {[true, false, true, false, true].map((right, i) => (
            <div key={i} className={`flex gap-3 ${right ? "flex-row-reverse" : ""}`}>
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <Skeleton className={`h-12 rounded-2xl ${right ? "w-56" : "w-72"}`} />
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-border">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
