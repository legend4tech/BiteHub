"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useForm, Controller, useWatch, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  googleCustomerCompleteFormSchema,
  type GoogleCustomerCompleteFormValues,
} from "@/lib/schemas/customer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSchoolOptions, getCampusOptions } from "@/lib/config/campus"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface DecodedTokenPayload {
  purpose?: string
  email: string
  name: string
  image: string
  referredBy?: string
  exp: number
}

function parseTokenSafely(token: string | null): DecodedTokenPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null
  }
  try {
    const [encoded] = token.split(".")
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4) {
      base64 += "="
    }
    const json = atob(base64)
    const data = JSON.parse(json) as DecodedTokenPayload
    if (data.purpose !== "google_signup" || !data.email || !data.exp)
      return null
    if (data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export function GoogleCompleteForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const redirect = searchParams.get("redirect") || "/customer/dashboard"

  const payload = useMemo(() => parseTokenSafely(token), [token])
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<GoogleCustomerCompleteFormValues>({
    mode: "onChange",
    resolver: zodResolver(
      googleCustomerCompleteFormSchema
    ) as unknown as Resolver<GoogleCustomerCompleteFormValues>,
    defaultValues: {
      name: payload?.name || "",
      phone: "",
      school: "",
      campus: "",
      referredBy: payload?.referredBy || "",
    },
  })

  const selectedSchool = useWatch({ control: form.control, name: "school" })

  if (!payload || !token) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/20 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="font-heading text-lg font-bold text-destructive">
          Session Expired or Invalid
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your Google signup session has expired or is invalid. Please sign in
          with Google again to complete your account.
        </p>
        <Link href="/customer/signup" className="mt-5 inline-block">
          <Button variant="default" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to Sign Up
          </Button>
        </Link>
      </div>
    )
  }

  const onSubmit = async (values: GoogleCustomerCompleteFormValues) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please check your internet connection.")
      return
    }

    setSubmitting(true)
    try {
      const res = await signIn("customer-google-complete", {
        redirect: false,
        token,
        name: values.name || payload.name,
        phone: values.phone,
        school: values.school,
        campus: values.campus,
        referredBy: values.referredBy || undefined,
      })

      if (res?.error) {
        const resCode = (res as { code?: string }).code
        if (resCode === "AccountSuspended") {
          toast.error("This account has been suspended.")
        } else if (res?.error.includes("referral")) {
          toast.error(res.error)
        } else {
          toast.error(
            res?.error === "CredentialsSignin"
              ? "Registration failed. Please check your details."
              : res?.error || "Registration failed. Please try again."
          )
        }
      } else {
        toast.success("Welcome to BiteHub! Your account is ready.")
        window.location.assign(redirect)
      }
    } catch (error) {
      console.error("[GoogleCompleteForm submit]", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* ── Verified Google Identity Card ── */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <Avatar className="size-13 border-2 border-primary/30 shadow-xs">
          <AvatarImage
            src={payload.image}
            alt={payload.name || payload.email}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="bg-primary/20 font-bold text-primary">
            {payload.name ? payload.name.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {payload.name && (
            <p className="truncate text-sm font-semibold text-foreground">
              {payload.name}
            </p>
          )}
          <p className="truncate text-xs text-muted-foreground">
            {payload.email}
          </p>
        </div>
      </div>

      {/* ── Full Name ── */}
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              placeholder="e.g. John Doe"
              autoComplete="name"
              aria-invalid={fieldState.invalid}
              className="h-11"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* ── Phone Number ── */}
      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Phone Number (Active on WhatsApp & Calls)
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="tel"
              placeholder="08012345678"
              autoComplete="tel"
              aria-invalid={fieldState.invalid}
              className="h-11"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* ── School Selection ── */}
      <Controller
        name="school"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>School</FieldLabel>
            <Select
              onValueChange={(val) => {
                field.onChange(val)
                form.setValue("campus", "")
              }}
              value={field.value}
            >
              <SelectTrigger id={field.name} className="h-11">
                <SelectValue placeholder="Select your school" />
              </SelectTrigger>
              <SelectContent>
                {getSchoolOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* ── Campus Selection ── */}
      <Controller
        name="campus"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Campus</FieldLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedSchool}
            >
              <SelectTrigger id={field.name} className="h-11">
                <SelectValue placeholder="Select your campus" />
              </SelectTrigger>
              <SelectContent>
                {getCampusOptions(selectedSchool).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* ── Referral Code (Optional) ── */}
      <Controller
        name="referredBy"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Referral Code (Optional)
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="text"
              placeholder="e.g. REF-ABC1234"
              aria-invalid={fieldState.invalid}
              className="h-11"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* ── Submit Button ── */}
      <Button
        type="submit"
        variant="hero"
        className="mt-6 h-11 w-full text-base"
        disabled={submitting}
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting
          ? "Completing your account…"
          : "Complete Account & Start Ordering"}
      </Button>
    </form>
  )
}
