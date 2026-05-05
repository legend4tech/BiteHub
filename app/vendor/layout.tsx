"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { VendorSidebar } from "@/components/vendor/VendorSidebar";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, mounted } = useVendorAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/vendor/login";

  useEffect(() => {
    // Authentication redirect removed for open access
  }, [mounted, isAuthenticated, isLoginPage, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If on login page, just render the login page without the sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Authentication block removed for open access

  return (
    <div className="flex min-h-screen bg-background">
      <VendorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
