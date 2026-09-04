"use client"

import { useState } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import {
  useVendorChangePassword,
  useVendorForgotPassword,
  useVendorChangeEmail,
} from "@/hooks/vendor/useVendorMutations"
import { signOut } from "next-auth/react"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import { Loader2, Eye, EyeOff } from "lucide-react"

import { changePasswordSchema, changeEmailSchema } from "@/lib/schemas"
import type { ChangePasswordValues, ChangeEmailValues } from "@/lib/schemas"

export function VendorSecurityForms({
  currentEmail,
}: {
  currentEmail: string
}) {
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)

  // --- Password Form ---
  const passwordForm = useForm<ChangePasswordValues>({
    // Zod v4.4.x vs @hookform/resolvers version mismatch — same pattern as VendorPaymentForm.tsx
    resolver: zodResolver(
      changePasswordSchema as never
    ) as unknown as Resolver<ChangePasswordValues>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  })

  const changePasswordMutation = useVendorChangePassword()

  const onPasswordSubmit = (values: ChangePasswordValues) => {
    setPasswordLoading(true)
    changePasswordMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Password changed. Please log in again.")
        setTimeout(() => {
          signOut({ callbackUrl: "/vendor/login" })
        }, 2000)
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } }
        toast.error(err.response?.data?.message || "Failed to change password")
      },
      onSettled: () => {
        setPasswordLoading(false)
      },
    })
  }

  const forgotPasswordMutation = useVendorForgotPassword()

  const handleForgotPassword = () => {
    setForgotPasswordLoading(true)
    forgotPasswordMutation.mutate(
      { email: currentEmail },
      {
        onSuccess: () => {
          toast.success("A password reset link has been sent to your email.")
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } }
          toast.error(
            err.response?.data?.message || "Failed to send reset link"
          )
        },
        onSettled: () => {
          setForgotPasswordLoading(false)
        },
      }
    )
  }

  const emailForm = useForm<ChangeEmailValues>({
    // Zod v4.4.x vs @hookform/resolvers version mismatch — same pattern as VendorPaymentForm.tsx
    resolver: zodResolver(
      changeEmailSchema as never
    ) as unknown as Resolver<ChangeEmailValues>,
    defaultValues: {
      newEmail: "",
    },
    mode: "onTouched",
  })

  const changeEmailMutation = useVendorChangeEmail()

  const onEmailSubmit = (values: ChangeEmailValues) => {
    setEmailLoading(true)
    changeEmailMutation.mutate(values, {
      onSuccess: (data: { message?: string }) => {
        toast.success(
          data.message || "Confirmation link sent to your new email."
        )
        emailForm.reset()
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } }
        toast.error(
          err.response?.data?.message || "Failed to initiate email change"
        )
      },
      onSettled: () => {
        setEmailLoading(false)
      },
    })
  }

  return (
    <div className="space-y-12">
      {/* Change Email Section */}
      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-lg font-bold">
            Change Email Address
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We will send a confirmation link to your new email. Your current
            email remains active until confirmed.
          </p>
        </div>

        <form
          onSubmit={emailForm.handleSubmit(onEmailSubmit)}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Current Email
            </label>
            <Input
              value={currentEmail}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          <Controller
            name="newEmail"
            control={emailForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>New Email Address</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="newemail@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button type="submit" variant="hero" disabled={emailLoading}>
            {emailLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Request Email Change
          </Button>
        </form>
      </section>

      <hr className="border-border" />

      {/* Change Password Section */}
      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-lg font-bold">Change Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your account password. You will be signed out after a
            successful change.
          </p>
        </div>

        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-5"
        >
          <Controller
            name="currentPassword"
            control={passwordForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Current Password</FieldLabel>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
                      <Loader2 className="mr-1 inline-block size-3 animate-spin" />
                    ) : null}
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="newPassword"
            control={passwordForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new strong password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <PasswordStrengthMeter password={field.value} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={passwordForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Confirm New Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button type="submit" variant="hero" disabled={passwordLoading}>
            {passwordLoading && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Update Password
          </Button>
        </form>
      </section>
    </div>
  )
}
