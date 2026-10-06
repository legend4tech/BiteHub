import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { VendorCard } from "@/components/public-vendors/VendorCard"
import type { Metadata } from "next"
import { FadeIn } from "@/components/FadeIn"
import { SearchInput } from "@/components/shared/SearchInput"
import {
  DEFAULT_SCHOOL_ID,
  DEFAULT_CAMPUS_ID,
  getCampusName,
  getSchoolName,
} from "@/lib/config/campus"
import { LoadMoreVendors } from "@/components/public-vendors/LoadMoreVendors"
import { Suspense } from "react"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { getVendors } from "@/lib/services/vendorService"
import { CampusSelector } from "@/components/shared/CampusSelector"
export const metadata: Metadata = {
  title: "All Vendors",
  description:
    "Browse all active food vendors on campus. Find your favourite kitchen, check their menu, and order in seconds.",
  openGraph: {
    title: "All Vendors — BiteHub",
    description:
      "Browse all active food vendors on campus. Find your favourite kitchen, check their menu, and order in seconds.",
    url: "/vendors",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BiteHub Vendors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Vendors — BiteHub",
    description:
      "Browse all active food vendors on campus and order in seconds.",
    images: ["/og-image.png"],
  },
}
// ── Isolated async component: only this throws if DB is down ─────────────────
async function VendorListContent({
  q,
  school,
  campus,
  openNow,
  freeDelivery,
  topRated,
}: {
  q: string
  school: string
  campus: string
  openNow: boolean
  freeDelivery: boolean
  topRated: boolean
}) {
  const { vendors, totalVendors } = await getVendors({
    q,
    school,
    campus,
    openNow,
    freeDelivery,
    topRated,
    limit: 20,
  })
  if (vendors.length === 0) {
    return (
      <div className="col-span-full">
        <EmptyState
          title={q ? `No vendors matched "${q}"` : "No vendors yet"}
          description={
            q
              ? "Try a different search term or browse all vendors."
              : "No active vendors are available right now. Check back soon!"
          }
          action={q ? { label: "Clear search", href: "/vendors" } : undefined}
        />
      </div>
    )
  }
  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {totalVendors} active kitchen{totalVendors !== 1 ? "s" : ""} ready to
        serve you.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {vendors.map((vendor, i) => (
          <FadeIn key={vendor!.id} delay={0.05 * Math.min(i, 20)}>
            <VendorCard
              vendor={vendor as never}
              itemCount={(vendor as { itemCount?: number }).itemCount || 0}
            />
          </FadeIn>
        ))}
      </div>
      {vendors.length === 20 && (
        <LoadMoreVendors
          initialPage={1}
          searchParams={{
            q: q || undefined,
            school,
            campus,
            openNow: openNow ? "true" : undefined,
            freeDelivery: freeDelivery ? "true" : undefined,
            topRated: topRated ? "true" : undefined,
          }}
        />
      )}
    </>
  )
}
// ── Page ─────────────────────────────────────────────────────────────────────
export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : ""
  const school =
    typeof resolvedSearchParams.school === "string"
      ? resolvedSearchParams.school
      : DEFAULT_SCHOOL_ID
  const campus =
    typeof resolvedSearchParams.campus === "string"
      ? resolvedSearchParams.campus
      : DEFAULT_CAMPUS_ID
  const openNow = resolvedSearchParams.openNow === "true"
  const freeDelivery = resolvedSearchParams.freeDelivery === "true"
  const topRated = resolvedSearchParams.topRated === "true"
  const campusLabel = `${getSchoolName(school)} — ${getCampusName(school, campus)}`
  // Base URL for toggling filters

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn delay={0.1}>
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h1 className="mt-2 font-heading text-4xl font-bold md:text-5xl">
                  All Vendors
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing for{" "}
                  <span className="font-semibold text-foreground">
                    {campusLabel}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CampusSelector />
                <SearchInput placeholder="Search vendors by name, category..." />
              </div>
            </div>
          </FadeIn>
          <SectionErrorBoundary
            title="Couldn't load vendors"
            message="We couldn't reach the server. Check your connection and try again."
          >
            <Suspense
              key={`${q}-${school}-${campus}`}
              fallback={
                <div className="py-8">
                  <PageSkeleton variant="vendor-list" count={8} />
                </div>
              }
            >
              <VendorListContent
                q={q}
                school={school}
                campus={campus}
                openNow={openNow}
                freeDelivery={freeDelivery}
                topRated={topRated}
              />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>
      <Footer />
    </main>
  )
}
