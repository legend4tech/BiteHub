"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff } from "lucide-react"
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
import { z } from "zod"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { MENU_CATEGORIES, VENDOR_CATEGORIES } from "@/lib/constants"
import {
  getSchoolOptions,
  getCampusOptions,
  DEFAULT_SCHOOL_ID,
  DEFAULT_CAMPUS_ID,
} from "@/lib/config/campus"
import apiClient from "@/lib/axios"
import Link from "next/link"
import { strongPasswordSchema, whatsappInputSchema } from "@/lib/schemas"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"

// ─── Schema ───────────────────────────────────────────────────────────────────

const addVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  whatsappNumber: whatsappInputSchema,
  email: z.string().email("Invalid email"),
  password: strongPasswordSchema,
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  prepTime: z.string().optional(),
  school: z.string().min(1, "School is required"),
  campus: z.string().min(1, "Campus is required"),
  image: z
    .object({
      url: z.string().min(1, "Image is required"),
      publicId: z.string(),
      file: z.instanceof(File).optional(),
    })
    .nullable()
    .optional()
    .refine((val) => val !== null && val !== undefined && val.url.length > 0, {
      message: "Image is required",
    }),
})

type AddVendorValues = z.infer<typeof addVendorSchema>

export function VendorCreationForm() {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<AddVendorValues>({
    resolver: zodResolver(addVendorSchema as never),
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
    },
    mode: "onChange",
  })

  const passwordValue = useWatch({ control: form.control, name: "password" })
  const selectedSchool = useWatch({ control: form.control, name: "school" })
  const campusOptions = getCampusOptions(selectedSchool)

  const onSubmit = async (values: AddVendorValues) => {
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

      await apiClient.post("/admin/vendors", { ...values, image: imageToSave })
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="school"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>School *</FieldLabel>
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
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSchoolOptions().map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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

          <Controller
            name="campus"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Campus *</FieldLabel>
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
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campusOptions.map((c) => (
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

        {/* Account credentials */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="font-heading text-lg font-semibold">
            Account Credentials
          </h3>

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="vendor@email.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 chars, uppercase, number, symbol"
                    aria-invalid={fieldState.invalid}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={passwordValue ?? ""} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

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
