import { Skeleton } from "@/components/ui/skeleton"

export function CustomerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CustomerOrderCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-col border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="mt-2 flex flex-col items-end gap-2 sm:mt-0">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      {/* Body */}
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

export function CustomerOrdersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CustomerOrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function CustomerWalletSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="mt-8 space-y-3 border-t border-border pt-6">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Virtual Account */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="mb-4 h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CustomerRewardsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Balance */}
        <div className="flex h-64 flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-sm md:col-span-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-12 w-48" />
          </div>
          <div className="mt-8 flex gap-4">
            <Skeleton className="h-16 flex-1 rounded-xl" />
            <Skeleton className="h-16 flex-1 rounded-xl" />
          </div>
        </div>

        {/* How to earn */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-6 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function CustomerSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  )
}

export function CustomerReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="mb-6 flex w-full max-w-md gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] border border-border bg-card p-5 shadow-sm"
          >
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-4 h-6 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CustomerReviewNewSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-md" />
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <Skeleton className="h-64 rounded-[24px]" />
      <Skeleton className="h-96 rounded-[24px]" />
      <Skeleton className="h-14 rounded-md" />
    </div>
  )
}
