"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";
import { MENU_CATEGORIES } from "@/lib/constants";
import Image from "next/image";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { formatPrice } from "@/lib/format";

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

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      {/* Category image */}
      <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 relative">
        {cat?.image && <Image src={cat.image} alt={cat.label} fill className="object-cover" sizes="48px" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{cat?.label ?? item.category}</p>
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
