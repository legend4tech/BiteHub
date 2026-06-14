import type { Metadata } from "next"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/landing/Hero"
import { AllProducts } from "@/components/landing/AllProducts"
import { FeaturedVendors } from "@/components/landing/FeaturedVendors"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { VendorCTA } from "@/components/landing/VendorCTA"
import { Footer } from "@/components/Footer"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { Suspense } from "react"
import { getMenus } from "@/lib/services/menuService"
import { DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID } from "@/lib/config/campus"

export const metadata: Metadata = {
  title: "BiteHub — Campus food, ordered fast",
  description:
    "Discover the best campus food vendors around you, browse menus and order food in seconds — all from one app.",
  openGraph: {
    title: "BiteHub — Campus food, ordered fast",
    description:
      "Discover the best campus food vendors around you, browse menus and order food in seconds — all from one app.",
    url: "/",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "BiteHub" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BiteHub — Campus food, ordered fast",
    description: "Order from your favorite campus kitchens in seconds.",
    images: ["/og-image.png"],
  },
}

// ── Isolated async component: only this throws if DB is down ─────────────────
async function LandingMenuSection({
  category,
  school,
  campus,
}: {
  category: string
  school: string
  campus: string
}) {
  const { items } = await getMenus({ category, school, campus, limit: 10 })

  return <AllProducts initialItems={items} activeCategory={category} />
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const category =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "all"
  const school =
    typeof resolvedSearchParams.school === "string"
      ? resolvedSearchParams.school
      : DEFAULT_SCHOOL_ID
  const campus =
    typeof resolvedSearchParams.campus === "string"
      ? resolvedSearchParams.campus
      : DEFAULT_CAMPUS_ID

  return (
    <>
      {/* Navbar must be outside main to avoid overflow-x-hidden breaking sticky */}
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
        {/* Menu section — shows inline error if DB unreachable */}
        <Hero />
        <SectionErrorBoundary
          title="Couldn't load menu items"
          message="We couldn't reach the server. Check your connection and try again."
          padded
        >
          <Suspense
            fallback={
              <section className="py-20">
                <div className="mx-auto max-w-7xl px-6">
                  <PageSkeleton variant="menu-item-grid" count={10} />
                </div>
              </section>
            }
          >
            <LandingMenuSection
              category={category}
              school={school}
              campus={campus}
            />
          </Suspense>
        </SectionErrorBoundary>

        {/* Featured vendors — self-contained async component with its own DB call */}
        <SectionErrorBoundary
          title="Couldn't load featured vendors"
          message="We couldn't reach the server. Check your connection and try again."
          padded
        >
          <Suspense
            fallback={
              <section className="border-y border-border/60 bg-card/40 py-24">
                <div className="mx-auto max-w-7xl px-6">
                  <PageSkeleton variant="menu-item-grid" count={4} />
                </div>
              </section>
            }
          >
            <FeaturedVendors school={school} campus={campus} />
          </Suspense>
        </SectionErrorBoundary>

        {/* Always render — no data dependency */}
        <HowItWorks />
        <VendorCTA />
        <Footer />
      </main>
    </>
  )
}
