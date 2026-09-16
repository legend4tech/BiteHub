"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSchoolOptions, getCampusOptions } from "@/lib/config/campus"
import {
  customerSignupFormSchema,
  type CustomerSignupFormValues,
} from "@/lib/schemas"
import { useCustomerSignup } from "@/hooks/shared/usePublicMutations"
import { Step1Fields, Step2Fields } from "./CustomerSignupFields"

export default function CustomerSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [direction, setDirection] = useState(1)
  const signupMutation = useCustomerSignup()

  const form = useForm<CustomerSignupFormValues>({
    mode: "onChange",
    resolver: zodResolver(
      customerSignupFormSchema
    ) as unknown as Resolver<CustomerSignupFormValues>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      school: "",
      campus: "",
      referredBy: searchParams.get("ref") || "",
    },
  })

  const handleNextStep = async () => {
    const isValid = await form.trigger(["name", "email", "phone"])
    if (isValid) {
      setDirection(1)
      setStep(2)
    }
  }

  const handlePrevStep = () => {
    setDirection(-1)
    setStep(1)
  }

  const selectedSchool = form.watch("school")

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

              {/* Progress bar */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span
                    className={
                      step === 1
                        ? "text-foreground"
                        : "cursor-pointer transition-colors hover:text-foreground"
                    }
                    onClick={handlePrevStep}
                  >
                    Step 1: Contact
                  </span>
                  <span className={step === 2 ? "text-foreground" : ""}>
                    Step 2: Account Setup
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: step === 1 ? "50%" : "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="relative space-y-4 overflow-hidden"
            >
              <AnimatePresence mode="wait" custom={direction}>
                {/* --- STEP 1: Personal Info --- */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={direction}
                    initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="block space-y-4"
                  >
                    <Step1Fields control={form.control} />

                    <Button
                      type="button"
                      variant="hero"
                      className="mt-6 h-11 w-full text-base"
                      onClick={handleNextStep}
                    >
                      Next Step
                    </Button>
                  </motion.div>
                )}

                {/* --- STEP 2: Account Setup --- */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="block space-y-4"
                  >
                    <Step2Fields
                      control={form.control}
                      selectedSchool={selectedSchool}
                      passwordValue={passwordValue}
                      setValue={form.setValue}
                    />

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
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <div className="mt-6 flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-1/3 text-base"
                        onClick={handlePrevStep}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="hero"
                        className="h-11 flex-1 text-base"
                        disabled={isPending}
                      >
                        {isPending && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        {isPending ? "Creating account…" : "Create account"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
