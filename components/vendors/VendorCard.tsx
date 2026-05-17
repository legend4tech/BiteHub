import Link from "next/link";
import { MapPin, ArrowUpRight, Circle } from "lucide-react";
import type { Vendor } from "@/lib/types";

interface VendorCardProps {
  vendor: Vendor;
  itemCount?: number;
}

export function VendorCard({ vendor, itemCount }: VendorCardProps) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group rounded-3xl bg-background border border-border p-6 hover:border-primary transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_-6px_rgba(255,107,0,0.25)] flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div
          className="h-14 w-14 rounded-2xl overflow-hidden grid place-items-center text-primary-foreground font-bold text-lg bg-primary shadow-lg shadow-primary/20"
        >
          {typeof vendor.image === "string" ? (
            <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover" />
          ) : vendor.image?.url ? (
            <img src={vendor.image.url} alt={vendor.name} className="h-full w-full object-cover" />
          ) : (
            vendor.initials
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <ArrowUpRight className="text-muted-foreground group-hover:text-primary transition-colors size-4" />
          {vendor.isActive ? (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
              <Circle className="size-1.5 fill-current" /> Open
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Closed</span>
          )}
        </div>
      </div>

      <h3 className="font-heading font-bold text-lg mt-5 leading-tight">
        {vendor.name}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">
        {vendor.tagline}
      </p>

      <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mt-5 pt-4 border-t border-border">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          {vendor.location}
        </span>
        {itemCount !== undefined && (
          <span className="ml-auto text-primary font-semibold">{itemCount} menus</span>
        )}
      </div>
    </Link>
  );
}
