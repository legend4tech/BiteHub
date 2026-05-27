"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useVendors } from "@/hooks/queries/useVendors"
import { VendorCard } from "@/components/vendors/VendorCard"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FetchError } from "@/components/shared/FetchError"
import { FadeIn } from "@/components/FadeIn"

interface LoadMoreVendorsProps {
  initialPage: number
  searchParams: { [key: string]: string | undefined }
}

export function LoadMoreVendors({
  initialPage,
  searchParams,
}: LoadMoreVendorsProps) {
  const { ref, inView } = useInView()
  const searchQuery = typeof searchParams.q === "string" ? searchParams.q : ""

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useVendors({
    q: searchQuery,
    school: searchParams.school || undefined,
    campus: searchParams.campus || undefined,
    initialPage: initialPage + 1,
    limit: 20,
    enabled: true,
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Combine all pages of vendors into a single array
  const vendors = data ? data.pages.flatMap((page) => page.vendors) : []

  return (
    <>
      {vendors.length > 0 && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor, i) => (
            <FadeIn key={`${vendor.id}-${i}`} delay={0.05 * Math.min(i, 20)}>
              <VendorCard vendor={vendor} itemCount={vendor.itemCount || 0} />
            </FadeIn>
          ))}
        </div>
      )}

      {(hasNextPage || isFetchingNextPage) && (
        <div ref={ref} className="mt-8">
          <PageSkeleton variant="menu-item-grid" count={4} />
        </div>
      )}

      {status === "error" && (
        <FetchError
          size="sm"
          title="Couldn't load more vendors"
          message={
            error?.message ||
            "Something went wrong while fetching the next page of vendors."
          }
          onRetry={() => fetchNextPage()}
        />
      )}
    </>
  )
}
