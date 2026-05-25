import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { MenuGrid } from "@/components/menus/MenuGrid"
import { SearchInput } from "@/components/shared/SearchInput"
import { LoadMoreMenus } from "@/components/menus/LoadMoreMenus"
import { FadeIn } from "@/components/FadeIn"
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
}: {
  q: string
  category: string
  school: string
  campus: string
}) {
  const { items, totalItems } = await getMenus({
    q,
    category,
    school,
    campus,
    limit: 20,
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
            </div>
          </FadeIn>

          <SectionErrorBoundary
            title="Couldn't load menu items"
            message="We couldn't reach the server. Check your connection and try again."
          >
            <Suspense
              key={`${q}-${category}-${school}-${campus}`}
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
              />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>

      <Footer />
    </main>
  )
}
