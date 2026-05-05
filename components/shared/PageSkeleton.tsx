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
  | "menu-management";

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
    default:
      return null;
  }
}

// ─── Variants ─────────────────────────────────────────────────────────────────

function MenuItemGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-card border border-border overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VendorListSkeleton({ count }: { count: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-background border border-border p-6 space-y-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-border">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-14" />
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
      <div className="rounded-3xl bg-card border border-border p-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Status tracker */}
      <div className="rounded-3xl bg-card border border-border p-8">
        <Skeleton className="h-5 w-32 mb-6" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
      {/* Items */}
      <div className="rounded-3xl bg-card border border-border p-8 space-y-3">
        <Skeleton className="h-5 w-24 mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Recent orders */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <OrdersTableSkeleton count={4} />
      </div>
    </div>
  );
}

function OrdersTableSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 px-2">
        {["Order ID", "Customer", "Items", "Status", "Time"].map((h) => (
          <Skeleton key={h} className="h-3 w-full" />
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4 rounded-xl bg-muted/40 px-2 py-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-full" />
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
