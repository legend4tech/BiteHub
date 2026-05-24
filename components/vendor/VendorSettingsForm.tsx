"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { toast } from "sonner"
import type { Vendor } from "@/lib/types"
import apiClient from "@/lib/axios"
import { useRouter } from "next/navigation"
import {
  vendorSettingsSchema,
  type VendorSettingsValues,
  formatFromWhatsapp,
} from "@/lib/schemas"
import { useSession } from "next-auth/react"
import { VENDOR_CATEGORIES, MENU_CATEGORIES } from "@/lib/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { formatInputNumber, parseInputNumber } from "@/lib/format"

interface VendorSettingsFormProps {
  initial: Vendor
}

export function VendorSettingsForm({ initial }: VendorSettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const form = useForm<VendorSettingsValues>({
    resolver: async (data) => {
      const result = vendorSettingsSchema.safeParse(data)
      if (result.success) {
        return { values: result.data, errors: {} }
      } else {
        const errors = result.error.flatten().fieldErrors as Record<
          string,
          string[] | undefined
        >
        const formattedErrors: Record<string, { message?: string }> = {}
        for (const key in errors) {
          formattedErrors[key] = { message: errors[key]?.[0] }
        }
        return { values: {}, errors: formattedErrors }
      }
    },
    defaultValues: {
      name: initial.name ?? "",
      description: initial.description ?? "",
      whatsappNumber: formatFromWhatsapp(initial.whatsappNumber ?? ""),
      deliveryFee:
        initial.deliveryFee !== undefined && initial.deliveryFee !== null
          ? formatInputNumber(initial.deliveryFee.toString())
          : "",
      category: initial.category ?? "",
      prepTime: initial.prepTime ?? "",
      tags: initial.tags ?? [],
      image: typeof initial.image === "string" ? undefined : initial.image,
    },
  })

  const onSubmit = async (values: VendorSettingsValues) => {
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
        formData.append("type", "vendor")

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json()
          throw new Error(errData.error || "Failed to upload image")
        }

        const uploadData = await uploadResponse.json()
        imageToSave = {
          url: uploadData.imageUrl,
          publicId: uploadData.publicId,
        }
      }

      const response = await apiClient.patch("/vendor/settings", {
        name: values.name,
        description: values.description,
        whatsappNumber: values.whatsappNumber,
        deliveryFee:
          typeof values.deliveryFee === "string"
            ? parseInputNumber(values.deliveryFee)
            : values.deliveryFee,
        category: values.category,
        tags: values.tags,
        image: imageToSave,
      })

      const updatedVendor = response.data
      const initialImageUrl =
        typeof initial.image === "string" ? initial.image : initial.image?.url
      const updatedImageUrl = updatedVendor.image?.url || null

      const nameChanged = values.name !== initial.name
      const imageChanged = updatedImageUrl !== (initialImageUrl || null)

      if (nameChanged || imageChanged) {
        await update({
          name: values.name,
          image: updatedImageUrl,
        })
      }

      toast.success("Settings updated successfully")
      router.refresh()
    } catch (error: unknown) {
      console.error("Save settings error:", error)
      const err = error as Error
      toast.error(err.message || "Failed to update settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Field data-invalid={!!form.formState.errors.name}>
        <label className="text-sm font-medium" htmlFor="name">
          Vendor Name
        </label>
        <Input
          {...form.register("name")}
          id="name"
          placeholder="e.g. Mama Put"
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name?.message && (
          <FieldError
            errors={[{ message: form.formState.errors.name.message }]}
          />
        )}
      </Field>

      <Field data-invalid={!!form.formState.errors.description}>
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <Textarea
          {...form.register("description")}
          id="description"
          placeholder="Tell customers about your kitchen..."
          rows={4}
          aria-invalid={!!form.formState.errors.description}
        />
        {form.formState.errors.description?.message && (
          <FieldError
            errors={[{ message: form.formState.errors.description.message }]}
          />
        )}
      </Field>

      <Field data-invalid={!!form.formState.errors.whatsappNumber}>
        <label className="text-sm font-medium" htmlFor="whatsappNumber">
          WhatsApp Number
        </label>
        <Input
          {...form.register("whatsappNumber")}
          id="whatsappNumber"
          placeholder="e.g. 08012345678"
          maxLength={11}
          aria-invalid={!!form.formState.errors.whatsappNumber}
        />
        {form.formState.errors.whatsappNumber?.message && (
          <FieldError
            errors={[{ message: form.formState.errors.whatsappNumber.message }]}
          />
        )}
      </Field>

      <Controller
        name="deliveryFee"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <label className="text-sm font-medium" htmlFor={field.name}>
              Standard Delivery Fee (₦)
            </label>
            <Input
              {...field}
              id={field.name}
              type="text"
              inputMode="numeric"
              placeholder="e.g. 500"
              aria-invalid={fieldState.invalid}
              onChange={(e) => {
                const formatted = formatInputNumber(e.target.value)
                field.onChange(formatted)
              }}
            />
            {fieldState.invalid && (
              <FieldError errors={[{ message: fieldState.error?.message }]} />
            )}
          </Field>
        )}
      />
      <Controller
        name="prepTime"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <label className="text-sm font-medium" htmlFor="prepTime">
              Estimated Prep Time
            </label>
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="prepTime"
                className="h-11 w-full rounded-xl"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select prep time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10 - 20 mins">
                  10 - 20 mins (Fast snacks/drinks)
                </SelectItem>
                <SelectItem value="20 - 40 mins">
                  20 - 40 mins (Standard meals)
                </SelectItem>
                <SelectItem value="40 - 60 mins">
                  40 - 60 mins (Large meals)
                </SelectItem>
                <SelectItem value="1hr+">1hr+ (Pre-orders/Catering)</SelectItem>
              </SelectContent>
            </Select>
            {fieldState.invalid && (
              <FieldError errors={[{ message: fieldState.error?.message }]} />
            )}
          </Field>
        )}
      />
      <Controller
        name="category"
        control={form.control}
        render={({ field }) => (
          <Field>
            <label className="text-sm font-medium" htmlFor="category">
              Category
            </label>
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger id="category" className="h-11 w-full rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Controller
        name="tags"
        control={form.control}
        render={({ field }) => (
          <Field>
            <label className="text-sm font-medium">
              Tags (Select applicable)
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MENU_CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <div key={c.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${c.value}`}
                    checked={field.value?.includes(c.value)}
                    onCheckedChange={(checked) => {
                      const current = field.value || []
                      const updated = checked
                        ? [...current, c.value]
                        : current.filter((v: string) => v !== c.value)
                      field.onChange(updated)
                    }}
                  />
                  <label
                    htmlFor={`tag-${c.value}`}
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {c.label}
                  </label>
                </div>
              ))}
            </div>
          </Field>
        )}
      />

      <Field>
        <label className="text-sm font-medium">Store Image</label>
        <Controller
          control={form.control}
          name="image"
          render={({ field }) => (
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              type="vendor"
            />
          )}
        />
      </Field>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="hero"
          disabled={saving || !form.formState.isDirty}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  )
}
