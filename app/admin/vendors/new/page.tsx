"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_LOGO_URL, APP_NAME } from "@/lib/constants"
import Link from "next/link"
import Image from "next/image"
import {
  AdminSidebar,
  AdminMobileTrigger,
} from "@/components/admin/AdminSidebar"
import { VendorCreationForm } from "@/components/admin/VendorCreationForm"

export default function NewVendorPage() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 flex bg-background text-foreground">
      {/* Sidebar — vendors section highlighted */}
      <AdminSidebar
        activeSection="vendors"
        onSectionChange={() => router.push("/admin")}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top-bar */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md md:hidden">
          <AdminMobileTrigger
            activeSection="vendors"
            onSectionChange={() => router.push("/admin")}
          />
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
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-8">
            {/* Page header */}
            <div className="mb-8 flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="shrink-0 rounded-xl"
              >
                <Link href="/admin">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold">
                  Add New Vendor
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Create a vendor profile and login account
                </p>
              </div>
            </div>

            {/* Form */}
            <VendorCreationForm />
          </div>
        </main>
      </div>
    </div>
  )
}
