"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import type { MenuItem, MenuItemPayload } from "@/types/vendor"
import { menuItemFormSchema, type MenuItemFormValues } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { formatInputNumber, parseInputNumber } from "@/lib/format"
import { MenuItemChecklists } from "./MenuItemChecklists"
import { MenuItemBasicFields } from "./MenuItemBasicFields"
import { MenuItemPreorderFields } from "./MenuItemPreorderFields"

interface MenuItemFormProps {
  initial?: Partial<MenuItem>
  onSave: (data: MenuItemPayload) => void | Promise<void>
  onCancel: () => void
}

export function MenuItemForm({ initial, onSave, onCancel }: MenuItemFormProps) {
  const [saving, setSaving] = useState(false)

  const form = useForm<MenuItemFormValues>({
    // `as never` needed: @hookform/resolvers typed against Zod 4.0.x; project uses 4.4.x
    resolver: zodResolver(menuItemFormSchema as never),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      price: initial?.price ? formatInputNumber(initial.price.toString()) : "",
      category:
        (initial?.category as MenuItemFormValues["category"]) ?? "snack",
      isAvailable: initial?.isAvailable ?? true,
      image:
        typeof initial?.image === "string"
          ? { url: initial.image, publicId: "" }
          : initial?.image,
      availableFrom: initial?.availableFrom ?? "",
      availableTo: initial?.availableTo ?? "",
      prepTimeValue: initial?.prepTimeValue
        ? initial.prepTimeValue.toString()
        : "",
      prepTimeUnit: initial?.prepTimeUnit ?? "minutes",
      quantityAvailable: initial?.quantityAvailable?.toString() ?? "",
      availableDays: initial?.availableDays ?? [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      isPreorder: initial?.isPreorder ?? false,
      preorderEndDate: initial?.preorderEndDate
        ? new Date(initial.preorderEndDate).toISOString().slice(0, 16)
        : "",
      preorderDeliveryInfo: initial?.preorderDeliveryInfo ?? "",
    },
  })

  const onSubmit = async (values: MenuItemFormValues) => {
    setSaving(true)
    try {
      let imageToSave = values.image

      if (
        values.image &&
        typeof values.image === "object" &&
        "file" in values.image &&
        values.image.file
      ) {
        const formData = new FormData()
        formData.append("file", values.image.file)
        formData.append("type", "menu")

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json()
          throw new Error(
            errData.error ||
              "Image upload failed. Please check your connection and try again."
          )
        }

        const uploadData = await uploadResponse.json()
        imageToSave = {
          url: uploadData.imageUrl,
          publicId: uploadData.publicId,
        }
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
        prepTimeValue: values.prepTimeValue
          ? Number(values.prepTimeValue)
          : null,
        prepTimeUnit: values.prepTimeUnit || null,
        quantityAvailable: values.quantityAvailable
          ? Number(values.quantityAvailable)
          : null,
        availableDays: values.availableDays,
        isPreorder: values.isPreorder,
        preorderEndDate: values.preorderEndDate
          ? new Date(values.preorderEndDate).toISOString()
          : undefined,
        preorderDeliveryInfo: values.preorderDeliveryInfo || "",
        tag: null,
      })
    } catch (error: unknown) {
      console.error("Save menu item error:", error)
      const msg = error instanceof Error ? error.message : undefined
      toast.error(msg || "Couldn't save the menu item. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <MenuItemBasicFields control={form.control} />
      <MenuItemChecklists control={form.control} />

      <Controller
        name="image"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Image *</FieldLabel>
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              type="menu"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <MenuItemPreorderFields control={form.control} watch={form.watch} />

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
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="hero"
          className="flex-1"
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initial?.name ? "Save changes" : "Add item"}
        </Button>
      </div>
    </form>
  )
}
