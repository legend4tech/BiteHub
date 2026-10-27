"use client"

import { useState } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useGlobalSettings } from "@/hooks/shared/useGlobalSettings"
import { Settings, Shield, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError } from "@/components/ui/field"
import {
  useAdminUpdatePassword,
  useAdminUpdateGlobalSettings,
} from "@/hooks/admin/useAdminMutations"
import { AdminOrderRecovery } from "./AdminOrderRecovery"
import {
  adminPasswordSchema,
  type AdminPasswordValues,
  globalSettingsSchema,
  type GlobalSettingsValues,
} from "@/lib/schemas"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import { PlatformFeeOtpDialog } from "./PlatformFeeOtpDialog"
import apiClient from "@/lib/axios"

// ─── Admin Settings Component ─────────────────────────────────────────────────

export function AdminSettings() {
  const queryClient = useQueryClient()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const newPasswordValue = useWatch({
    control: passwordForm.control,
    name: "newPassword",
  })

  const updatePasswordMutation = useAdminUpdatePassword()

  const onPasswordSubmit = (values: AdminPasswordValues) => {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError("confirmPassword", {
        message: "Passwords don't match",
      })
      return
    }

    updatePasswordMutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success(
            "Password changed successfully! A confirmation email has been sent."
          )
          passwordForm.reset()
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "Failed to change password")
        },
      }
    )
  }

  // ── Global Settings Form ──
  const { data: currentSettings, isLoading } = useGlobalSettings()

  const settingsForm = useForm<GlobalSettingsValues>({
    // Zod v4.4.x vs @hookform/resolvers version mismatch — same pattern as VendorPaymentForm.tsx
    resolver: zodResolver(
      globalSettingsSchema as never
    ) as unknown as Resolver<GlobalSettingsValues>,
    values: currentSettings,
  })

  const updateSettingsMutation = useAdminUpdateGlobalSettings()

  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false)
  const [pendingValues, setPendingValues] =
    useState<GlobalSettingsValues | null>(null)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)

  const handleSettingsSubmit = async (values: GlobalSettingsValues) => {
    // If platformFeePercentage is modified, prompt for 2FA OTP verification
    if (
      currentSettings &&
      values.platformFeePercentage !== currentSettings.platformFeePercentage
    ) {
      setPendingValues(values)
      setIsRequestingOtp(true)
      try {
        await apiClient.post("/admin/settings/global/request-otp")
        toast.info(
          "A security verification code has been sent to your registered email."
        )
        setIsOtpDialogOpen(true)
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } }
        toast.error(
          error.response?.data?.error || "Failed to request verification code"
        )
      } finally {
        setIsRequestingOtp(false)
      }
      return
    }

    updateSettingsMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Global settings updated")
        queryClient.invalidateQueries({ queryKey: ["admin-global-settings"] })
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { error?: string } } }
        toast.error(err.response?.data?.error || "Failed to update settings")
      },
    })
  }

  const handleOtpConfirm = (otp: string) => {
    if (!pendingValues) return
    updateSettingsMutation.mutate(
      { ...pendingValues, otp },
      {
        onSuccess: () => {
          toast.success("Global settings updated successfully")
          setIsOtpDialogOpen(false)
          setPendingValues(null)
          queryClient.invalidateQueries({
            queryKey: ["admin-global-settings"],
          })
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "Failed to update settings")
        },
      }
    )
  }

  const onSettingsSubmit = (values: GlobalSettingsValues) => {
    handleSettingsSubmit(values)
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
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register("currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </Field>

              <Field>
                <div className="flex justify-between">
                  <label className="text-sm font-medium">New Password</label>
                  <FieldError
                    errors={[passwordForm.formState.errors.newPassword]}
                  />
                </div>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    {...passwordForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPasswordValue || ""} />
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
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                className="w-full"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </form>
          </div>

          {/* Manual Order Verification */}
          <AdminOrderRecovery />
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

            {isLoading ? (
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
                      className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                      {...settingsForm.register("maintenanceMode")}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateSettingsMutation.isPending || isRequestingOtp}
                >
                  {updateSettingsMutation.isPending || isRequestingOtp ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Save Global Settings
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <PlatformFeeOtpDialog
        isOpen={isOtpDialogOpen}
        onClose={() => {
          setIsOtpDialogOpen(false)
          setPendingValues(null)
        }}
        onConfirm={handleOtpConfirm}
        isSubmitting={updateSettingsMutation.isPending}
        targetFeePercentage={pendingValues?.platformFeePercentage ?? 0}
      />
    </div>
  )
}
