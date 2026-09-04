import Link from "next/link"
import { ArrowLeft, User, ShoppingBag, Star, Gift } from "lucide-react"
import { AuthPanel } from "@/components/shared/AuthPanel"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import Image from "next/image"
import { CustomerSigninForm } from "@/components/customer/CustomerSigninForm"

export default function CustomerLoginPage() {
  return (
    <main className="flex min-h-screen bg-background">
      <AuthPanel
        variant="vendor"
        bgImage="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
        badge="Customer Account"
        headline="Order Food,<br/>Earn Rewards"
        subline="Log in to manage your wallet, track orders, and earn BiteHub Coins."
        features={[
          { icon: ShoppingBag, text: "Fast checkout" },
          { icon: Gift, text: "Earn rewards and BiteHub Coins" },
          { icon: User, text: "Manage your profile" },
          { icon: Star, text: "Access premium vendor discounts" },
        ]}
        footerText={`Welcome back to ${APP_NAME}`}
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
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

            {/* ── CustomerSigninForm (client component) ── */}
            <CustomerSigninForm />

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/customer/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
