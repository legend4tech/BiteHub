"use client"

import { useRef } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { VendorCard } from "@/components/public-vendors/VendorCard"
import type { Vendor } from "@/lib/types"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface FeaturedVendorsClientProps {
  fetchedVendors: Vendor[]
  school: string
  campus: string
}

export function FeaturedVendorsClient({
  fetchedVendors,
  school,
  campus,
}: FeaturedVendorsClientProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      // Header reveal
      gsap.fromTo(
        ".vendors-header > *",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".vendors-header",
            start: "top 85%",
          },
        }
      )

      // Staggered Cards
      gsap.fromTo(
        ".vendor-card-wrapper",
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".vendors-grid",
            start: "top 85%",
          },
        }
      )

      // Button pop
      gsap.fromTo(
        ".vendors-cta",
        { opacity: 0, scale: 0.9, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".vendors-cta",
            start: "top 90%",
          },
        }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      id="vendors"
      className="relative overflow-hidden border-y border-border/60 bg-card/40 py-24"
    >
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="vendors-header mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold tracking-wider text-primary uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Featured kitchens
            </p>
            <h2 className="mt-4 max-w-2xl font-heading text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Hand-picked vendors students love
            </h2>
          </div>
        </div>

        {fetchedVendors.length === 0 ? (
          <EmptyState
            title="No featured vendors yet"
            description="We're onboarding campus kitchens — check back soon to discover great food near you."
            action={{
              label: "Browse all vendors",
              href: `/vendors?school=${school}&campus=${campus}`,
            }}
          />
        ) : (
          <div className="vendors-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {fetchedVendors.map(
              (v, i) =>
                v && (
                  <div key={v.id} className="vendor-card-wrapper h-full">
                    <VendorCard vendor={v} />
                  </div>
                )
            )}
          </div>
        )}

        <div className="vendors-cta mt-16 flex justify-center">
          <Button
            asChild
            variant="hero"
            size="xl"
            className="group rounded-2xl px-12 py-7 text-lg shadow-[0_10px_40px_rgb(234,88,12,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_50px_rgb(234,88,12,0.4)]"
          >
            <Link
              href={`/vendors?school=${school}&campus=${campus}`}
              className="flex items-center gap-2 font-bold tracking-tight"
            >
              View all vendors{" "}
              <ExternalLink className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
