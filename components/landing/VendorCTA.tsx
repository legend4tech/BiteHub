"use client"

import { useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"
import { APP_NAME } from "@/lib/constants"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const VENDOR_FORM_URL = "https://forms.gle/KEwY8nthHHfjLL1n6"

export function VendorCTA() {
  const sectionRef = useRef<HTMLElement>(null)

  const perks = [
    "Reach thousands of hungry students every day",
    "Manage your menu and orders from one dashboard",
    "Built-in order management — zero commission to start",
  ]

  useGSAP(
    () => {
      // CTA Container Scale and Parallax
      gsap.fromTo(
        ".cta-container",
        { opacity: 0, scale: 0.9, y: 50 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".cta-container",
            start: "top 85%",
          },
        }
      )

      // Text Stagger
      gsap.fromTo(
        ".cta-text > *",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta-container",
            start: "top 75%",
          },
        }
      )

      // Perks Stagger
      gsap.fromTo(
        ".cta-perk",
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cta-container",
            start: "top 70%",
          },
        }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="vendor-cta" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="cta-container relative overflow-hidden rounded-[3rem] bg-primary p-10 text-primary-foreground shadow-[0_20px_60px_-15px_rgba(234,88,12,0.4)] md:p-16">
          {/* Decorative elements */}
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute -bottom-32 -left-32 h-[600px] w-[600px] rounded-full bg-black/20 blur-[100px]" />

          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div className="cta-text z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                For vendors
              </p>
              <h2 className="mt-6 font-heading text-4xl leading-[1.1] font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                Selling food, snacks, or drinks on campus? List on{" "}
                <span className="text-white drop-shadow-md">{APP_NAME}</span>.
              </h2>
              <p className="mt-6 max-w-lg text-lg font-medium text-primary-foreground/90">
                Get more orders, less stress. Sign up today and start receiving
                orders within 24 hours.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  size="xl"
                  variant="default"
                  className="bg-background font-bold text-foreground shadow-xl transition-all hover:-translate-y-1 hover:bg-background/90 hover:shadow-2xl"
                  asChild
                >
                  <Link
                    href={VENDOR_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Become a vendor <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              </div>
            </div>

            <ul className="z-10 space-y-4 lg:pl-10">
              {perks.map((p, i) => (
                <li
                  key={p}
                  className="cta-perk flex items-start gap-4 rounded-3xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background text-primary shadow-sm">
                    <Check className="size-5 font-bold" />
                  </span>
                  <span className="text-lg leading-snug font-semibold">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
