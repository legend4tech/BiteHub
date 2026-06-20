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
import type { MenuItem, MenuItemPayload } from "@/lib/types"
import { MENU_CATEGORIES } from "@/lib/constants"
import { menuItemFormSchema, type MenuItemFormValues } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { formatInputNumber, parseInputNumber } from "@/lib/format"

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

  const categories = MENU_CATEGORIES.filter((c) => c.value !== "all") as {
    value: string
    label: string
    image: string
  }[]

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
                  const formatted = formatInputNumber(e.target.value)
                  field.onChange(formatted)
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
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="h-11 w-full rounded-xl"
                >
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
                    e.currentTarget.showPicker()
                  } catch {}
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
                    e.currentTarget.showPicker()
                  } catch {}
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="quantityAvailable"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Quantity Available</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                min="0"
                placeholder="Unlimited if blank"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="availableDays"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Days Available</FieldLabel>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day) => (
                <label key={day} className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value?.includes(day)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...(field.value || []), day])
                      } else {
                        field.onChange(
                          (field.value || []).filter((d) => d !== day)
                        )
                      }
                    }}
                  />
                  <span className="text-sm leading-none font-medium">
                    {day}
                  </span>
                </label>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="prepTimeValue"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Prep Time (Optional)</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                min="1"
                placeholder="e.g. 45"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="prepTimeUnit"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Unit</FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="h-11 w-full rounded-xl"
                >
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
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
          {saving && <Loader2 className="size-4 animate-spin" />}
          {initial?.name ? "Save changes" : "Add item"}
        </Button>
      </div>
    </form>
  )
}
