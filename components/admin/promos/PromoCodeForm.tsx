"use client"

import { useState } from "react"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  promoCodeFormInputSchema,
  type PromoCodeFormInput,
} from "@/lib/schemas"
import type { PromoCode } from "@/types/promo"
import { toMajorUnit } from "@/lib/money"
import { PromoFinancialSimulator } from "./PromoFinancialSimulator"
import { PromoScopeHierarchyCard } from "./PromoScopeHierarchyCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

interface PromoCodeFormProps {
  initialData?: PromoCode
  onSubmit: (values: PromoCodeFormInput) => Promise<void>
  isSubmitting: boolean
  submitLabel?: string
}

export function PromoCodeForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: PromoCodeFormProps) {
  const isEdit = Boolean(initialData)
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)
  const isBusy = isSubmitting || isSubmittingLocal

  const defaultValues: Partial<PromoCodeFormInput> = {
    code: initialData?.code || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    targetSchool: initialData?.targetSchool || null,
    targetCampus: initialData?.targetCampus || null,
    targetVendorId: initialData?.targetVendorId || null,
    targetMenuItemId: initialData?.targetMenuItemId || null,
    discountType: initialData?.discountType || "FIXED_AMOUNT",
    discountInNaira: initialData
      ? toMajorUnit(initialData.discountValueInKobo)
      : 500,
    discountPercentage: initialData?.discountPercentage ?? 10,
    maxDiscountInNaira: initialData?.maxDiscountInKobo
      ? toMajorUnit(initialData.maxDiscountInKobo)
      : undefined,
    minOrderValueInNaira: initialData?.minOrderValueInKobo
      ? toMajorUnit(initialData.minOrderValueInKobo)
      : 0,
    budgetInNaira: initialData
      ? toMajorUnit(initialData.budgetAllocatedInKobo)
      : 50000,
    maxRedemptions: initialData?.maxRedemptions ?? undefined,
    maxRedemptionsPerCustomer: initialData?.maxRedemptionsPerCustomer ?? 1,
    startDate: initialData?.startDate
      ? new Date(initialData.startDate)
      : new Date(),
    endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
    isActive: initialData ? initialData.isActive : true,
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromoCodeFormInput>({
    // Documented exception per CONTRIBUTING.md §7: @hookform/resolvers/zod variance with ZodEffects under React 19
    resolver: zodResolver(promoCodeFormInputSchema as never),
    defaultValues,
  })

  const discountType = watch("discountType")
  const discountInNaira = watch("discountInNaira") || 0
  const discountPercentage = watch("discountPercentage")
  const maxDiscountInNaira = watch("maxDiscountInNaira")
  const budgetInNaira = watch("budgetInNaira") || 0
  const minOrderValueInNaira = watch("minOrderValueInNaira")
  const isActive = watch("isActive")
  const targetSchool = watch("targetSchool")
  const targetCampus = watch("targetCampus")
  const targetVendorId = watch("targetVendorId")
  const targetMenuItemId = watch("targetMenuItemId")

  const onInvalid = (fieldErrors: FieldErrors<PromoCodeFormInput>) => {
    const firstKey = Object.keys(fieldErrors)[0] as keyof PromoCodeFormInput
    if (firstKey) {
      const el = document.getElementById(firstKey)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.focus()
      }
    }
  }

  const handleFormSubmit = async (values: PromoCodeFormInput) => {
    setIsSubmittingLocal(true)
    try {
      const cleanedValues: PromoCodeFormInput = {
        ...values,
        targetSchool: values.targetSchool?.trim() || null,
        targetCampus: values.targetCampus?.trim() || null,
        targetVendorId: values.targetVendorId?.trim() || null,
        targetMenuItemId: values.targetMenuItemId?.trim() || null,
        minOrderValueInNaira:
          !values.minOrderValueInNaira ||
          isNaN(Number(values.minOrderValueInNaira))
            ? 0
            : Number(values.minOrderValueInNaira),
        maxDiscountInNaira:
          !values.maxDiscountInNaira || isNaN(Number(values.maxDiscountInNaira))
            ? null
            : Number(values.maxDiscountInNaira),
        maxRedemptions:
          !values.maxRedemptions || isNaN(Number(values.maxRedemptions))
            ? null
            : Number(values.maxRedemptions),
      }
      await onSubmit(cleanedValues)
    } finally {
      setIsSubmittingLocal(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, onInvalid)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Form Controls */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card 1: Core Details */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="border-b border-border/60 pb-2 text-base font-semibold text-foreground">
              Promo Details
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">
                  Promo Code *
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. CAMPUS50"
                  {...register("code")}
                  disabled={isEdit}
                  className="font-mono text-sm uppercase"
                />
                {isEdit && (
                  <p className="text-[11px] text-muted-foreground">
                    Code cannot be renamed to protect redemption integrity.
                  </p>
                )}
                {errors.code && (
                  <p className="text-xs text-destructive">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  Campaign Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Welcome to BiteHub Campus"
                  {...register("title")}
                  className="text-sm"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Customer Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Give customers a brief overview of why they get this discount..."
                {...register("description")}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          {/* Card 2: Scoping Hierarchy (School, Campus, Vendor, Meal) */}
          <PromoScopeHierarchyCard
            targetSchool={targetSchool}
            targetCampus={targetCampus}
            targetVendorId={targetVendorId}
            targetMenuItemId={targetMenuItemId}
            onChange={(fields) => {
              if ("targetSchool" in fields)
                setValue("targetSchool", fields.targetSchool ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              if ("targetCampus" in fields)
                setValue("targetCampus", fields.targetCampus ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              if ("targetVendorId" in fields)
                setValue("targetVendorId", fields.targetVendorId ?? undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              if ("targetMenuItemId" in fields)
                setValue(
                  "targetMenuItemId",
                  fields.targetMenuItemId ?? undefined,
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  }
                )
            }}
          />

          {/* Card 3: Discount & Pricing Structure */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="border-b border-border/60 pb-2 text-base font-semibold text-foreground">
              Discount Structure
            </h2>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Discount Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={
                    discountType === "FIXED_AMOUNT" ? "default" : "outline"
                  }
                  onClick={() => setValue("discountType", "FIXED_AMOUNT")}
                  className="h-10 justify-center text-xs font-semibold"
                >
                  Flat Amount (₦)
                </Button>
                <Button
                  type="button"
                  variant={
                    discountType === "PERCENTAGE" ? "default" : "outline"
                  }
                  onClick={() => setValue("discountType", "PERCENTAGE")}
                  className="h-10 justify-center text-xs font-semibold"
                >
                  Percentage (%)
                </Button>
              </div>
            </div>

            {discountType === "FIXED_AMOUNT" ? (
              <div className="space-y-1.5">
                <Label
                  htmlFor="discountInNaira"
                  className="text-xs font-semibold"
                >
                  Flat Discount in Naira (₦) *
                </Label>
                <Input
                  id="discountInNaira"
                  type="number"
                  min={1}
                  step="any"
                  placeholder="500"
                  {...register("discountInNaira", {
                    setValueAs: (v) => (!v || isNaN(Number(v)) ? 0 : Number(v)),
                  })}
                />
                {errors.discountInNaira && (
                  <p className="text-xs text-destructive">
                    {errors.discountInNaira.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="discountPercentage"
                    className="text-xs font-semibold"
                  >
                    Discount Percentage (%) *
                  </Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    placeholder="20"
                    {...register("discountPercentage", {
                      setValueAs: (v) =>
                        !v || isNaN(Number(v)) ? null : Number(v),
                    })}
                  />
                  {errors.discountPercentage && (
                    <p className="text-xs text-destructive">
                      {errors.discountPercentage.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="maxDiscountInNaira"
                    className="text-xs font-semibold"
                  >
                    Max Percentage Cap (₦)
                  </Label>
                  <Input
                    id="maxDiscountInNaira"
                    type="number"
                    min={0}
                    step="any"
                    placeholder="No cap (Leave blank)"
                    {...register("maxDiscountInNaira", {
                      setValueAs: (v) =>
                        !v || isNaN(Number(v)) ? null : Number(v),
                    })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank for unlimited percentage discount (no cap), or
                    enter a maximum Naira amount.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <Label
                htmlFor="minOrderValueInNaira"
                className="text-xs font-semibold"
              >
                Minimum Food Order Value in Naira (₦)
              </Label>
              <Input
                id="minOrderValueInNaira"
                type="number"
                min={0}
                step="any"
                placeholder="No minimum (Leave blank)"
                {...register("minOrderValueInNaira", {
                  setValueAs: (v) =>
                    !v || isNaN(Number(v)) ? null : Number(v),
                })}
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank or set to 0 for no minimum order subtotal
                requirement.
              </p>
            </div>
          </div>

          {/* Card 3: Budget & Limits */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="border-b border-border/60 pb-2 text-base font-semibold text-foreground">
              Budget & Redemption Limits
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="budgetInNaira"
                  className="text-xs font-semibold"
                >
                  Allocated Subsidy Budget (₦) *
                </Label>
                <Input
                  id="budgetInNaira"
                  type="number"
                  min={10}
                  step="any"
                  placeholder="50000"
                  {...register("budgetInNaira", {
                    setValueAs: (v) => (!v || isNaN(Number(v)) ? 0 : Number(v)),
                  })}
                />
                {errors.budgetInNaira && (
                  <p className="text-xs text-destructive">
                    {errors.budgetInNaira.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="maxRedemptionsPerCustomer"
                  className="text-xs font-semibold"
                >
                  Uses Allowed Per Customer
                </Label>
                <Input
                  id="maxRedemptionsPerCustomer"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  placeholder="Unlimited (Leave blank)"
                  {...register("maxRedemptionsPerCustomer", {
                    setValueAs: (v) =>
                      !v || isNaN(Number(v)) ? null : Number(v),
                  })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave blank for unlimited uses per customer, or specify a
                  limit (e.g. 1 per user).
                </p>
                {errors.maxRedemptionsPerCustomer && (
                  <p className="text-xs text-destructive">
                    {errors.maxRedemptionsPerCustomer.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-semibold">
                  Enable Campaign
                </Label>
                <p className="text-xs text-muted-foreground">
                  Active promo codes can be applied immediately by customers at
                  checkout.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(val) => setValue("isActive", val)}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Financial Simulator & Actions */}
        <div className="space-y-6 lg:col-span-5">
          <div className="sticky top-6 space-y-6">
            <PromoFinancialSimulator
              discountType={discountType}
              discountInNaira={discountInNaira}
              discountPercentage={discountPercentage}
              maxDiscountInNaira={maxDiscountInNaira}
              budgetInNaira={budgetInNaira}
              minOrderValueInNaira={minOrderValueInNaira}
            />

            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Button
                type="submit"
                disabled={isBusy}
                className="flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold shadow-sm"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {isEdit ? "Saving Changes..." : "Creating Promo Code..."}
                    </span>
                  </>
                ) : (
                  <span>
                    {submitLabel ||
                      (isEdit ? "Save Changes" : "Create Promo Code")}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
