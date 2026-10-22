"use client"

import { useState } from "react"
import { PromoRedemptionDetail } from "@/types/promo"
import { formatPriceExact } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataPagination } from "@/components/shared/DataPagination"
import { Search, User, Store, Tag } from "lucide-react"

interface PromoRedemptionsTableProps {
  redemptions: PromoRedemptionDetail[]
}

export function PromoRedemptionsTable({
  redemptions,
}: PromoRedemptionsTableProps) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filtered = redemptions.filter(
    (r) =>
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, code, or restaurant..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "redemption" : "redemptions"} recorded
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No promo redemptions recorded yet.
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (block on mobile, hidden on desktop) */}
          <div className="block space-y-3 md:hidden">
            {paginated.map((r) => {
              const dateStr = new Date(r.redeemedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })

              return (
                <div
                  key={r.id}
                  className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {r.customerName}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {r.customerEmail}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-sm font-bold text-primary">
                      -{formatPriceExact(r.discountAmountInKobo)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className="bg-muted/30 font-mono text-xs font-bold"
                    >
                      <Tag className="mr-1 h-3 w-3 text-primary" />
                      {r.code}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      <Store className="mr-1 h-3 w-3 text-muted-foreground" />
                      {r.vendorName}
                    </Badge>
                  </div>

                  {r.items && r.items.length > 0 && (
                    <div className="rounded-lg bg-muted/20 p-2 text-[11px] text-muted-foreground">
                      {r.items.map((item, idx) => (
                        <p key={idx} className="truncate">
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border/50 pt-1 font-mono text-[11px] text-muted-foreground">
                    <span>Order: #{r.orderId.slice(-6).toUpperCase()}</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View (hidden on mobile, block on desktop) */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Promo Code</th>
                    <th className="px-4 py-3.5">Vendor / Restaurant</th>
                    <th className="px-4 py-3.5">Items Ordered</th>
                    <th className="px-4 py-3.5">Discount Given</th>
                    <th className="px-4 py-3.5">Order ID</th>
                    <th className="px-4 py-3.5 text-right">Redeemed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map((r) => {
                    const dateStr = new Date(r.redeemedAt).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )

                    return (
                      <tr
                        key={r.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {r.customerName}
                              </p>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {r.customerEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Promo Code */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs font-bold"
                          >
                            {r.code}
                          </Badge>
                        </td>

                        {/* Vendor */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{r.vendorName}</span>
                          </div>
                        </td>

                        {/* Items Ordered */}
                        <td className="max-w-[200px] px-4 py-3.5">
                          <div className="space-y-0.5">
                            {r.items && r.items.length > 0 ? (
                              r.items.map((item, idx) => (
                                <p
                                  key={idx}
                                  className="truncate text-xs text-muted-foreground"
                                >
                                  {item.name} × {item.quantity}
                                </p>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Order meals
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Discount Amount */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-bold text-primary">
                            -{formatPriceExact(r.discountAmountInKobo)}
                          </span>
                        </td>

                        {/* Order ID */}
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                          {r.orderId}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-right font-mono text-xs whitespace-nowrap text-muted-foreground">
                          {dateStr}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reusable Pagination */}
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
