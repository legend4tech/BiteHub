"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";
import { MENU_CATEGORIES } from "@/lib/constants";
import Image from "next/image";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { formatPrice, formatTime } from "@/lib/format";

interface MenuItemRowProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, available: boolean) => void | Promise<void>;
}

export function MenuItemRow({ item, onEdit, onDelete, onToggleAvailability }: MenuItemRowProps) {
  const [localAvailable, setLocalAvailable] = useState(item.isAvailable);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setLocalAvailable(item.isAvailable);
  }, [item.isAvailable]);

  const cat = MENU_CATEGORIES.find((c) => c.value === item.category);

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isScheduled = item.availableFrom && item.availableTo;
  const isOffSchedule = isScheduled && (currentTime < item.availableFrom! || currentTime > item.availableTo!);
  const imageUrl = typeof item.image === "string" ? item.image : item.image?.url;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      {/* Menu Item Image */}
      <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 relative">
        {imageUrl ? (
          <Image src={imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
        ) : cat?.image ? (
          <Image src={cat.image} alt={cat.label} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs font-bold text-muted-foreground">
            {item.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{cat?.label ?? item.category}</p>
        
        <div className="flex flex-wrap gap-1 mt-1">
          {!localAvailable && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive uppercase tracking-wider">
              Out of stock
            </span>
          )}
          {isScheduled && (
            <>
              {isOffSchedule ? (
                currentTime < item.availableFrom! ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Opens order at {formatTime(item.availableFrom!)}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    Closed
                  </span>
                )
              ) : (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                  {formatTime(item.availableFrom!)} - {formatTime(item.availableTo!)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Price */}
      <p className="font-bold text-sm text-primary shrink-0">{formatPrice(item.price)}</p>

      {/* Availability toggle */}
      <button
        onClick={async () => {
          if (isToggling) return;
          const newValue = !localAvailable;
          setLocalAvailable(newValue);
          setIsToggling(true);
          try {
            await onToggleAvailability(item.id, newValue);
          } catch (error) {
            setLocalAvailable(!newValue);
          } finally {
            setIsToggling(false);
          }
        }}
        disabled={isToggling}
        className={`shrink-0 transition-opacity ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
        title={localAvailable ? "Mark unavailable" : "Mark available"}
      >
        <div className={`w-10 h-6 rounded-full transition-colors relative ${localAvailable ? "bg-primary" : "bg-muted"}`}>
          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${localAvailable ? "translate-x-4" : ""} ${isToggling ? "scale-75" : ""}`} />
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
          <Pencil className="size-3.5" />
        </Button>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
  );
}
