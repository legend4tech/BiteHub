"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller, Resolver } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import axios from "axios"
import Image from "next/image"

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(
      forgotPasswordSchema as never
    ) as unknown as Resolver<ForgotPasswordValues>,
    defaultValues: { email: "" },
  })

  // Pre-fill email from query parameters
  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      form.setValue("email", decodeURIComponent(emailParam))
    }
  }, [searchParams, form])

  const onSubmit = async (values: ForgotPasswordValues) => {
    setLoading(true)
    try {
      await axios.post("/api/vendor/forgot-password", {
        email: values.email.trim(),
      })
      setSubmitted(true)
      toast.success("Verification link sent!")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      const errorMsg =
        err.response?.data?.message || "Something went wrong. Please try again."
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute top-0 left-0 -mt-20 -ml-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 -mr-20 -mb-20 h-96 w-96 rounded-full bg-orange-600/5 blur-3xl" />

      <div className="z-10 w-full max-w-[440px]">
        {/* Brand Header */}
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
            <KeyRound className="size-6 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Forgot Password
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
          {!submitted ? (
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
                      placeholder="vendor@example.com"
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

              <Button
                type="submit"
                variant="hero"
                className="mt-2 h-11 w-full text-base"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? "Sending link…" : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Check your inbox
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If an active vendor account matches{" "}
                <strong>{form.getValues("email")}</strong>, we have sent a
                secure link to reset your password.
              </p>
              <p className="text-xs text-muted-foreground">
                Be sure to check your spam or junk folder if you don&apos;t
                receive it in a few minutes.
              </p>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/vendor/login"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
