import { Skeleton } from "@/components/ui/skeleton"

export function CustomerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-48 max-w-full sm:h-8 sm:w-64" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
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

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Milestones Skeleton */}
        <div className="space-y-6 lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-primary/5 p-4 sm:px-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="size-12 shrink-0 rounded-xl sm:size-14" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36 sm:w-44" />
                  <Skeleton className="h-3.5 w-48 max-w-full" />
                </div>
              </div>
              <Skeleton className="hidden h-8 w-24 shrink-0 rounded-md sm:block" />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <Skeleton className="h-20 w-full rounded-xl sm:h-24" />
              <Skeleton className="h-20 w-full rounded-xl sm:h-24" />
            </div>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 p-4 ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg sm:size-10" />
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-28 sm:w-32" />
                    <Skeleton className="h-3 w-20 sm:w-28" />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CustomerOrderCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border bg-muted/10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl sm:size-12" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-36 sm:w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="mt-3 flex gap-3 border-t border-border/40 pt-2.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </div>
      {/* Body */}
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      {/* Footer */}
      <div className="border-t border-border bg-muted/5 p-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-3 sm:justify-end sm:border-0 sm:pt-0">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
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
        <Skeleton className="h-4 w-full max-w-80" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-14 w-full rounded-lg" />
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
        <CustomerTransactionListSkeleton count={3} />
      </div>
    </div>
  )
}

export function CustomerRewardsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Balance */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-4 w-60 max-w-full" />
          </div>
          <div className="mt-6 flex gap-3 sm:gap-4">
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
        <Skeleton className="h-6 w-40" />
        <CustomerTransactionListSkeleton count={3} />
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

export function CustomerTransactionListSkeleton({
  count = 6,
}: {
  count?: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${
            i !== 0 ? "border-t border-border" : ""
          }`}
        >
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <Skeleton className="size-12 shrink-0 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 sm:w-56" />
              <Skeleton className="h-3 w-48 sm:w-72" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
