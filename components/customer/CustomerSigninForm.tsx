"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, Resolver } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { customerLoginSchema, type CustomerLoginValues } from "@/lib/schemas"
import { SuspendedAlert } from "@/components/shared/SuspendedAlert"
import { CustomerOtpStep } from "./CustomerOtpStep"

export function CustomerSigninForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  const form = useForm<CustomerLoginValues>({
    resolver: zodResolver(
      customerLoginSchema as never
    ) as unknown as Resolver<CustomerLoginValues>,
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: CustomerLoginValues) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please check your internet connection.")
      return
    }

    setLoading(true)
    setIsSuspended(false)
    try {
      const res = await signIn("customer-login", {
        redirect: false,
        email: values.email.trim(),
        password: values.password,
      })

      if (res?.error) {
        const resCode = (res as { code?: string }).code

        if (resCode === "EmailNotVerified") {
          const email = values.email.trim()
          setUnverifiedEmail(email)
          // Trigger OTP resend so they have a fresh code ready
          import("axios").then(({ default: axios }) => {
            axios
              .post("/api/auth/customer/resend-otp", { email })
              .catch(() => {})
          })
          toast.info("Please enter the verification code sent to your email.")
          return
        }

        if (resCode === "AccountSuspended") {
          setIsSuspended(true)
          return
        }
        if (resCode === "RateLimitExceeded") {
          toast.error(
            "Too many login attempts. Please wait a minute and try again."
          )
        } else if (
          res.error === "Configuration" ||
          res.error === "AccessDenied"
        ) {
          toast.error("Authentication service error. Please try again.")
        } else {
          toast.error("Invalid email or password.")
        }
      } else if (!res?.ok && res?.status === 429) {
        // Proxy-level IP rate limit — signIn() received 429 from middleware
        toast.error(
          "Too many login attempts. Please wait a minute and try again."
        )
      } else if (res?.url && res.url.includes("/api/auth/error")) {
        toast.error(
          "An unexpected authentication error occurred. Please try again."
        )
      } else {
        toast.success("Login successful. Welcome back!")
        window.location.assign(redirect)
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      if (!navigator.onLine || err?.message?.toLowerCase().includes("fetch")) {
        toast.error("Network error. Please check your internet connection.")
      } else if (
        err?.message?.includes("429") ||
        err?.message?.toLowerCase().includes("too many") ||
        err?.message?.includes("Invalid URL")
      ) {
        toast.error(
          "Too many login attempts. Please wait a minute and try again."
        )
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (unverifiedEmail) {
    return (
      <CustomerOtpStep
        email={unverifiedEmail}
        onVerified={async () => {
          const res = await signIn("customer-login", {
            redirect: false,
            email: unverifiedEmail,
            password: form.getValues("password"),
          })
          if (!res?.error) {
            toast.success("Email verified! Welcome back.")
            window.location.assign(redirect)
          } else {
            setUnverifiedEmail(null)
            toast.success(
              "Email verified! Please enter your password to log in."
            )
          }
        }}
        onBack={() => setUnverifiedEmail(null)}
      />
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {isSuspended && <SuspendedAlert type="customer" />}
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              aria-invalid={fieldState.invalid}
              className="h-11"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Link
                href={`/customer/forgot-password?email=${encodeURIComponent(form.getValues("email") || "")}`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPw ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button
        type="submit"
        variant="hero"
        className="mt-2 h-11 w-full text-base"
        disabled={loading}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
