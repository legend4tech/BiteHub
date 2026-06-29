"use client"

import { usePathname } from "next/navigation"
import { useGlobalSettings } from "@/hooks/queries/useGlobalSettings"
import { Wrench } from "lucide-react"

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const { data, isLoading } = useGlobalSettings({
    refetchInterval: 1000 * 60, // Poll every minute to detect changes
    staleTime: 1000 * 30,
  })

  // Never block the admin panel so admins can actually turn off maintenance mode!
  // Also don't block auth API routes or it might break session management
  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return <>{children}</>
  }

  // Prevent flashing by rendering children initially or while loading
  // The guard will snap into place once data returns true
  if (isLoading || !data?.maintenanceMode) {
    return <>{children}</>
  }

  // Block the UI completely if maintenanceMode is true
  return (
    <div className="fixed inset-0 z-[9999] flex animate-in flex-col items-center justify-center bg-background/95 p-6 backdrop-blur-sm duration-500 fade-in">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
          <Wrench className="size-14 animate-pulse text-primary" />
        </div>
        <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-tight text-foreground">
          We&apos;re Upgrading BiteHub!
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          BiteHub is currently down for scheduled maintenance. We are making
          things faster, smoother, and more delicious! Please check back in a
          few minutes.
        </p>
      </div>
    </div>
  )
}
