"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  rewardCampaignFormSchema,
  RewardCampaignFormValues,
} from "@/lib/schemas/admin"
import { useAdminVendors } from "@/hooks/admin/useAdminVendors"
import { MenuItem } from "@/types/vendor"
import apiClient from "@/lib/axios"
import { getSchoolOptions, getCampusOptions } from "@/lib/config/campus"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPrice } from "@/lib/format"
import { InfiniteScrollTrigger } from "@/components/shared/InfiniteScrollTrigger"

export interface CampaignFormProps {
  defaultValues?: Partial<RewardCampaignFormValues>
  onSubmit: (data: RewardCampaignFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

export function CampaignForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Campaign",
}: CampaignFormProps) {
  const { data: vendors, isLoading: isVendorsLoading } = useAdminVendors()

  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    defaultValues?.vendorId || ""
  )
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const form = useForm<RewardCampaignFormValues>({
    // Type mismatch occurs because Zod's .default() makes fields optional in z.input but required in z.infer.
    // react-hook-form expects exact matching, so we cast the resolver.
    // @ts-expect-error: type mismatch because of default values in Zod schema
    resolver: zodResolver(rewardCampaignFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      actionType: defaultValues?.actionType || "ORDER_COMPLETED",
      targetCount: defaultValues?.targetCount || 1,
      minOrderValueInKobo: defaultValues?.minOrderValueInKobo || 0,
      rewardType: defaultValues?.rewardType || "BITEHUB_COINS",
      rewardValueInKobo: defaultValues?.rewardValueInKobo ?? 0,
      maxBeneficiaries: defaultValues?.maxBeneficiaries ?? 10,
      budgetAllocatedInKobo: defaultValues?.budgetAllocatedInKobo ?? 0,
      isActive:
        defaultValues?.isActive !== undefined ? defaultValues.isActive : true,
      maxCompletionsPerUser: defaultValues?.maxCompletionsPerUser ?? 1,
      startDate: defaultValues?.startDate
        ? new Date(defaultValues.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      endDate: defaultValues?.endDate
        ? new Date(defaultValues.endDate).toISOString().split("T")[0]
        : undefined,
      vendorId: defaultValues?.vendorId || undefined,
      menuItemId: defaultValues?.menuItemId || undefined,
      targetSchool: defaultValues?.targetSchool || "",
      targetCampus: defaultValues?.targetCampus || "",
    },
  })

  const watchTargetSchool = useWatch({
    control: form.control,
    name: "targetSchool",
  })
  const watchTargetCampus = useWatch({
    control: form.control,
    name: "targetCampus",
  })

  const filteredVendors = vendors?.filter((vendor) => {
    if (watchTargetSchool && vendor.school !== watchTargetSchool) return false
    if (watchTargetCampus && vendor.campus !== watchTargetCampus) return false
    return true
  })

  const watchRewardType = useWatch({
    control: form.control,
    name: "rewardType",
  })
  const watchMaxBeneficiaries = useWatch({
    control: form.control,
    name: "maxBeneficiaries",
  })
  const watchRewardValue = useWatch({
    control: form.control,
    name: "rewardValueInKobo",
  })
  const watchMenuItemId = useWatch({
    control: form.control,
    name: "menuItemId",
  })
  const watchActionType = useWatch({
    control: form.control,
    name: "actionType",
  })
  const watchMaxCompletions = useWatch({
    control: form.control,
    name: "maxCompletionsPerUser",
  })
  const watchBudgetAllocated = useWatch({
    control: form.control,
    name: "budgetAllocatedInKobo",
  })

  const fetchMenuItems = async (currentPage = 1) => {
    if (!selectedVendorId) {
      setMenuItems([])
      return
    }
    setIsLoadingMore(true)
    try {
      const res = await apiClient.get(
        `/menus?vendorId=${selectedVendorId}&page=${currentPage}&limit=30`
      )
      const fetchedItems = res.data || []
      if (currentPage === 1) {
        setMenuItems(fetchedItems)
      } else {
        setMenuItems((prev) => [...prev, ...fetchedItems])
      }
      setHasMore(fetchedItems.length === 30)
    } catch {
      if (currentPage === 1) setMenuItems([])
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Fetch menu items when vendor is selected
  useEffect(() => {
    setTimeout(() => {
      setPage(1)
      fetchMenuItems(1)
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendorId])

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMenuItems(nextPage)
    }
  }

  // Auto-calc budget
  useEffect(() => {
    if (watchRewardType === "BITEHUB_COINS") {
      const budget = (watchRewardValue || 0) * (watchMaxBeneficiaries || 0)
      form.setValue("budgetAllocatedInKobo", budget)
    } else if (watchRewardType === "FREE_MEAL" && watchMenuItemId) {
      const selectedItem = menuItems.find((item) => item.id === watchMenuItemId)
      if (selectedItem) {
        const budget =
          (selectedItem.priceInKobo || 0) * (watchMaxBeneficiaries || 0)
        form.setValue("budgetAllocatedInKobo", budget)
      }
    }
  }, [
    watchRewardType,
    watchRewardValue,
    watchMaxBeneficiaries,
    watchMenuItemId,
    menuItems,
    form,
  ])

  return (
    <form
      onSubmit={form.handleSubmit((data) =>
        onSubmit(data as unknown as RewardCampaignFormValues)
      )}
      className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10"
    >
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 space-y-3">
          <Label className="text-sm font-semibold">
            Campaign Title <span className="text-destructive">*</span>
          </Label>
          <Input
            {...form.register("title")}
            placeholder="e.g. Free Burger for 5 Referrals"
            className="h-12 rounded-xl bg-muted/50"
          />
          {form.formState.errors.title && (
            <span className="text-xs text-destructive">
              {form.formState.errors.title.message as string}
            </span>
          )}
        </div>

        <div className="col-span-2 space-y-3">
          <Label className="text-sm font-semibold">Description</Label>
          <Textarea
            {...form.register("description")}
            placeholder="Get a free burger when you refer 5 friends!"
            className="min-h-[100px] resize-y rounded-xl bg-muted/50"
            maxLength={80}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Keep it short and punchy (max 80 chars).
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            Action Required <span className="text-destructive">*</span>
          </Label>
          <Select
            onValueChange={(
              val:
                | "REFERRAL_SIGNUP"
                | "REFERRAL_FIRST_ORDER"
                | "ORDER_COMPLETED"
            ) => form.setValue("actionType", val)}
            defaultValue={form.getValues("actionType")}
          >
            <SelectTrigger className="h-12 w-full rounded-xl bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="REFERRAL_SIGNUP">
                Referral (Signup)
                <span className="ml-2 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 uppercase">
                  Advanced
                </span>
              </SelectItem>
              <SelectItem value="REFERRAL_FIRST_ORDER">
                Referral (First Order)
              </SelectItem>
              <SelectItem value="ORDER_COMPLETED">Order Completed</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.actionType && (
            <span className="text-xs text-destructive">
              {form.formState.errors.actionType.message as string}
            </span>
          )}
          {watchActionType === "REFERRAL_SIGNUP" && (
            <div className="mt-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
              <span className="font-semibold">Info:</span> Signup campaigns
              reward any referral. Pair with a tight Max Beneficiaries limit to
              control cost.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            Target Count <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            {...form.register("targetCount", { valueAsNumber: true })}
            className="h-12 rounded-xl bg-muted/50"
          />
          {form.formState.errors.targetCount && (
            <span className="text-xs text-destructive">
              {form.formState.errors.targetCount.message as string}
            </span>
          )}
        </div>

        <div className="col-span-2 mt-4 space-y-3 border-t pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold">Target Audience / Location</h3>
            <p className="text-xs text-muted-foreground">
              Leave as &quot;All&quot; for a general campaign across all
              campuses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Target School</Label>
              <Select
                onValueChange={(val) => {
                  form.setValue("targetSchool", val === "all" ? "" : val)
                  form.setValue("targetCampus", "")
                  form.setValue("vendorId", "")
                  form.setValue("menuItemId", "")
                  setSelectedVendorId("")
                }}
                defaultValue={form.getValues("targetSchool") || "all"}
                value={watchTargetSchool || "all"}
              >
                <SelectTrigger className="h-12 w-full rounded-xl bg-muted/50">
                  <SelectValue placeholder="All Schools" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All Schools</SelectItem>
                  {getSchoolOptions().map((school) => (
                    <SelectItem key={school.value} value={school.value}>
                      {school.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Target Campus</Label>
              <Select
                disabled={!watchTargetSchool}
                onValueChange={(val) => {
                  form.setValue("targetCampus", val === "all" ? "" : val)
                  form.setValue("vendorId", "")
                  form.setValue("menuItemId", "")
                  setSelectedVendorId("")
                }}
                defaultValue={form.getValues("targetCampus") || "all"}
                value={watchTargetCampus || "all"}
              >
                <SelectTrigger className="h-12 w-full rounded-xl bg-muted/50">
                  <SelectValue
                    placeholder={
                      !watchTargetSchool
                        ? "Select a school first"
                        : "All Campuses"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All Campuses</SelectItem>
                  {watchTargetSchool &&
                    getCampusOptions(watchTargetSchool).map((campus) => (
                      <SelectItem key={campus.value} value={campus.value}>
                        {campus.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="col-span-2 mt-4 space-y-4 border-t pt-6">
          <Label className="text-sm font-semibold">
            Reward Type <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={
                watchRewardType === "BITEHUB_COINS" ? "default" : "outline"
              }
              onClick={() => form.setValue("rewardType", "BITEHUB_COINS")}
              className="h-12 flex-1 rounded-xl font-bold shadow-sm"
            >
              BiteHub Coins
            </Button>
            <Button
              type="button"
              variant={watchRewardType === "FREE_MEAL" ? "default" : "outline"}
              onClick={() => form.setValue("rewardType", "FREE_MEAL")}
              className="h-12 flex-1 rounded-xl font-bold shadow-sm"
            >
              Free Meal
            </Button>
          </div>
        </div>

        {watchRewardType === "BITEHUB_COINS" ? (
          <div className="col-span-2 space-y-3">
            <Label className="text-sm font-semibold">
              Coin Reward Value <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              {...form.register("rewardValueInKobo", { valueAsNumber: true })}
              className="h-12 rounded-xl bg-muted/50"
            />
            {form.formState.errors.rewardValueInKobo && (
              <span className="text-xs text-destructive">
                {form.formState.errors.rewardValueInKobo.message as string}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Select Vendor <span className="text-destructive">*</span>
              </Label>
              <Select
                disabled={isVendorsLoading}
                onValueChange={(val) => {
                  setSelectedVendorId(val)
                  form.setValue("vendorId", val)
                  form.setValue("menuItemId", "") // Reset menu item
                }}
                defaultValue={form.getValues("vendorId")}
              >
                <SelectTrigger className="h-12 w-full rounded-xl bg-muted/50">
                  <SelectValue
                    placeholder={
                      isVendorsLoading ? "Loading Vendors..." : "Select Vendor"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  {filteredVendors?.map((v: { id: string; name: string }) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vendorId && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.vendorId.message as string}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Select Menu Item <span className="text-destructive">*</span>
              </Label>
              <Select
                disabled={
                  !selectedVendorId ||
                  menuItems.length === 0 ||
                  (isLoadingMore && page === 1)
                }
                onValueChange={(val) => form.setValue("menuItemId", val)}
                defaultValue={form.getValues("menuItemId")}
              >
                <SelectTrigger className="h-12 w-full rounded-xl bg-muted/50">
                  <SelectValue
                    placeholder={
                      isLoadingMore && page === 1
                        ? "Loading Menu..."
                        : selectedVendorId && menuItems.length === 0
                          ? "No items found for vendor"
                          : "Select Item"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  {isLoadingMore && page === 1 ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-center text-sm text-muted-foreground">
                      Loading menus...
                    </div>
                  ) : (
                    <>
                      {menuItems.length === 0 && !isLoadingMore && (
                        <div className="flex items-center justify-center py-4 text-center text-sm text-muted-foreground">
                          This vendor has no menu items yet.
                        </div>
                      )}
                      {menuItems.map((item: MenuItem) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} — {formatPrice(item.priceInKobo)}
                        </SelectItem>
                      ))}
                      {menuItems.length > 0 && hasMore && (
                        <div className="py-2">
                          <InfiniteScrollTrigger
                            hasNextPage={hasMore}
                            isFetchingNextPage={isLoadingMore}
                            fetchNextPage={handleLoadMore}
                            endText=""
                            loadingText="Loading..."
                          />
                        </div>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.menuItemId && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.menuItemId.message as string}
                </span>
              )}
            </div>
          </>
        )}

        <div className="col-span-2 mt-4 space-y-3 border-t pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Reward Expiry (Days) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                {...form.register("rewardExpiryDays", { valueAsNumber: true })}
                className="h-12 rounded-xl bg-muted/50"
              />
              {form.formState.errors.rewardExpiryDays && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.rewardExpiryDays.message as string}
                </span>
              )}
              <p className="text-xs font-medium text-muted-foreground">
                How many days until the coins/voucher expire?
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 border-t pt-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Max Beneficiaries <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                {...form.register("maxBeneficiaries", { valueAsNumber: true })}
                className="h-12 rounded-xl bg-muted/50"
              />
              {form.formState.errors.maxBeneficiaries && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.maxBeneficiaries.message as string}
                </span>
              )}
              <p className="text-xs font-medium text-muted-foreground">
                How many users total can claim this reward?
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Max Claims Per User <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                {...form.register("maxCompletionsPerUser", {
                  setValueAs: (v) =>
                    v === "" || Number.isNaN(Number(v)) ? 0 : Number(v),
                })}
                className="h-12 rounded-xl bg-muted/50"
              />
              {form.formState.errors.maxCompletionsPerUser && (
                <span className="text-xs text-destructive">
                  {
                    form.formState.errors.maxCompletionsPerUser
                      .message as string
                  }
                </span>
              )}
              <p className="text-xs font-medium text-muted-foreground">
                How many times can a single user claim it? (0 = unlimited)
              </p>
              {watchMaxCompletions === 0 &&
                (watchActionType === "REFERRAL_SIGNUP" ||
                  watchActionType === "REFERRAL_FIRST_ORDER") && (
                  <div className="mt-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                    ⚠️ <span className="font-semibold">Unlimited claims</span> —
                    set a Max Beneficiaries cap to control total spend.
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-2 rounded-2xl border bg-primary/5 p-6 shadow-inner">
          <Label className="text-sm font-semibold text-primary">
            Auto-Calculated Budget (Total Liability)
          </Label>
          <p className="text-3xl font-black text-primary">
            {formatPrice(watchBudgetAllocated)}
          </p>
          <p className="text-xs font-medium text-primary/70">
            This is the maximum BiteHub will spend on this campaign.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="rounded-full shadow-md"
        >
          {isSubmitting ? "Processing..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
