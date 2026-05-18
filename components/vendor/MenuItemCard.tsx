"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Clock, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";
import { MENU_CATEGORIES } from "@/lib/constants";
import Image from "next/image";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatPrice, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, available: boolean) => void | Promise<void>;
}

export function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability }: MenuItemCardProps) {
  const [localAvailable, setLocalAvailable] = useState(item.isAvailable);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => { setLocalAvailable(item.isAvailable); }, [item.isAvailable]);

  const cat = MENU_CATEGORIES.find((c) => c.value === item.category);
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isScheduled = !!(item.availableFrom && item.availableTo);
  const isOffSchedule = isScheduled && (currentTime < item.availableFrom! || currentTime > item.availableTo!);
  const imageUrl = typeof item.image === "string" ? item.image : item.image?.url;

  const handleToggle = async () => {
    if (isToggling) return;
    const next = !localAvailable;
    setLocalAvailable(next);
    setIsToggling(true);
    try {
      await onToggleAvailability(item.id, next);
    } catch {
      setLocalAvailable(!next);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 hover:border-primary/30",
      !localAvailable && "opacity-75"
    )}>

      {/* ── Image ── */}
      <div className="relative h-40 w-full bg-muted overflow-hidden group">
        {imageUrl ? (
          <Image src={imageUrl} alt={item.name} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
        ) : cat?.image ? (
          <Image src={cat.image} alt={cat.label} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
        ) : (
          <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-4xl font-black text-primary/30">{item.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}

        {/* Image overlay badges — top-left only */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {cat && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm uppercase tracking-wider">
              {cat.label}
            </span>
          )}
          {!localAvailable && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/80 text-white backdrop-blur-sm uppercase tracking-wider flex items-center gap-1">
              <EyeOff className="size-2.5" /> Unlisted
            </span>
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="px-3.5 pt-3 pb-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm truncate flex-1">{item.name}</p>
          <span className="font-bold text-sm text-primary shrink-0">{formatPrice(item.price)}</span>
        </div>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        )}

        {/* Availability time window — always shown when set */}
        {isScheduled && (
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium mt-1",
            isOffSchedule ? "text-muted-foreground" : "text-primary"
          )}>
            <Clock className="size-3 shrink-0" />
            <span>
              {formatTime(item.availableFrom!)} – {formatTime(item.availableTo!)}
              {isOffSchedule && (
                <span className="ml-1 text-muted-foreground">
                  ({currentTime < item.availableFrom! ? "not yet open" : "closed"})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex items-center justify-between gap-2 px-3.5 pt-2 pb-3 mt-auto">
        <ConfirmDialog
          trigger={
            <button
              disabled={isToggling}
              title={localAvailable ? "Unlist item" : "List item"}
              className={cn("flex items-center gap-2 transition-opacity", isToggling && "opacity-50 cursor-not-allowed")}
            >
              <div className={cn("w-9 h-5 rounded-full relative transition-colors", localAvailable ? "bg-primary" : "bg-muted")}>
                <div className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  localAvailable && "translate-x-4",
                  isToggling && "scale-75"
                )} />
              </div>
              <span className="text-[11px] text-muted-foreground font-medium leading-none">
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
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(item)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
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
  );
}
