"use client"

import { usePathname } from "next/navigation"
import {
  CustomerSidebar,
  CustomerMobileTrigger,
} from "@/components/customer/CustomerSidebar"
import { SessionProvider, useSession } from "next-auth/react"
import Link from "next/link"
import { UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { FloatingBumpTracker } from "@/components/customer/rewards/FloatingBumpTracker"
import { WalletAutoRefresher } from "@/components/customer/WalletAutoRefresher"

const pageTitles: Record<string, string> = {
  "/customer/dashboard": "Overview",
  "/customer/orders": "My Orders",
  "/customer/wallet": "Wallet",
  "/customer/rewards": "Rewards",
  "/customer/settings": "Settings",
}

function CustomerLayoutContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()

  // We remove the blocking loading spinner here so that the layout
  // (sidebar, top bar) renders immediately. The individual page content
  // will use loading.tsx skeletons while NextAuth and database fetch data.

  const isAuthPage =
    pathname === "/customer/login" ||
    pathname === "/customer/signup" ||
    pathname.startsWith("/customer/complete-signup") ||
    pathname === "/customer/forgot-password" ||
    (status !== "authenticated" && pathname === "/customer/reset-password")

  if (status === "loading" && pathname === "/customer/reset-password") {
    return <PageSkeleton variant="auth" />
  }

  if (isAuthPage) {
    return <>{children}</>
  }

  const pageTitle = pageTitles[pathname] ?? "Customer Dashboard"

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <CustomerSidebar />

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Persistent top bar */}
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <CustomerMobileTrigger />
            <span className="font-heading text-base font-bold sm:text-lg">
              {pageTitle}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" className="gap-2 font-semibold shadow-xs">
              <Link href="/menus">
                <UtensilsCrossed className="size-4" />
                <span className="hidden sm:inline">Browse Menus</span>
                <span className="sm:hidden">Menus</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-5xl min-w-0 p-4 md:p-6">{children}</div>
        </main>
      </div>
      <FloatingBumpTracker />
      <WalletAutoRefresher />
    </div>
  )
}

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider refetchInterval={0}>
      <CustomerLayoutContent>{children}</CustomerLayoutContent>
    </SessionProvider>
  )
}
