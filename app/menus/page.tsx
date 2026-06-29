import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { MenuGrid } from "@/components/menus/MenuGrid"
import { SearchInput } from "@/components/shared/SearchInput"
import { LoadMoreMenus } from "@/components/menus/LoadMoreMenus"
import { FadeIn } from "@/components/FadeIn"
import { SlidersHorizontal, ArrowUpDown } from "lucide-react"
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { Suspense } from "react"
import { getMenus } from "@/lib/services/menuService"
import {
  DEFAULT_SCHOOL_ID,
  DEFAULT_CAMPUS_ID,
  getCampusName,
  getSchoolName,
} from "@/lib/config/campus"
import { CampusSelector } from "@/components/shared/CampusSelector"
import { VendorFilter } from "@/components/menus/VendorFilter"

export const metadata: Metadata = {
  title: "All Menus",
  description:
    "Browse every dish available on campus. Search by name, filter by category, and order your next meal in seconds.",
  openGraph: {
    title: "All Menus — BiteHub",
    description:
      "Browse every dish available on campus. Search by name, filter by category, and order your next meal in seconds.",
    url: "/menus",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "BiteHub Menu" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Menus — BiteHub",
    description: "Browse every dish available on campus and order in seconds.",
    images: ["/og-image.png"],
  },
}

// ── Isolated async component: only this throws if DB is down ─────────────────
async function MenuListContent({
  q,
  category,
  school,
  campus,
  sortBy,
  availableOnly,
  vendorId,
}: {
  q: string
  category: string
  school: string
  campus: string
  sortBy: string
  availableOnly: boolean
  vendorId?: string
}) {
  const { items, totalItems } = await getMenus({
    q,
    category,
    school,
    campus,
    sortBy: sortBy !== "none" ? sortBy : undefined,
    availableOnly: availableOnly ? true : undefined,
    limit: 20,
    vendorId: vendorId || undefined,
  })

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {totalItems} items available
      </p>
      <MenuGrid initialItems={items} activeCategory={category} />
      {items.length === 20 && (
        <LoadMoreMenus
          initialPage={1}
          searchParams={{
            q: q || undefined,
            category: category !== "all" ? category : undefined,
            school,
            campus,
            sortBy: sortBy !== "none" ? sortBy : undefined,
            availableOnly: availableOnly ? "true" : undefined,
            vendorId: vendorId || undefined,
          }}
        />
      )}
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : ""
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

  const campusLabel = `${getSchoolName(school)} — ${getCampusName(school, campus)}`

  const sortBy =
    typeof resolvedSearchParams.sortBy === "string"
      ? resolvedSearchParams.sortBy
      : "none"
  const availableOnly = resolvedSearchParams.availableOnly === "true"
  const vendorId =
    typeof resolvedSearchParams.vendorId === "string"
      ? resolvedSearchParams.vendorId
      : undefined

  const buildFilterUrl = (
    paramsToUpdate: Record<string, string | undefined>
  ) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (category !== "all") params.set("category", category)
    if (school !== DEFAULT_SCHOOL_ID) params.set("school", school)
    if (campus !== DEFAULT_CAMPUS_ID) params.set("campus", campus)
    if (sortBy !== "none") params.set("sortBy", sortBy)
    if (availableOnly) params.set("availableOnly", "true")
    if (vendorId) params.set("vendorId", vendorId)

    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const str = params.toString()
    return str ? `?${str}` : "?"
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn delay={0.1}>
            <div className="mb-8">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Back to home
              </Link>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-heading text-3xl font-bold md:text-5xl">
                    All Menus
                  </h1>
                  <p className="mt-2 mb-4 text-muted-foreground">
                    Showing menus for{" "}
                    <span className="font-semibold text-foreground">
                      {campusLabel}
                    </span>
                  </p>
                  <SearchInput placeholder="Search for meals, snacks..." />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    Not your School or Campus? Change it here
                  </p>
                  <CampusSelector />
                </div>
              </div>

              {/* Vendor filter + filter panel */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Suspense>
                  <VendorFilter
                    school={school}
                    campus={campus}
                    activeVendorId={vendorId}
                  />
                </Suspense>
              </div>

              {/* Filters Panel inline for server component */}
              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Link
                    href={buildFilterUrl({
                      availableOnly: availableOnly ? undefined : "true",
                    })}
                    className="flex cursor-pointer items-center gap-2.5"
                  >
                    <div className="relative flex items-center">
                      <div
                        className={`h-6 w-11 rounded-full transition-colors ${availableOnly ? "bg-primary" : "bg-muted"}`}
                      ></div>
                      <div
                        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${availableOnly ? "translate-x-5" : ""}`}
                      ></div>
                    </div>
                    <span className="text-sm font-medium select-none">
                      Available to order now
                    </span>
                  </Link>
                </div>

                <div className="flex items-center gap-3">
                  <ArrowUpDown className="size-4 text-muted-foreground" />
                  <div className="relative">
                    {/* Native select that navigates on change isn't trivial without client JS, 
                        so we'll use links styled as buttons or just accept that changing sort
                        requires a small client component. Since this is a server page, 
                        we can make the select update the URL using a tiny bit of inline script 
                        or just rely on the existing approach. Better yet, we can extract this 
                        filter bar to a small client component. But for simplicity, we'll use 
                        standard links for the sort options. */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Recommended", value: "none" },
                        { label: "Price: Low to High", value: "price_asc" },
                        { label: "Price: High to Low", value: "price_desc" },
                        { label: "Name: A to Z", value: "name_asc" },
                      ].map((opt) => (
                        <Link
                          key={opt.value}
                          href={buildFilterUrl({
                            sortBy:
                              opt.value === "none" ? undefined : opt.value,
                          })}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === opt.value ? "border-primary bg-primary text-white" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                        >
                          {opt.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <SectionErrorBoundary
            title="Couldn't load menu items"
            message="We couldn't reach the server. Check your connection and try again."
          >
            <Suspense
              fallback={
                <div className="py-8">
                  <PageSkeleton variant="menu-item-grid" count={12} />
                </div>
              }
            >
              <MenuListContent
                q={q}
                category={category}
                school={school}
                campus={campus}
                sortBy={sortBy}
                availableOnly={availableOnly}
                vendorId={vendorId}
              />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>

      <Footer />
    </main>
  )
}
