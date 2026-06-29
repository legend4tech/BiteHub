"use client"

import { useState } from "react"
import { Loader2, X, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { toast } from "sonner"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useAdminAddLogin,
  useAdminAddVendor,
} from "@/hooks/mutations/useAdminMutations"
import type { AdminVendor } from "./types"
import {
  strongPasswordSchema,
  addLoginSchema,
  quickAddVendorSchema,
} from "@/lib/schemas"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import type { AddLoginValues, QuickAddVendorValues } from "@/lib/schemas"

// ─── Add Login Modal ──────────────────────────────────────────────────────────

export function AddLoginModal({
  vendor,
  onClose,
  onSuccess,
}: {
  vendor: AdminVendor
  onClose: () => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<AddLoginValues>({
    resolver: zodResolver(addLoginSchema as never),
    defaultValues: { email: "", password: "" },
  })

  const addLoginMutation = useAdminAddLogin()

  const onSubmit = async (values: AddLoginValues) => {
    setSubmitting(true)
    try {
      await addLoginMutation.mutateAsync({ vendorId: vendor.id, data: values })
      toast.success(`Login account created for ${vendor.name}`)
      onSuccess()
      onClose()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold">
              Create Login Account
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              For{" "}
              <span className="font-semibold text-foreground">
                {vendor.name}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-mt-1 -mr-1"
          >
            <X className="size-4" />
          </Button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="Min. 8 characters"
                    aria-invalid={fieldState.invalid}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={field.value} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              className="flex-1"
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create login
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────

export function AddVendorModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<QuickAddVendorValues>({
    resolver: zodResolver(quickAddVendorSchema as never),
    defaultValues: { name: "", whatsappNumber: "", email: "", password: "" },
  })

  const addVendorMutation = useAdminAddVendor()

  const onSubmit = async (values: QuickAddVendorValues) => {
    setSubmitting(true)
    try {
      let wa = values.whatsappNumber.trim()
      if (wa.startsWith("0")) wa = "234" + wa.slice(1)
      await addVendorMutation.mutateAsync({ ...values, whatsappNumber: wa })
      toast.success(`Vendor ${values.name} created successfully`)
      onSuccess()
      onClose()
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error ||
          "Couldn't create the vendor. Please check the details and try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold">Add New Vendor</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create a vendor profile and login account
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-mt-1 -mr-1"
          >
            <X className="size-4" />
          </Button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
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
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
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
                    placeholder="Min. 8 characters"
                    aria-invalid={fieldState.invalid}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={field.value} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="image"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Profile Image</FieldLabel>
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
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
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
    </div>
  )
}
