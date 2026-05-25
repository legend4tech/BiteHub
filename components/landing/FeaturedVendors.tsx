import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/FadeIn"
import { EmptyState } from "@/components/shared/EmptyState"
import { VendorCard } from "@/components/vendors/VendorCard"
import { getFeaturedVendors } from "@/lib/services/vendorService"
import { DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID } from "@/lib/config/campus"

interface FeaturedVendorsProps {
  school?: string
  campus?: string
}

export async function FeaturedVendors({
  school = DEFAULT_SCHOOL_ID,
  campus = DEFAULT_CAMPUS_ID,
}: FeaturedVendorsProps) {
  const fetchedVendors = await getFeaturedVendors({ school, campus, limit: 4 })

  return (
    <section
      id="vendors"
      className="border-y border-border/60 bg-card/40 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn delay={0.1}>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wider text-primary uppercase">
                Featured kitchens
              </p>
              <h2 className="mt-2 max-w-2xl font-heading text-3xl font-bold md:text-5xl">
                Hand-picked vendors students love
              </h2>
            </div>
          </div>
        </FadeIn>

        {fetchedVendors.length === 0 ? (
          <EmptyState
            title="No featured vendors yet"
            description="We're onboarding campus kitchens — check back soon to discover great food near you."
            action={{ label: "Browse all vendors", href: "/vendors" }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fetchedVendors.map(
              (v, i) =>
                v && (
                  <FadeIn key={v.id} delay={0.1 * (i + 1)} className="h-full">
                    <VendorCard vendor={v as never} />
                  </FadeIn>
                )
            )}
          </div>
        )}

        <FadeIn delay={0.5}>
          <div className="mt-12 flex justify-center">
            <Button
              asChild
              variant="hero"
              size="xl"
              className="group rounded-2xl px-10 shadow-xl shadow-primary/20 transition-transform hover:scale-105"
            >
              <Link
                href={`/vendors?school=${school}&campus=${campus}`}
                className="flex items-center gap-2 font-bold tracking-tight"
              >
                View all vendors{" "}
                <ExternalLink className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
