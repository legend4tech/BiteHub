"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Settings, Shield, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError } from "@/components/ui/field"
import apiClient from "@/lib/axios"
import {
  adminPasswordSchema,
  type AdminPasswordValues,
  globalSettingsSchema,
  type GlobalSettingsValues,
} from "@/lib/schemas"

// ─── Admin Settings Component ─────────────────────────────────────────────────

export function AdminSettings() {
  const queryClient = useQueryClient()

  // ── Password Form ──
  const passwordForm = useForm<AdminPasswordValues>({
    // Zod v4.4.x vs @hookform/resolvers version mismatch — same pattern as VendorPaymentForm.tsx
    resolver: zodResolver(
      adminPasswordSchema as never
    ) as unknown as Resolver<AdminPasswordValues>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const onPasswordSubmit = async (values: AdminPasswordValues) => {
    // Cross-field validation: password match check done here rather than in schema
    // to avoid ZodEffects input-type mismatch with zodResolver
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError("confirmPassword", {
        message: "Passwords don't match",
      })
      return
    }
    setIsChangingPassword(true)
    try {
      await apiClient.post("/admin/settings/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast.success(
        "Password changed successfully! A confirmation email has been sent."
      )
      passwordForm.reset()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  // ── Global Settings Form ──
  const { data: settingsData, isLoading: loadingSettings } =
    useQuery<GlobalSettingsValues>({
      queryKey: ["admin-global-settings"],
      queryFn: async () => (await apiClient.get("/admin/settings/global")).data,
    })

  const settingsForm = useForm<GlobalSettingsValues>({
    // Zod v4.4.x vs @hookform/resolvers version mismatch — same pattern as VendorPaymentForm.tsx
    resolver: zodResolver(
      globalSettingsSchema as never
    ) as unknown as Resolver<GlobalSettingsValues>,
    values: settingsData,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (values: GlobalSettingsValues) => {
      await apiClient.patch("/admin/settings/global", values)
    },
    onSuccess: () => {
      toast.success("Global settings updated")
      queryClient.invalidateQueries({ queryKey: ["admin-global-settings"] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Failed to update settings")
    },
  })

  const onSettingsSubmit = (values: GlobalSettingsValues) => {
    updateSettingsMutation.mutate(values)
  }

  // ── Manual Order Verification ──
  const [orderIdToVerify, setOrderIdToVerify] = useState("")
  const [isVerifyingOrder, setIsVerifyingOrder] = useState(false)

  const handleVerifyOrder = async () => {
    if (!orderIdToVerify.trim()) return
    setIsVerifyingOrder(true)
    try {
      const res = await apiClient.post(
        `/orders/${orderIdToVerify.trim()}/verify`
      )
      toast.success(res.data.message || "Order verified successfully")
      setOrderIdToVerify("")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || "Verification failed")
    } finally {
      setIsVerifyingOrder(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage admin account and global platform configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Security (Change Password) */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="size-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">Security</h2>
                <p className="text-sm text-muted-foreground">
                  Change your admin password
                </p>
              </div>
            </div>

            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <Field>
                <div className="flex justify-between">
                  <label className="text-sm font-medium">
                    Current Password
                  </label>
                  <FieldError
                    errors={[passwordForm.formState.errors.currentPassword]}
                  />
                </div>
                <Input
                  type="password"
                  {...passwordForm.register("currentPassword")}
                />
              </Field>

              <Field>
                <div className="flex justify-between">
                  <label className="text-sm font-medium">New Password</label>
                  <FieldError
                    errors={[passwordForm.formState.errors.newPassword]}
                  />
                </div>
                <Input
                  type="password"
                  {...passwordForm.register("newPassword")}
                />
              </Field>

              <Field>
                <div className="flex justify-between">
                  <label className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <FieldError
                    errors={[passwordForm.formState.errors.confirmPassword]}
                  />
                </div>
                <Input
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                />
              </Field>

              <Button
                type="submit"
                className="w-full"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </form>
          </div>

          {/* Manual Order Verification */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-confirmed/10 text-status-confirmed-foreground">
                <Search className="size-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  Order Recovery
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manually sync a stuck order with Monnify
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order ID</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. BH-XXXXXX-XXXX"
                    value={orderIdToVerify}
                    onChange={(e) => setOrderIdToVerify(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleVerifyOrder}
                    disabled={!orderIdToVerify.trim() || isVerifyingOrder}
                  >
                    {isVerifyingOrder ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  If a vendor reports a successful payment is showing as
                  pending, paste the Order ID here to forcefully sync the status
                  from Monnify.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Global Settings */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-pending/10 text-status-pending-foreground">
                <Settings className="size-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  Global Config
                </h2>
                <p className="text-sm text-muted-foreground">
                  Applies immediately platform-wide
                </p>
              </div>
            </div>

            {loadingSettings ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 rounded-xl bg-muted" />
                <div className="h-10 rounded-xl bg-muted" />
              </div>
            ) : (
              <form
                onSubmit={settingsForm.handleSubmit(
                  onSettingsSubmit as Parameters<
                    typeof settingsForm.handleSubmit
                  >[0]
                )}
                className="space-y-6"
              >
                <Field>
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">
                      Platform Fee Percentage (%)
                    </label>
                    <FieldError
                      errors={[
                        settingsForm.formState.errors.platformFeePercentage,
                      ]}
                    />
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    {...settingsForm.register("platformFeePercentage", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    The percentage commission taken from each order total before
                    passing the remainder to the vendor.
                  </p>
                </Field>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      Maintenance Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Enable to show a maintenance page to all users.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                      {...settingsForm.register("maintenanceMode")}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Save Global Settings
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
