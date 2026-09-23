import { Skeleton } from "@/components/ui/skeleton"

export function MenuItemGridSkeleton({ count }: { count: number }) {
  const items = Array.from({ length: count })

  const SkeletonCard = () => (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile staggered layout skeleton ── */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:hidden">
        {items.map((_, i) => (
          <div key={`mob-${i}`} className={i % 2 === 0 ? "mt-6" : ""}>
            <SkeletonCard />
          </div>
        ))}
      </div>

      {/* ── Desktop standard grid skeleton ── */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((_, i) => (
          <div key={`desk-${i}`}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    </>
  )
}

export function VendorListSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-3xl border border-border bg-background p-6"
        >
          {/* Logo + arrow/status row */}
          <div className="flex items-start justify-between">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
          {/* Name */}
          <Skeleton className="mt-5 h-6 w-3/4" />
          {/* Tagline */}
          <div className="mt-1.5 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          {/* Footer: location left, item count right */}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function VendorDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Vendor header */}
      <div className="rounded-3xl border border-border bg-card p-8">
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
      {/* Category tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      {/* Menu grid */}
      <MenuItemGridSkeleton count={8} />
    </div>
  )
}

export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-8">
        <Skeleton className="h-6 w-1/3 max-w-[160px]" />
        <Skeleton className="h-10 w-2/3 max-w-[250px]" />
        <Skeleton className="h-4 w-1/2 max-w-[200px]" />
      </div>
      {/* Status tracker */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        <Skeleton className="mb-6 h-5 w-32" />
        <div className="flex items-start">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="relative flex flex-1 flex-col items-center gap-2"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="mt-1 h-2 w-10 sm:w-14" />
            </div>
          ))}
        </div>
        {/* Current status description box skeleton */}
        <Skeleton className="mt-5 h-[76px] w-full rounded-xl" />
      </div>
      {/* Items */}
      <div className="space-y-3 rounded-3xl border border-border bg-card p-5 sm:p-8">
        <Skeleton className="mb-2 h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  )
}

export function MenuCardGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <Skeleton className="h-40 w-full" />
          <div className="space-y-2 px-3.5 pt-3 pb-1">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-14 shrink-0" />
            </div>
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center justify-between px-3.5 pt-2 pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-9 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MenuItemDetailSkeleton() {
  return (
    <div className="space-y-10">
      <Skeleton className="mb-8 h-4 w-32" />
      <div className="grid grid-cols-1 gap-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 md:grid-cols-2 md:gap-14">
        <Skeleton className="aspect-square w-full rounded-2xl md:aspect-[4/5]" />
        <div className="flex flex-col space-y-6">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <div className="flex h-24 w-full items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="mt-auto flex flex-col gap-4 border-t border-border pt-8 sm:flex-row">
            <Skeleton className="h-14 w-full rounded-xl sm:w-40" />
          </div>
        </div>
      </div>
      <div className="mt-20 space-y-6">
        <Skeleton className="h-8 w-48" />
        <MenuCardGridSkeleton count={4} />
      </div>
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <div className="container mx-auto min-h-screen max-w-6xl p-4 py-8 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Skeleton className="size-10 rounded-md" />
        <div>
          <Skeleton className="mb-2 h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid gap-8 align-top lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          {/* Delivery Details */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-7 w-48" />
            <div className="space-y-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          {/* Order Notes */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-7 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
          {/* Payment Method */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-7 w-40" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-7 w-40" />
            <div className="mb-6 space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="mb-6 space-y-4 border-t border-border pt-6">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="mb-6 border-t border-border pt-6">
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export function MenuItemReviewSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export function RatingStatisticsSkeleton() {
  return (
    <div className="mb-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        {/* Left column */}
        <div className="flex shrink-0 flex-col items-center justify-center md:w-1/3 md:border-r md:border-border">
          <Skeleton className="h-16 w-24 rounded-lg" />
          <div className="mt-2 flex gap-1">
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-4 w-32 rounded-full" />
        </div>

        {/* Right column */}
        <div className="flex flex-1 flex-col gap-3 md:pl-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
