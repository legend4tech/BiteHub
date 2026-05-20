"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import axios from "axios";
import { signOut } from "next-auth/react";
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { strongPasswordSchema } from "@/lib/schemas";

// --- Schemas ---

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const changeEmailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address").toLowerCase(),
});

type ChangeEmailValues = z.infer<typeof changeEmailSchema>;

export function VendorSecurityForms({ currentEmail }: { currentEmail: string }) {
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // --- Password Form ---
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema as any),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const onPasswordSubmit = async (values: ChangePasswordValues) => {
    setPasswordLoading(true);
    try {
      await axios.post("/api/vendor/account/change-password", values);
      toast.success("Password changed. Please log in again.");
      setTimeout(() => {
        signOut({ callbackUrl: "/vendor/login" });
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotPasswordLoading(true);
    try {
      await axios.post("/api/vendor/forgot-password", { email: currentEmail });
      toast.success("A password reset link has been sent to your email.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // --- Email Form ---
  const emailForm = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema as any),
    defaultValues: {
      newEmail: "",
    },
    mode: "onTouched",
  });

  const onEmailSubmit = async (values: ChangeEmailValues) => {
    setEmailLoading(true);
    try {
      const response = await axios.post("/api/vendor/account/change-email", values);
      toast.success(response.data.message || "Confirmation link sent to your new email.");
      emailForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to initiate email change");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Change Email Section */}
      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-lg font-bold">Change Email Address</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We will send a confirmation link to your new email. Your current email remains active until confirmed.
          </p>
        </div>

        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Current Email</label>
            <Input value={currentEmail} disabled className="bg-muted text-muted-foreground" />
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
          <p className="text-sm text-muted-foreground mt-1">
            Update your account password. You will be signed out after a successful change.
          </p>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
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
                    className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? <Loader2 className="mr-1 size-3 animate-spin inline-block" /> : null}
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    aria-invalid={fieldState.invalid}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    aria-invalid={fieldState.invalid}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                <PasswordStrengthMeter password={field.value} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={passwordForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Confirm New Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    aria-invalid={fieldState.invalid}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type="submit" variant="hero" disabled={passwordLoading}>
            {passwordLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </section>
    </div>
  );
}
