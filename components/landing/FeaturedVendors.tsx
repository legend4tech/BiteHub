import Link from "next/link"
import { MapPin, ArrowUpRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/FadeIn"
import { EmptyState } from "@/components/shared/EmptyState"
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
            {fetchedVendors.map((v, i) => (
              <FadeIn key={v.id} delay={0.1 * (i + 1)}>
                <Link
                  href={`/vendors/${v.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-background p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[0_8px_32px_-6px_rgba(255,107,0,0.25)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary text-lg font-bold text-white">
                      {(v as { image?: { url?: string } }).image?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(v as { image?: { url?: string } }).image!.url!}
                          alt={v.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        v.initials
                      )}
                    </div>
                    <ArrowUpRight className="text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg leading-tight font-bold">
                    {v.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {v.tagline}
                  </p>

                  <div className="mt-5 flex items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {v.location}
                    </span>
                  </div>
                </Link>
              </FadeIn>
            ))}
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
