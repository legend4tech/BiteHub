"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, MapPin } from "lucide-react"
import Link from "next/link"
import { CampusSelector } from "@/components/shared/CampusSelector"
import { useCampus } from "@/components/providers/CampusProvider"
import { HeroCarousel } from "./HeroCarousel"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function Hero() {
  const { schoolId, campusId } = useCampus()
  const containerRef = useRef<HTMLElement>(null)

  // Build campus query string so CTA links carry the active filter
  const campusQuery = `school=${schoolId}&campus=${campusId}`

  useGSAP(
    () => {
      gsap.fromTo(
        ".gsap-hero-bar",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.08,
          delay: 0.9,
          ease: "power3.out",
        }
      )
    },
    { scope: containerRef }
  )

  // Magnetic cursor physics on the CTAs
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    gsap.to(e.currentTarget, {
      x: (e.clientX - (rect.left + rect.width / 2)) * 0.25,
      y: (e.clientY - (rect.top + rect.height / 2)) * 0.25,
      duration: 0.6,
      ease: "power3.out",
    })
  }
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.4, ease: "power2.out" })
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 1,
      ease: "elastic.out(1.2, 0.4)",
    })
  }

  return (
    <section ref={containerRef} className="relative">
      {/* Edge-to-edge image carousel with the compact writeup on it */}
      <HeroCarousel />

      {/* Action bar: one card, same side edges as the carousel above */}
      <div className="relative z-20 w-full px-3 pt-3 pb-8 sm:px-5 lg:px-8">
        <div className="gsap-hero-bar flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-4 opacity-0 shadow-sm backdrop-blur sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Campus block */}
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
              <MapPin className="size-5" />
            </div>
            <CampusSelector />
          </div>

          {/* Live order status (desktop) */}
          <div className="hidden items-center gap-3 border-x border-border/60 px-6 lg:flex">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">Order #BH-24-GJY</p>
              <p className="text-xs text-muted-foreground">
                Cooking now · 8 min left
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <Button asChild variant="hero" size="xl">
              <Link
                href={`/menus?${campusQuery}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                Browse menus
                <ExternalLink className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link
                href={`/vendors?${campusQuery}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                Browse vendors
                <ExternalLink className="ml-2 size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
