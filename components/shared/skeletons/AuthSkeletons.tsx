import { Skeleton } from "@/components/ui/skeleton"

export function AuthSkeleton() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="z-10 w-full max-w-[440px]">
        <div className="mb-8 flex flex-col items-center space-y-4 text-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    </div>
  )
}
