import { Suspense } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  ShoppingBag,
  Star,
  Gift,
  Sparkles,
} from "lucide-react"
import { AuthPanel } from "@/components/shared/AuthPanel"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import Image from "next/image"
import { GoogleCompleteForm } from "@/components/customer/GoogleCompleteForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Complete Profile | ${APP_NAME}`,
  description:
    "Complete your BiteHub profile to begin ordering food on campus.",
}

export default function CompleteSignupPage() {
  return (
    <main className="flex min-h-screen bg-background">
      <AuthPanel
        variant="vendor"
        bgImage="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
        badge="Almost There!"
        headline="Just a Few<br/>Final Details"
        subline="We need your phone number and campus so food vendors and delivery riders know where to find you."
        features={[
          { icon: Sparkles, text: "Email already verified by Google" },
          { icon: ShoppingBag, text: "Instant access to campus menus" },
          { icon: Gift, text: "Earn BiteHub Coins & referral rewards" },
          { icon: Star, text: "Fast checkout on every order" },
        ]}
        footerText={`Join the BiteHub Campus Family`}
      />

      {/* ── Right panel (form) ── */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between px-6 py-5">
          <Link
            href="/customer/signup"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Sign up
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
          <div className="w-full max-w-[420px]">
            {/* Heading */}
            <div className="mb-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
                <User className="size-6 text-primary" />
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                Complete Your Profile
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Set your campus and contact info to finalize your account.
              </p>
            </div>

            {/* GoogleCompleteForm wrapped in Suspense for useSearchParams */}
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded-2xl bg-muted" />
              }
            >
              <GoogleCompleteForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
