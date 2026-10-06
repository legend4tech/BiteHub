import Link from "next/link"
import Image from "next/image"
import { auth } from "@/auth"
import { SessionProvider } from "next-auth/react"
import {
  VendorManagerSidebar,
  VendorManagerMobileTrigger,
} from "@/components/vendor-manager/VendorManagerSidebar"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { APP_LOGO_URL, APP_NAME } from "@/lib/constants"

export default async function VendorManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = session?.user?.role

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Desktop sidebar */}
        <VendorManagerSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top-bar */}
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md md:hidden">
            <VendorManagerMobileTrigger role={role} />
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={APP_LOGO_URL}
                alt={APP_NAME}
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="font-heading text-lg leading-none font-black tracking-tight">
                Bite<span className="text-primary">Hub</span>
              </span>
            </Link>
            <div className="w-9" />
          </header>

          {/* Scrollable content */}
          <main className="flex-1">
            <SectionErrorBoundary title="Couldn't load vendor manager dashboard">
              <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
            </SectionErrorBoundary>
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
