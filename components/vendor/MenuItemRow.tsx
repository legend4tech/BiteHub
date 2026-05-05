"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";
import { MENU_CATEGORIES } from "@/lib/constants";
import Image from "next/image";

interface MenuItemRowProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, available: boolean) => void;
}

export function MenuItemRow({ item, onEdit, onDelete, onToggleAvailability }: MenuItemRowProps) {
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
      <p className="font-bold text-sm text-primary shrink-0">₦{item.price.toLocaleString()}</p>

      {/* Availability toggle */}
      <button
        onClick={() => onToggleAvailability(item.id, !item.isAvailable)}
        className="shrink-0"
        title={item.isAvailable ? "Mark unavailable" : "Mark available"}
      >
        <div className={`w-10 h-6 rounded-full transition-colors relative ${item.isAvailable ? "bg-primary" : "bg-muted"}`}>
          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.isAvailable ? "translate-x-4" : ""}`} />
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
