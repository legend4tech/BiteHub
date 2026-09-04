"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, Resolver } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { customerLoginSchema, type CustomerLoginValues } from "@/lib/schemas"

export function CustomerSigninForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

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
    try {
      const res = await signIn("customer-login", {
        redirect: false,
        email: values.email.trim(),
        password: values.password,
      })

      if (res?.error) {
        if (res.error.includes("Too Many Requests")) {
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
          toast.error("Invalid email or password.")
        } else {
          toast.error(res.error || "Something went wrong. Please try again.")
        }
      } else if (res?.url && res.url.includes("/api/auth/error")) {
        toast.error(
          "An unexpected authentication error occurred. Please try again."
        )
      } else {
        toast.success("Login successful. Welcome back!")
        router.replace(redirect)
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      if (err?.message?.toLowerCase().includes("fetch") || !navigator.onLine) {
        toast.error("Network error. Please check your internet connection.")
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
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
