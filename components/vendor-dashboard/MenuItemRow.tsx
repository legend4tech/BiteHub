"use client"

import { useState } from "react"
import { Pencil, Trash2, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MenuItem } from "@/lib/types"
import { MENU_CATEGORIES } from "@/lib/constants"
import Image from "next/image"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"

import { formatPrice, formatTime, isItemAvailableToday } from "@/lib/format"

interface MenuItemRowProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onToggleAvailability: (id: string, available: boolean) => void | Promise<void>
}

export function MenuItemRow({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemRowProps) {
  const [localAvailable, setLocalAvailable] = useState(item.isAvailable)
  const [isToggling, setIsToggling] = useState(false)

  const [prevIsAvailable, setPrevIsAvailable] = useState(item.isAvailable)
  if (item.isAvailable !== prevIsAvailable) {
    setPrevIsAvailable(item.isAvailable)
    setLocalAvailable(item.isAvailable)
  }

  const cat = MENU_CATEGORIES.find((c) => c.value === item.category)

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const isScheduled = item.availableFrom && item.availableTo
  const isOffSchedule =
    isScheduled &&
    (currentTime < item.availableFrom! || currentTime > item.availableTo!)
  const imageUrl = typeof item.image === "string" ? item.image : item.image?.url

  const isAvailableToday = isItemAvailableToday(item.availableDays)
  const isSoldOut =
    item.quantityAvailable !== null &&
    item.quantityAvailable !== undefined &&
    item.quantityAvailable <= 0

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      {/* Menu Item Image */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : cat?.image ? (
          <Image
            src={cat.image}
            alt={cat.label}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-bold text-muted-foreground">
            {item.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {cat?.label ?? item.category}
        </p>

        <div className="mt-1 flex flex-wrap gap-1">
          {!localAvailable && (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-destructive uppercase">
              Unlisted
            </span>
          )}
          {localAvailable && !isAvailableToday && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
              Not active today
            </span>
          )}
          {localAvailable && isSoldOut && (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-destructive uppercase">
              Sold out
            </span>
          )}
          {localAvailable &&
            item.quantityAvailable !== null &&
            item.quantityAvailable !== undefined &&
            item.quantityAvailable > 0 && (
              <span className="inline-flex items-center rounded-full bg-status-confirmed/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-status-confirmed uppercase">
                Qty: {item.quantityAvailable}
              </span>
            )}
          {isScheduled && (
            <>
              {isOffSchedule ? (
                currentTime < item.availableFrom! ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-400">
                    Opens order at {formatTime(item.availableFrom!)}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Closed
                  </span>
                )
              ) : (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                  {formatTime(item.availableFrom!)} -{" "}
                  {formatTime(item.availableTo!)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Price */}
      <p className="shrink-0 text-sm font-bold text-primary">
        {formatPrice(item.price)}
      </p>

      {/* Availability toggle */}
      <button
        onClick={async () => {
          if (isToggling) return
          const newValue = !localAvailable
          setLocalAvailable(newValue)
          setIsToggling(true)
          try {
            await onToggleAvailability(item.id, newValue)
          } catch (_error) {
            setLocalAvailable(!newValue)
          } finally {
            setIsToggling(false)
          }
        }}
        disabled={isToggling}
        className={`shrink-0 transition-opacity ${isToggling ? "cursor-not-allowed opacity-50" : ""}`}
        title={localAvailable ? "Mark unavailable" : "Mark available"}
      >
        <div
          className={`relative h-6 w-10 rounded-full transition-colors ${localAvailable ? "bg-primary" : "bg-muted"}`}
        >
          <div
            className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${localAvailable ? "translate-x-4" : ""} ${isToggling ? "scale-75" : ""}`}
          />
        </div>
      </button>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
          title="Copy public link"
          onClick={() => {
            const baseUrl =
              typeof window !== "undefined"
                ? window.location.origin
                : "https://bitehub.com"
            navigator.clipboard.writeText(`${baseUrl}/menu/${item.id}`)
            toast.success("Public link copied to clipboard!")
          }}
        >
          <LinkIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(item)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
          title="Are you absolutely sure?"
          description={`This will permanently delete the menu item "${item.name}". This action cannot be undone.`}
          confirmText="Yes, delete"
          isDestructive
          onConfirm={() => onDelete(item.id)}
        />
      </div>
    </div>
  )
}
