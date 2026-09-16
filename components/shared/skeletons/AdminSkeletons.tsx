import { Skeleton } from "@/components/ui/skeleton"

export function AdminListSkeleton({ count }: { count: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminOrdersSkeleton({ count }: { count: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4 px-6 py-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function AdminOverviewStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="col-span-1 h-64 rounded-2xl md:col-span-2" />
        <Skeleton className="col-span-1 h-64 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="col-span-1 h-96 rounded-2xl lg:col-span-2" />
        <Skeleton className="col-span-1 h-96 rounded-2xl lg:col-span-1" />
      </div>
    </>
  )
}

export function AdminAnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      {/* 5 KPI Cards (matches grid-cols-2 xl:grid-cols-5) */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <Skeleton className="h-[380px] w-full rounded-3xl" />

      {/* Day-of-Week + Payment split row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Skeleton className="h-[340px] rounded-3xl lg:col-span-3" />
        <Skeleton className="h-[340px] rounded-3xl lg:col-span-2" />
      </div>
    </div>
  )
}

export function AdminFeedbackSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
  )
}
