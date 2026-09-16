"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form"
import Image from "next/image"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/schemas"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import type { UseMutationResult } from "@tanstack/react-query"

export interface SharedResetPasswordProps {
  userType: "vendor" | "customer" | "admin"
  loginHref: string
  mutation: UseMutationResult<
    unknown,
    Error,
    Omit<ResetPasswordFormValues, "confirmPassword"> & {
      token: string
      email: string
    },
    unknown
  >
}

export function SharedResetPassword({
  userType,
  loginHref,
  mutation,
}: SharedResetPasswordProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [invalidParams, setInvalidParams] = useState(false)
  const { status } = useSession()
  const isAuth = status === "authenticated"

  const token = searchParams.get("token")
  const email = searchParams.get("email")

  useEffect(() => {
    if (!token || !email) {
      setTimeout(() => {
        setInvalidParams(true)
        toast.error("Invalid or expired password reset link.")
      }, 0)
    }
  }, [token, email])

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(
      resetPasswordFormSchema as never
    ) as unknown as Resolver<ResetPasswordFormValues>,
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  })

  const passwordValue = useWatch({ control: form.control, name: "password" })

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token || !email) {
      toast.error("Missing reset parameters. Try requesting a new link.")
      return
    }

    setLoading(true)
    mutation.mutate(
      {
        token,
        email: decodeURIComponent(email),
        password: values.password,
      },
      {
        onSuccess: () => {
          toast.success("Password reset successful! Please log in.")
          if (isAuth) {
            setTimeout(() => {
              signOut({ callbackUrl: loginHref })
            }, 2000)
          } else {
            router.replace(loginHref)
          }
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } }
          const errorMsg =
            err.response?.data?.message ||
            "Failed to reset password. Link may be expired."
          toast.error(errorMsg)
        },
        onSettled: () => {
          setLoading(false)
        },
      }
    )
  }

  return (
    <main
      className={
        isAuth
          ? "py-6"
          : "relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12"
      }
    >
      {/* Background decorations */}
      {!isAuth && (
        <>
          <div className="pointer-events-none absolute top-0 left-0 -mt-20 -ml-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 -mr-20 -mb-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </>
      )}

      <div className={isAuth ? "w-full max-w-md" : "z-10 w-full max-w-[440px]"}>
        {/* Brand Header */}
        {!isAuth ? (
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2">
              <Image
                src={APP_LOGO_URL}
                alt={APP_NAME}
                width={40}
                height={40}
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className="font-heading text-2xl font-black tracking-tight text-foreground">
                Bite<span className="text-primary">Hub</span>
              </span>
            </div>

            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
              {invalidParams ? (
                <ShieldAlert className="size-6 text-destructive" />
              ) : (
                <Lock className="size-6 text-primary" />
              )}
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              {invalidParams ? "Invalid Link" : "Reset Password"}
            </h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {invalidParams
                ? "This link is incomplete, invalid, or expired. Please request a new password reset."
                : `Create a strong new password for your ${userType} account.`}
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold">
              {invalidParams ? "Invalid Link" : "Reset Password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {invalidParams
                ? "This link is incomplete, invalid, or expired."
                : `Create a strong new password for your ${userType} account.`}
            </p>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
          {invalidParams ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Reset links expire after 15 minutes or can only be used once.
              </p>
              <Button asChild variant="outline" className="h-11 w-full">
                <Link href={loginHref.replace("login", "forgot-password")}>
                  Request New Link
                </Link>
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
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {/* Live strength meter */}
                    <PasswordStrengthMeter password={passwordValue ?? ""} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Confirm Password */}
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Confirm New Password
                    </FieldLabel>
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
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showConfirmPw ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirmPw ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                type="submit"
                variant="hero"
                className="mt-2 h-11 w-full text-base"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? "Resetting password…" : "Reset Password"}
              </Button>
            </form>
          )}
        </div>

        {/* Back Link */}
        {!isAuth && (
          <div className="mt-6 text-center">
            <Link
              href={loginHref}
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
