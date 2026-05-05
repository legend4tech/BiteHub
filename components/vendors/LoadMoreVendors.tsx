"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { VendorCard } from "@/components/vendors/VendorCard";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
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
}

interface LoadMoreVendorsProps {
  initialPage: number;
  searchParams: { [key: string]: string | undefined };
}

export function LoadMoreVendors({ initialPage, searchParams }: LoadMoreVendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore]);

  const loadMore = async () => {
    const nextPage = page + 1;
    try {
      const q = searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : "";
        
      const response = await apiClient.get(`/vendors?page=${nextPage}${q}`);
      const newVendors = response.data;

      if (newVendors.length === 0) {
        setHasMore(false);
      } else {
        setVendors((prev) => [...prev, ...newVendors]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more vendors", error);
      setHasMore(false);
    }
  };

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
        {vendors.map((vendor, i) => (
          <FadeIn key={`${vendor.id}-${i}`} delay={0.05 * Math.min(i, 20)}>
            {/* We pass a default itemCount=0 because calculating item counts on infinite scroll requires extra backend logic. Alternatively, update API to return itemCount. */}
            <VendorCard vendor={vendor as any} itemCount={0} />
          </FadeIn>
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="mt-8">
          <PageSkeleton variant="menu-item-grid" count={4} />
        </div>
      )}
    </>
  );
}
