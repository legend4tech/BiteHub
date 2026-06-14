import { PageSkeleton } from "@/components/shared/PageSkeleton"

export default function Loading() {
  return (
    <div className="p-6">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted"></div>
        <div className="h-4 w-96 animate-pulse rounded-lg bg-muted"></div>
      </div>
      <PageSkeleton variant="orders-table" count={6} />
    </div>
  )
}
