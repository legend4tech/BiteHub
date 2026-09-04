"use client"

import { usePathname } from "next/navigation"
import {
  CustomerSidebar,
  CustomerMobileTrigger,
} from "@/components/customer/CustomerSidebar"
import { SessionProvider, useSession } from "next-auth/react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Loader2 } from "lucide-react"

const pageTitles: Record<string, string> = {
  "/customer/dashboard": "Overview",
  "/customer/dashboard/orders": "My Orders",
  "/customer/dashboard/wallet": "Wallet",
  "/customer/dashboard/rewards": "Rewards",
  "/customer/dashboard/settings": "Settings",
}

function CustomerLayoutContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const pageTitle = pageTitles[pathname] ?? "Customer Dashboard"

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <CustomerSidebar />

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile only) */}
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <CustomerMobileTrigger />
            <span className="font-heading text-base font-bold">
              {pageTitle}
            </span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-5xl p-4 md:p-6">{children}</div>
        </main>
      </div>
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
