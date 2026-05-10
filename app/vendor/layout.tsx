"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { VendorSidebar } from "@/components/vendor/VendorSidebar";
import { SessionProvider, useSession } from "next-auth/react";

function VendorLayoutContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const isLoginPage = pathname === "/vendor/login";



  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <VendorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">{children}</div>
      </main>
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
