"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Users,
  BarChart3,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { z } from "zod"
import { useForm, Controller, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import Image from "next/image"
import { AuthPanel } from "@/components/shared/AuthPanel"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"

import {
  adminLoginSchema as loginSchema,
  type AdminLoginValues as LoginValues,
} from "@/lib/schemas"

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(
      loginSchema as never
    ) as unknown as Resolver<LoginValues>,
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please check your internet connection.")
      return
    }

    setIsLoading(true)
    try {
      const res = await signIn("admin-login", {
        redirect: false,
        email: values.email,
        password: values.password,
      })

      if (res?.error) {
        if (res.error.includes("Too Many Requests")) {
          // Rate limit message — pass through as-is (already user-friendly)
          toast.error(res.error)
        } else if (
          res.error === "Configuration" ||
          res.error === "AccessDenied"
        ) {
          toast.error("Authentication service error. Please try again.")
        } else if (
          res.error === "CredentialsSignin" ||
          res.error === "Invalid credentials"
        ) {
          // NextAuth may return the raw class name in some edge cases
          toast.error("Invalid email or password.")
        } else {
          toast.error(res.error || "Something went wrong. Please try again.")
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
        toast.success("Welcome back, Admin!")
        router.push("/admin")
        router.refresh()
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
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-background">
      <AuthPanel
        variant="admin"
        bgImage="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop"
        badge="Admin Access Only"
        badgeIcon={Lock}
        headline="Platform control<br />centre"
        subline={`Manage vendors, monitor orders, and keep the ${APP_NAME} platform running smoothly.`}
        features={[
          { icon: Users, text: "Manage all vendor accounts" },
          { icon: BarChart3, text: "Platform-wide analytics & revenue" },
          { icon: Settings, text: "Full control over the platform" },
          { icon: ShieldCheck, text: "Secure, role-based access" },
        ]}
        footerText="Restricted access · Authorized personnel only"
        footerIcon={ShieldCheck}
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
            Back to Home
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
                <ShieldCheck className="size-6 text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to manage the platform
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="admin@bitehubapp.com"
                      autoComplete="email"
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
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        className="h-11 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? (
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Secure access restricted to authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
