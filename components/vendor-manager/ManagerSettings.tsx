"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Shield, Loader2, User, Eye, EyeOff } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError } from "@/components/ui/field"
import {
  useAdminUpdatePassword,
  useAdminUpdateProfile,
} from "@/hooks/mutations/useAdminMutations"
import { adminPasswordSchema, type AdminPasswordValues } from "@/lib/schemas"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ManagerSettings() {
  const { update } = useSession()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordForm = useForm<AdminPasswordValues>({
    resolver: zodResolver(
      adminPasswordSchema as never
    ) as unknown as Resolver<AdminPasswordValues>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  })

  const updatePasswordMutation = useAdminUpdatePassword()
  const updateProfileMutation = useAdminUpdateProfile()

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
          toast.success("Password changed successfully!")
          passwordForm.reset()
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "Failed to change password")
        },
      }
    )
  }

  const onProfileSubmit = (values: ProfileValues) => {
    updateProfileMutation.mutate(
      { name: values.name },
      {
        onSuccess: async () => {
          await update({ name: values.name })
          toast.success("Profile name updated successfully!")
          profileForm.reset({ name: values.name })
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: string } } }
          toast.error(err.response?.data?.error || "Failed to update profile")
        },
      }
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your vendor manager profile and security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Security (Change Password) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">
                Change your account password
              </p>
            </div>
          </div>

          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <Field>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Current Password</label>
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
              <PasswordStrengthMeter
                password={passwordForm.watch("newPassword") || ""}
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

        {/* Profile (Change Username) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-confirmed/10 text-status-confirmed-foreground">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">
                Update your display name
              </p>
            </div>
          </div>

          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <Field>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Display Name</label>
                <FieldError errors={[profileForm.formState.errors.name]} />
              </div>
              <Input
                placeholder="Enter your new name"
                {...profileForm.register("name")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This is the name that admins and others see.
              </p>
            </Field>

            <Button
              type="submit"
              className="w-full"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Update Profile
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
