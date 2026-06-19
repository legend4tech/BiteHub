import { PageSkeleton } from "@/components/shared/PageSkeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted"></div>
          <div className="h-4 w-64 animate-pulse rounded-lg bg-muted"></div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-muted"></div>
      </div>
      <PageSkeleton variant="menu-management" count={8} />
    </div>
  )
}
