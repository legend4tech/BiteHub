"use client"

import { useEffect, ReactNode } from "react"
import { useInView } from "react-intersection-observer"
import { Loader2 } from "lucide-react"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import type { ComponentProps } from "react"

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  loadingContent?: ReactNode
  loadingText?: string
  endText?: string
  skeletonVariant?: ComponentProps<typeof PageSkeleton>["variant"]
  skeletonCount?: number
}

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadingContent,
  loadingText = "Loading more...",
  endText = "You've reached the end.",
  skeletonVariant,
  skeletonCount = 3,
}: InfiniteScrollTriggerProps) {
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div ref={ref} className="flex w-full items-center justify-center py-8">
      {isFetchingNextPage ? (
        skeletonVariant ? (
          <div className="w-full">
            <PageSkeleton variant={skeletonVariant} count={skeletonCount} />
          </div>
        ) : loadingContent ? (
          loadingContent
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            {loadingText}
          </div>
        )
      ) : hasNextPage ? (
        <div className="h-4 w-4" /> // Empty placeholder for intersection observer
      ) : (
        <p className="text-sm text-muted-foreground">{endText}</p>
      )}
    </div>
  )
}
