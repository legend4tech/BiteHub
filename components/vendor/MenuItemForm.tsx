"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem, MenuCategory } from "@/lib/types";
import { MENU_CATEGORIES } from "@/lib/constants";
import { menuItemFormSchema } from "@/lib/schemas";
import { ZodError } from "zod";

interface MenuItemFormProps {
  initial?: Partial<MenuItem>;
  onSave: (data: Omit<MenuItem, "id" | "vendorId" | "vendorName">) => void;
  onCancel: () => void;
}

export function MenuItemForm({ initial, onSave, onCancel }: MenuItemFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "snack");
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [image, setImage] = useState(initial?.image ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validData = menuItemFormSchema.parse({
        name,
        description,
        price,
        category,
        isAvailable,
        image,
      });

      setSaving(true);
      onSave({
        name: validData.name,
        description: validData.description,
        price: Number(validData.price),
        category: validData.category,
        isAvailable: validData.isAvailable,
        image: validData.image,
        tag: null,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        (error as any).errors.forEach((err: any) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const categories = MENU_CATEGORIES.filter((c) => c.value !== "all") as { value: string; label: string; image: string }[];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item name *</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder="e.g. Jollof Rice & Chicken"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the item"
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Price (₦) *</label>
          <input type="number" min="0" value={price} onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: "" })); }}
            placeholder="e.g. 1200"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as MenuCategory)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Image URL (optional)</label>
        <input value={image} onChange={(e) => setImage(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" className="sr-only" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
          <div className={`w-10 h-6 rounded-full transition-colors ${isAvailable ? "bg-primary" : "bg-muted"}`} />
          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isAvailable ? "translate-x-4" : ""}`} />
        </div>
        <span className="text-sm font-medium">Available for ordering</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="hero" className="flex-1" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {initial?.name ? "Save changes" : "Add item"}
        </Button>
      </div>
    </form>
  );
}
