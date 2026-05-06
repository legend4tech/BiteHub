"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { VendorCard } from "@/components/vendors/VendorCard";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { FetchError } from "@/components/shared/FetchError";
import apiClient from "@/lib/axios";
import { FadeIn } from "@/components/FadeIn";

interface Vendor {
  id: string;
  name: string;
  initials: string;
  tagline: string;
  location: string;
  isActive: boolean;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  phone: string;
  whatsappNumber: string;
  school: string;
  campus: string;
  itemCount: number;
}

interface LoadMoreVendorsProps {
  initialPage: number;
  searchParams: { [key: string]: string | undefined };
}

export function LoadMoreVendors({ initialPage, searchParams }: LoadMoreVendorsProps) {
  const { ref, inView } = useInView();
  const q = searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : "";

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["vendors", searchParams.q || ""],
    initialPageParam: initialPage + 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`/vendors?page=${pageParam}${q}`);
      return response.data as Vendor[];
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.length === 0) return undefined;
      return lastPageParam + 1;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Combine all pages of vendors into a single array
  const vendors = data ? data.pages.flat() : [];

  return (
    <>
      {vendors.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
          {vendors.map((vendor, i) => (
            <FadeIn key={`${vendor.id}-${i}`} delay={0.05 * Math.min(i, 20)}>
              <VendorCard vendor={vendor as any} itemCount={vendor.itemCount || 0} />
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
          message={error?.message || "Something went wrong while fetching the next page of vendors."}
          onRetry={() => fetchNextPage()}
        />
      )}
    </>
  );
}
