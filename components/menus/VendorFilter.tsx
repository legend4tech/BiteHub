"use client"

import { useEffect, useRef, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ChevronDown, Store, Check, Loader2 } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import { useVendorFilter } from "@/hooks/vendor/useVendorFilter"

interface VendorFilterProps {
  school: string
  campus: string
  activeVendorId?: string
}

export function VendorFilter({
  school,
  campus,
  activeVendorId,
}: VendorFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useVendorFilter({ school, campus, enabled: open })

  // Flatten pages into a single vendor list
  const vendors = data?.pages.flatMap((p) => p.items) ?? []

  // Infinite scroll sentinel
  useEffect(() => {
    if (!open) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage])

  const selectVendor = (vendorId: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (vendorId) {
      params.set("vendorId", vendorId)
    } else {
      params.delete("vendorId")
    }
    // Reset to page 1 when vendor changes
    params.delete("page")
    setOpen(false)
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  // Find selected vendor name for button label
  const selectedVendor = vendors.find((v) => v.id === activeVendorId)
  const isLoading = isFetching && vendors.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-150 ${
            activeVendorId
              ? "border-primary bg-primary/10 text-primary shadow-sm"
              : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
          }`}
          aria-label="Filter by vendor"
        >
          <Store className="size-4 shrink-0" />
          <span className="max-w-[120px] truncate">
            {selectedVendor ? selectedVendor.name : "All Vendors"}
          </span>
          <ChevronDown
            className={`size-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 p-0 shadow-xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Filter by Vendor
          </p>
        </div>

        {/* Scrollable list */}
        <div
          ref={scrollRef}
          className="max-h-72 overflow-y-auto overscroll-contain"
          data-lenis-prevent
        >
          {/* All Vendors option */}
          <button
            onClick={() => selectVendor(null)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 ${
              !activeVendorId ? "bg-primary/5 font-semibold text-primary" : ""
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Store className="size-3.5 text-muted-foreground" />
            </div>
            <span className="flex-1 truncate">All Vendors</span>
            {!activeVendorId && <Check className="size-3.5 text-primary" />}
          </button>

          {/* Loading skeleton on first fetch */}
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 px-3 py-2.5"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="h-3 flex-1 rounded bg-muted" />
              </div>
            ))}

          {/* Vendor list */}
          {vendors.map((vendor) => {
            const isSelected = vendor.id === activeVendorId
            return (
              <button
                key={vendor.id}
                onClick={() => selectVendor(vendor.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 ${
                  isSelected ? "bg-primary/5 font-semibold text-primary" : ""
                }`}
              >
                {/* Logo or initials fallback */}
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {vendor.image?.url ? (
                    <Image
                      src={vendor.image.url}
                      alt={vendor.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    vendor.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <span className="flex-1 truncate">{vendor.name}</span>
                {isSelected && <Check className="size-3.5 text-primary" />}
              </button>
            )
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Load-more spinner */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && vendors.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              No vendors found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
