"use client"

import { useState } from "react"
import Link from "next/link"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  UtensilsCrossed,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, Resolver } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { AuthPanel } from "@/components/shared/AuthPanel"
import { toast } from "sonner"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import { SuspendedAlert } from "@/components/shared/SuspendedAlert"
import Image from "next/image"

import { vendorLoginSchema, type VendorLoginValues } from "@/lib/schemas"

export default function VendorLoginPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)

  const form = useForm<VendorLoginValues>({
    resolver: zodResolver(
      vendorLoginSchema as never
    ) as unknown as Resolver<VendorLoginValues>,
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: VendorLoginValues) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please check your internet connection.")
      return
    }

    setLoading(true)
    setIsSuspended(false)
    try {
      const res = await signIn("vendor-login", {
        redirect: false,
        email: values.email.trim(),
        password: values.password,
      })

      if (res?.error) {
        const resCode = (res as { code?: string }).code

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
        // NextAuth returned an error URL instead of an error message
        toast.error(
          "An unexpected authentication error occurred. Please try again."
        )
      } else {
        toast.success("Login successful. Welcome back!")
        window.location.assign("/vendor/dashboard")
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      if (!navigator.onLine || err?.message?.toLowerCase().includes("fetch")) {
        toast.error("Network error. Please check your internet connection.")
      } else if (
        // signIn() throws this specific "Invalid URL" error when the proxy middleware
        // intercepts the request and returns a 429 JSON response that lacks NextAuth's internal fields.
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

  return (
    <main className="flex min-h-screen bg-background">
      <AuthPanel
        variant="vendor"
        bgImage="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
        badge="Vendor Dashboard"
        headline="Grow your Edibles<br/>business on campus"
        subline="Join the platform that connects your kitchen with hundreds of students every day."
        features={[
          { icon: ShoppingBag, text: "Manage orders in real-time" },
          { icon: UtensilsCrossed, text: "Build and update your menu easily" },
          { icon: TrendingUp, text: "Track sales and performance" },
          { icon: Star, text: "Reach hundreds of students daily" },
        ]}
        footerText="Empowering Campus Food Businesses"
      />

      {/* ── Right panel (form) ── */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to {APP_NAME}
          </Link>
          {/* Mobile brand */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <Image
              src={APP_LOGO_URL}
              alt={APP_NAME}
              width={36}
              height={36}
              className="h-9 w-auto rounded-lg object-contain"
            />
            <span className="font-heading text-2xl leading-none font-black tracking-tight text-foreground">
              Bite<span className="text-primary">Hub</span>
            </span>
          </div>
        </div>

        {/* Form centred */}
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-[400px]">
            {/* Heading */}
            <div className="mb-8">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
                <UtensilsCrossed className="size-6 text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to your vendor dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isSuspended && <SuspendedAlert type="vendor" />}
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
                      placeholder="vendor@example.com"
                      autoComplete="username"
                      aria-invalid={fieldState.invalid}
                      className="h-11"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                        href={`/vendor/forgot-password?email=${encodeURIComponent(form.getValues("email") || "")}`}
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
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
