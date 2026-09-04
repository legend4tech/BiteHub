"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  ShoppingBag,
  Star,
  Gift,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, Resolver } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { AuthPanel } from "@/components/shared/AuthPanel"
import { PasswordStrengthMeter } from "@/components/shared/PasswordStrengthMeter"
import { toast } from "sonner"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import Image from "next/image"
import {
  customerSignupFormSchema,
  type CustomerSignupFormValues,
} from "@/lib/schemas"
import { useCustomerSignup } from "@/hooks/shared/usePublicMutations"

export default function CustomerSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [showPw, setShowPw] = useState(false)
  const signupMutation = useCustomerSignup()

  const form = useForm<CustomerSignupFormValues>({
    resolver: zodResolver(
      customerSignupFormSchema
    ) as unknown as Resolver<CustomerSignupFormValues>,
    defaultValues: { name: "", email: "", phone: "", password: "" },
  })

  const passwordValue = form.watch("password")

  const onSubmit = async (values: CustomerSignupFormValues) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please check your internet connection.")
      return
    }

    try {
      const data = await signupMutation.mutateAsync(values)

      toast.success(data.message || "Account created! Signing you in...")

      // Auto sign-in after successful signup
      const signInRes = await signIn("customer-login", {
        redirect: false,
        email: values.email.trim(),
        password: values.password,
      })

      if (signInRes?.error) {
        toast.error(
          "Account created, but auto-login failed. Please log in manually."
        )
        router.push(`/customer/login?redirect=${encodeURIComponent(redirect)}`)
      } else {
        router.replace(redirect)
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { error?: string } }
      }
      if (err?.response?.status === 409) {
        toast.error(
          err.response.data?.error || "Account exists. Please log in."
        )
      } else if (!navigator.onLine) {
        toast.error("Network error. Please check your internet connection.")
      } else {
        toast.error(
          err?.response?.data?.error ||
            "An unexpected error occurred. Please try again."
        )
      }
    }
  }

  const isPending = signupMutation.isPending

  return (
    <main className="flex min-h-screen bg-background">
      <AuthPanel
        variant="vendor"
        bgImage="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
        badge="Customer Account"
        headline="Order Food,<br/>Earn Rewards"
        subline="Create an account to manage your wallet, track orders, and earn BiteHub Coins."
        features={[
          { icon: ShoppingBag, text: "Fast checkout" },
          { icon: Gift, text: "Earn rewards and BiteHub Coins" },
          { icon: User, text: "Manage your profile" },
          { icon: Star, text: "Access premium vendor discounts" },
        ]}
        footerText={`Welcome to ${APP_NAME}`}
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
                <User className="size-6 text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">
                Create Account
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Join BiteHub today to order easily
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="John Doe"
                      autoComplete="name"
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="tel"
                      placeholder="08012345678"
                      autoComplete="tel"
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
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                      >
                        {showPw ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={passwordValue} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                type="submit"
                variant="hero"
                className="mt-4 h-11 w-full text-base"
                disabled={isPending}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Creating account…" : "Create account"}
              </Button>
            </form>

            {/* Bottom links */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/customer/login?redirect=${encodeURIComponent(redirect)}`}
                className="font-medium text-foreground underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
