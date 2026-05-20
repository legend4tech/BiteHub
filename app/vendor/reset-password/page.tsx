"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, ShieldAlert, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";
import axios from "axios";
import { strongPasswordSchema } from "@/lib/schemas";
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter";

const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [invalidParams, setInvalidParams] = useState(false);
  const { status } = useSession();
  const isAuth = status === "authenticated";

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setInvalidParams(true);
      toast.error("Invalid or expired password reset link.");
    }
  }, [token, email]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema as any),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const passwordValue = useWatch({ control: form.control, name: "password" });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token || !email) {
      toast.error("Missing reset parameters. Try requesting a new link.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/vendor/reset-password", {
        token,
        email: decodeURIComponent(email),
        password: values.password,
      });

      toast.success("Password reset successful! Please log in.");
      
      if (isAuth) {
        setTimeout(() => {
          signOut({ callbackUrl: "/vendor/login" });
        }, 2000);
      } else {
        router.replace("/vendor/login");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to reset password. Link may be expired.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={isAuth ? "py-6" : "min-h-screen flex items-center justify-center bg-background px-6 py-12 relative overflow-hidden"}>
      {/* Background decorations */}
      {!isAuth && (
        <>
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none" />
        </>
      )}

      <div className={isAuth ? "w-full max-w-md" : "w-full max-w-[440px] z-10"}>
        {/* Brand Header */}
        {!isAuth ? (
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="flex items-center gap-2 mb-6">
              <img
                src={APP_LOGO_URL}
                alt={APP_NAME}
                className="h-10 w-auto object-contain rounded-lg"
              />
              <span className="font-heading font-black text-2xl tracking-tight text-foreground">
                Bite<span className="text-primary">Hub</span>
              </span>
            </div>

            <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center mb-4">
              {invalidParams ? (
                <ShieldAlert className="size-6 text-red-500" />
              ) : (
                <Lock className="size-6 text-primary" />
              )}
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              {invalidParams ? "Invalid Link" : "Reset Password"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-sm">
              {invalidParams
                ? "This link is incomplete, invalid, or expired. Please request a new password reset."
                : "Create a strong new password for your vendor account."}
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold">
              {invalidParams ? "Invalid Link" : "Reset Password"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {invalidParams
                ? "This link is incomplete, invalid, or expired."
                : "Create a strong new password for your vendor account."}
            </p>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
          {invalidParams ? (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reset links expire after 15 minutes or can only be used once.
              </p>
              <Button asChild variant="outline" className="w-full h-11">
                <Link href="/vendor/forgot-password">Request New Link</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id={field.name}
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="h-11 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {/* Live strength meter */}
                    <PasswordStrengthMeter password={passwordValue ?? ""} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Confirm Password */}
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Confirm New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id={field.name}
                        type={showConfirmPw ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="h-11 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirmPw ? "Hide password" : "Show password"}
                      >
                        {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button
                type="submit"
                variant="hero"
                className="w-full h-11 text-base mt-2"
                disabled={loading}
              >
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                {loading ? "Resetting password…" : "Reset Password"}
              </Button>
            </form>
          )}
        </div>

        {/* Back Link */}
        {!isAuth && (
          <div className="mt-6 text-center">
            <Link
              href="/vendor/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
