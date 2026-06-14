"use client"

import { useState } from "react"
import { Pencil, Trash2, Clock, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MenuItem } from "@/lib/types"
import { MENU_CATEGORIES } from "@/lib/constants"
import Image from "next/image"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { formatPrice, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

interface MenuItemCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onToggleAvailability: (id: string, available: boolean) => void | Promise<void>
}

export function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemCardProps) {
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
  const isScheduled = !!(item.availableFrom && item.availableTo)
  const isOffSchedule =
    isScheduled &&
    (currentTime < item.availableFrom! || currentTime > item.availableTo!)
  const imageUrl = typeof item.image === "string" ? item.image : item.image?.url

  const handleToggle = async () => {
    if (isToggling) return
    const next = !localAvailable
    setLocalAvailable(next)
    setIsToggling(true)
    try {
      await onToggleAvailability(item.id, next)
    } catch {
      setLocalAvailable(!next)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5",
        !localAvailable && "opacity-75"
      )}
    >
      {/* ── Image ── */}
      <div className="group relative h-40 w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
          />
        ) : cat?.image ? (
          <Image
            src={cat.image}
            alt={cat.label}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-4xl font-black text-primary/30">
              {item.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Image overlay badges — top-left only */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {cat && (
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
              {cat.label}
            </span>
          )}
          {!localAvailable && (
            <span className="flex items-center gap-1 rounded-full bg-destructive/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
              <EyeOff className="size-2.5" /> Unlisted
            </span>
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="space-y-1 px-3.5 pt-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 truncate text-sm font-semibold">{item.name}</p>
          <span className="shrink-0 text-sm font-bold text-primary">
            {formatPrice(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.description}
          </p>
        )}

        {/* Availability time window — always shown when set */}
        {isScheduled && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1.5 text-[11px] font-medium",
              isOffSchedule ? "text-muted-foreground" : "text-primary"
            )}
          >
            <Clock className="size-3 shrink-0" />
            <span>
              {formatTime(item.availableFrom!)} –{" "}
              {formatTime(item.availableTo!)}
              {isOffSchedule && (
                <span className="ml-1 text-muted-foreground">
                  (
                  {currentTime < item.availableFrom!
                    ? "not yet open"
                    : "closed"}
                  )
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom action bar ── */}
      <div className="mt-auto flex items-center justify-between gap-2 px-3.5 pt-2 pb-3">
        <ConfirmDialog
          trigger={
            <button
              disabled={isToggling}
              title={localAvailable ? "Unlist item" : "List item"}
              className={cn(
                "flex items-center gap-2 transition-opacity",
                isToggling && "cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  localAvailable ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    localAvailable && "translate-x-4",
                    isToggling && "scale-75"
                  )}
                />
              </div>
              <span className="text-[11px] leading-none font-medium text-muted-foreground">
                {localAvailable ? "Listed" : "Unlisted"}
              </span>
            </button>
          }
          title={localAvailable ? "Unlist this item?" : "List this item?"}
          description={
            localAvailable
              ? `"${item.name}" will be unlisted and hidden from students until you list it again.`
              : `"${item.name}" will be listed and become visible to students for ordering.`
          }
          confirmText={localAvailable ? "Yes, unlist" : "Yes, list"}
          isDestructive={localAvailable}
          onConfirm={handleToggle}
        />

        {/* Edit + Delete — single set, always visible */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(item)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            }
            title="Delete menu item?"
            description={`This will permanently delete "${item.name}". This action cannot be undone.`}
            confirmText="Yes, delete"
            isDestructive
            onConfirm={() => onDelete(item.id)}
          />
        </div>
      </div>
    </div>
  )
}
