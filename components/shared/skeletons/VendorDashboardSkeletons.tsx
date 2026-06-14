import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border bg-card p-5"
          />
        ))}
      </div>
      {/* Recent orders */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="p-5">
          <OrdersTableSkeleton count={3} />
        </div>
      </div>
    </div>
  )
}

export function OrdersTableSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5"
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/50 pb-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          {/* Customer Info */}
          <div className="mb-4 space-y-3 rounded-xl bg-muted/30 p-3">
            <div className="flex items-start gap-2.5">
              <Skeleton className="size-4 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-1">
              <Skeleton className="size-4 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
          {/* Items */}
          <div className="mb-4 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2 rounded-xl border border-border/60 bg-card p-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
          {/* Footer Actions */}
          <div className="mt-auto space-y-3 border-t border-border/50 pt-4">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MenuManagementSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-border p-4"
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-6 w-10 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function MenuItemEditSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Form card */}
      <div className="max-w-2xl space-y-6 rounded-3xl border border-border bg-card p-6">
        {/* Image upload area */}
        <Skeleton className="h-40 w-full rounded-2xl" />

        {/* Name + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>

        {/* Price + Prep time row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Availability toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function PaymentDetailsSkeleton() {
  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border bg-muted/10 p-5">
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function VendorSettingsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-12 w-full max-w-md rounded-lg" />
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
          <Skeleton className="mt-6 h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
