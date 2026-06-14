import { PageSkeleton } from "@/components/shared/PageSkeleton"

export default function Loading() {
  return (
    <div className="p-6">
      <PageSkeleton variant="vendor-settings" />
    </div>
  )
}
