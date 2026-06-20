import Link from "next/link"
import Image from "next/image"
import { MapPin, ArrowUpRight, Circle, Clock } from "lucide-react"
import type { Vendor } from "@/lib/types"
import { RatingBadge } from "@/components/shared/RatingBadge"

interface VendorCardProps {
  vendor: Vendor
  itemCount?: number
}

export function VendorCard({ vendor, itemCount }: VendorCardProps) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group flex flex-col rounded-3xl border border-border bg-background p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[0_8px_32px_-6px_rgba(255,107,0,0.25)]"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
          {typeof vendor.image === "string" ? (
            <Image
              src={vendor.image}
              alt={vendor.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : vendor.image?.url ? (
            <Image
              src={vendor.image.url}
              alt={vendor.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : (
            vendor.initials
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
          {vendor.isActive ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <Circle className="size-1.5 fill-current" /> Open
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Closed</span>
          )}
        </div>
      </div>

      <h3 className="mt-5 font-heading text-lg leading-tight font-bold">
        {vendor.name}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
        {vendor.tagline}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        {/* Rating */}
        <RatingBadge rating={vendor.rating} />

        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          {vendor.location}
        </span>
        {vendor.prepTime && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-primary" />
            {vendor.prepTime}
          </span>
        )}
        {itemCount !== undefined && (
          <span className="ml-auto font-semibold text-primary">
            {itemCount} menus
          </span>
        )}
      </div>
    </Link>
  )
}
