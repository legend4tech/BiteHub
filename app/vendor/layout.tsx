"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { VendorSidebar, MobileSidebarTrigger } from "@/components/vendor/VendorSidebar";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useVendorOrderAlerts } from "@/hooks/useVendorOrderAlerts";

const pageTitles: Record<string, string> = {
  "/vendor/dashboard": "Dashboard",
  "/vendor/menu": "Menu",
  "/vendor/orders": "Orders",
};

function VendorLayoutContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  
  // Register global real-time notifications, audio chimes, and browser notifications
  useVendorOrderAlerts();

  const isAuthPage =
    pathname === "/vendor/login" ||
    pathname === "/vendor/forgot-password" ||
    (status !== "authenticated" && pathname === "/vendor/reset-password") ||
    (status !== "authenticated" && pathname === "/vendor/confirm-email");

  if (status === "loading" && (pathname === "/vendor/reset-password" || pathname === "/vendor/confirm-email")) {
    return <PageSkeleton variant="auth" />;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  const pageTitle = pageTitles[pathname] ?? pageTitles[Object.keys(pageTitles).find(k => pathname.startsWith(k)) ?? ""] ?? "Vendor Dashboard";

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Desktop sidebar */}
      <VendorSidebar />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar (mobile only) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <MobileSidebarTrigger />
            <span className="font-heading font-bold text-base">{pageTitle}</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0}>
      <VendorLayoutContent>{children}</VendorLayoutContent>
    </SessionProvider>
  );
}
