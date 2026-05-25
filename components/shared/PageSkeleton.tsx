import { Skeleton } from "@/components/ui/skeleton";

// ─── PageSkeleton ─────────────────────────────────────────────────────────────
// A reusable skeleton component. Pass a variant to imitate the matching page
// layout. Optionally pass `count` to repeat card skeletons.
//
// Usage:
//   <PageSkeleton variant="menu-item-grid" count={6} />
//   <PageSkeleton variant="vendor-list" />
//   <PageSkeleton variant="order-detail" />
//   <PageSkeleton variant="dashboard" />
//   <PageSkeleton variant="orders-table" count={5} />

type SkeletonVariant =
  | "menu-item-grid"
  | "vendor-list"
  | "vendor-detail"
  | "order-detail"
  | "dashboard"
  | "orders-table"
  | "menu-management"
  | "menu-card-grid"
  | "menu-item-edit"
  | "auth"
  | "payment-details";

interface PageSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
}

export function PageSkeleton({ variant, count = 6 }: PageSkeletonProps) {
  switch (variant) {
    case "menu-item-grid":
      return <MenuItemGridSkeleton count={count} />;
    case "vendor-list":
      return <VendorListSkeleton count={count} />;
    case "vendor-detail":
      return <VendorDetailSkeleton />;
    case "order-detail":
      return <OrderDetailSkeleton />;
    case "dashboard":
      return <DashboardSkeleton />;
    case "orders-table":
      return <OrdersTableSkeleton count={count} />;
    case "menu-management":
      return <MenuManagementSkeleton count={count} />;
    case "menu-card-grid":
      return <MenuCardGridSkeleton count={count} />;
    case "menu-item-edit":
      return <MenuItemEditSkeleton />;
    case "auth":
      return <AuthSkeleton />;
    case "payment-details":
      return <PaymentDetailsSkeleton />;
    default:
      return null;
  }
}

// ─── Variants ─────────────────────────────────────────────────────────────────

function MenuItemGridSkeleton({ count }: { count: number }) {
  const items = Array.from({ length: count });
  
  const SkeletonCard = () => (
    <div className="rounded-3xl bg-card border border-border overflow-hidden flex flex-col h-full">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center justify-between pt-2 mt-auto">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );

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
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((_, i) => (
          <div key={`desk-${i}`}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    </>
  );
}

function VendorListSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-background border border-border p-6 flex flex-col">
          {/* Logo + arrow/status row */}
          <div className="flex items-start justify-between">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
          {/* Name */}
          <Skeleton className="h-6 w-3/4 mt-5" />
          {/* Tagline */}
          <div className="space-y-1.5 mt-1.5 flex-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          {/* Footer: location left, item count right */}
          <div className="flex items-center justify-between pt-4 mt-5 border-t border-border">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VendorDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Vendor header */}
      <div className="rounded-3xl bg-card border border-border p-8">
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
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-3xl bg-card border border-border p-5 sm:p-8 space-y-4">
        <Skeleton className="h-6 w-1/3 max-w-[160px]" />
        <Skeleton className="h-10 w-2/3 max-w-[250px]" />
        <Skeleton className="h-4 w-1/2 max-w-[200px]" />
      </div>
      {/* Status tracker */}
      <div className="rounded-3xl bg-card border border-border p-5 sm:p-8">
        <Skeleton className="h-5 w-32 mb-6" />
        <div className="flex items-start">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="relative flex flex-1 flex-col items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-2 w-10 sm:w-14 mt-1" />
            </div>
          ))}
        </div>
        {/* Current status description box skeleton */}
        <Skeleton className="h-[76px] w-full rounded-xl mt-5" />
      </div>
      {/* Items */}
      <div className="rounded-3xl bg-card border border-border p-5 sm:p-8 space-y-3">
        <Skeleton className="h-5 w-24 mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <div className="flex justify-between pt-3 border-t border-border">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card p-5" />
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
  );
}

function OrdersTableSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5">
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
              <Skeleton className="size-4 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-1">
              <Skeleton className="size-4 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
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
            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2">
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
  );
}

function MenuManagementSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4">
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
  );
}

function MenuCardGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <div className="px-3.5 pt-3 pb-1 space-y-2">
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
  );
}

function MenuItemEditSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Form card */}
      <div className="rounded-3xl bg-card border border-border p-6 max-w-2xl space-y-6">
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
        <div className="flex gap-3 justify-end pt-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12 relative overflow-hidden">
      <div className="w-full max-w-[440px] z-10">
        <div className="flex flex-col items-center mb-8 text-center space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    </div>
  );
}

function PaymentDetailsSkeleton() {
  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border bg-muted/10 p-5">
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
