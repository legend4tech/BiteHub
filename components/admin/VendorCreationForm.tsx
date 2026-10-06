"use client"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { MENU_CATEGORIES, VENDOR_CATEGORIES } from "@/lib/constants"
import { DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID } from "@/lib/config/campus"
import { useAdminAddVendor } from "@/hooks/admin/useAdminMutations"
import Link from "next/link"
import { vendorCreationSchema } from "@/lib/schemas"
import type { VendorCreationValues } from "@/lib/schemas"
import { VendorAccountFields } from "./VendorAccountFields"
import { VendorLocationFields } from "./VendorLocationFields"
export function VendorCreationForm() {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<VendorCreationValues>({
    resolver: zodResolver(vendorCreationSchema as never),
    defaultValues: {
      name: "",
      whatsappNumber: "",
      email: "",
      password: "",
      description: "",
      category: "meals",
      tags: [],
      prepTime: "",
      school: DEFAULT_SCHOOL_ID,
      campus: DEFAULT_CAMPUS_ID,
      isManagedByBiteHub: false,
    },
    mode: "onChange",
  })
  const addVendorMutation = useAdminAddVendor()
  const onSubmit = async (values: VendorCreationValues) => {
    setSubmitting(true)
    try {
      let imageToSave = values.image
        ? { url: values.image.url, publicId: values.image.publicId }
        : undefined
      if (values.image?.file) {
        const formData = new FormData()
        formData.append("file", values.image.file)
        formData.append("type", "vendor")
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || "Image upload failed")
        }
        const uploadData = await uploadRes.json()
        imageToSave = {
          url: uploadData.imageUrl,
          publicId: uploadData.publicId,
        }
      }
      await addVendorMutation.mutateAsync({ ...values, image: imageToSave })
      toast.success(`Vendor "${values.name}" created successfully!`)
      form.reset()
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error
          ? ((error as { response?: { data?: { error?: string } } }).response
              ?.data?.error ?? error.message)
          : "Failed to create vendor"
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }
  const categories = MENU_CATEGORIES.filter((c) => c.value !== "all")
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Vendor Name *</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="e.g. Mama Put"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="whatsappNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>WhatsApp Number *</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. 08012345678"
                  maxLength={11}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                    {VENDOR_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Description *</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder="Tell us about the vendor..."
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-1 gap-4">
          <Controller
            name="prepTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Estimated Prep Time
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    className="h-11 w-full rounded-xl"
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
                    <SelectItem value="1hr+">
                      1hr+ (Pre-orders/Catering)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <VendorLocationFields control={form.control} />
        <Controller
          name="tags"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Tags (Select applicable) *</FieldLabel>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <div key={c.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${c.value}`}
                      checked={field.value?.includes(c.value)}
                      onCheckedChange={(checked) => {
                        const current = field.value || []
                        field.onChange(
                          checked
                            ? [...current, c.value]
                            : current.filter((v: string) => v !== c.value)
                        )
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="border-t border-border pt-6">
          <Controller
            name="isManagedByBiteHub"
            control={form.control}
            render={({ field }) => (
              <Field>
                <div className="flex items-start space-x-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <Checkbox
                    id="isManagedByBiteHub"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="isManagedByBiteHub"
                      className="text-sm font-bold text-foreground"
                    >
                      Managed Vendor (Allow Shared Bank Account)
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Enable this if this vendor is managed by BiteHub. This
                      allows them to safely share a central bank account with
                      other managed vendors for payouts.
                    </p>
                  </div>
                </div>
              </Field>
            )}
          />
        </div>
        <VendorAccountFields control={form.control} />
        {/* Profile image */}
        <div className="border-t border-border pt-6">
          <Controller
            name="image"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Profile Image *</FieldLabel>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  type="vendor"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" asChild>
            <Link href="/admin">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            className="flex-1"
            disabled={submitting}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create Vendor
          </Button>
        </div>
      </form>
    </div>
  )
}
