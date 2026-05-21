"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import type { MenuItem, MenuItemPayload } from "@/lib/types";
import { MENU_CATEGORIES } from "@/lib/constants";
import { menuItemFormSchema, type MenuItemFormValues } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { formatInputNumber, parseInputNumber } from "@/lib/format";

interface MenuItemFormProps {
  initial?: Partial<MenuItem>;
  onSave: (data: MenuItemPayload) => void | Promise<void>;
  onCancel: () => void;
}

export function MenuItemForm({ initial, onSave, onCancel }: MenuItemFormProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<MenuItemFormValues>({
    // `as any` needed: @hookform/resolvers typed against Zod 4.0.x; project uses 4.4.x
    resolver: zodResolver(menuItemFormSchema as any),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      price: initial?.price ? formatInputNumber(initial.price.toString()) : "",
      category: (initial?.category as any) ?? "snack",
      isAvailable: initial?.isAvailable ?? true,
      image: typeof initial?.image === "string" ? { url: initial.image, publicId: "" } : initial?.image,
      availableFrom: initial?.availableFrom ?? "",
      availableTo: initial?.availableTo ?? "",
    },
  });

  const onSubmit = async (values: MenuItemFormValues) => {
    setSaving(true);
    try {
      let imageToSave = values.image;

      if (values.image && typeof values.image === "object" && "file" in values.image && values.image.file) {
        const formData = new FormData();
        formData.append("file", values.image.file);
        formData.append("type", "menu");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json();
          throw new Error(errData.error || "Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        imageToSave = {
          url: uploadData.imageUrl,
          publicId: uploadData.publicId,
        };
      }

      await onSave({
        name: values.name,
        description: values.description ?? null,
        price: parseInputNumber(values.price),
        category: values.category,
        isAvailable: values.isAvailable,
        image: imageToSave ?? undefined,
        availableFrom: values.availableFrom || null,
        availableTo: values.availableTo || null,
        tag: null,
      });
    } catch (error: any) {
      console.error("Save menu item error:", error);
      toast.error(error.message || "Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  const categories = MENU_CATEGORIES.filter((c) => c.value !== "all") as { value: string; label: string; image: string }[];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Item name *</FieldLabel>
            <Input
              {...field}
              id={field.name}
              placeholder="e.g. Jollof Rice & Chicken"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              placeholder="Short description of the item"
              className="resize-none"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="price"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Price (₦) *</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1,200"
                aria-invalid={fieldState.invalid}
                onChange={(e) => {
                  const formatted = formatInputNumber(e.target.value);
                  field.onChange(formatted);
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="category"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Category *</FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full h-11 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="availableFrom"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Available From</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="time"
                aria-invalid={fieldState.invalid}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (error) {}
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="availableTo"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Available To</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="time"
                aria-invalid={fieldState.invalid}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (error) {}
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="image"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Image</FieldLabel>
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              type="menu"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="isAvailable"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            <Switch
              id={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={fieldState.invalid}
            />
            <FieldLabel htmlFor={field.name} className="cursor-pointer">
              Available for ordering
            </FieldLabel>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="hero" className="flex-1" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {initial?.name ? "Save changes" : "Add item"}
        </Button>
      </div>
    </form>
  );
}
