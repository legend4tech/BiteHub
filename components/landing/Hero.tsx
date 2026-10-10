"use client"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin, Timer, Zap, ExternalLink } from "lucide-react"
import Link from "next/link"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import { CampusSelector } from "@/components/shared/CampusSelector"
import { useCampus } from "@/components/providers/CampusProvider"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
const slides = [
  {
    src: "/soup.jpg",
    alt: "Bitter Leaf Soup",
  },
  {
    src: "/rice.jpg",
    alt: "Smoky jollof rice with chicken",
  },
  {
    src: "/sharwama.jpg",
    alt: "Beef shawarma special",
  },
  {
    src: "/bole.jpg",
    alt: "Pepper suya sticks",
  },
  {
    src: "/chicken.png",
    alt: "Fried plantain",
  },
  {
    src: "/smoothie.jpg",
    alt: "Tropical smoothie",
  },
]
export function Hero() {
  const [index, setIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { schoolId, campusId } = useCampus()
  const containerRef = useRef<HTMLElement>(null)
  // Build campus query string so CTA links carry the active filter
  const campusQuery = `school=${schoolId}&campus=${campusId}`
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0)
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3500)
    return () => {
      clearTimeout(t)
      clearInterval(id)
    }
  }, [])
  useGSAP(
    () => {
      // We use a high-end power3 easing for a premium, snappy yet fluid feel.
      // Delaying slightly to prevent layout thrashing and freezing during Next.js hydration
      const tl = gsap.timeline({
        delay: 0.2,
        defaults: { ease: "power3.out", duration: 1.2 },
      })
      // Reveal sequence
      tl.fromTo(".gsap-hero-badge", { opacity: 0, y: 20 }, { opacity: 1, y: 0 })
        .fromTo(
          ".gsap-hero-title",
          { yPercent: 120, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 1.4,
            stagger: 0.1,
            ease: "power4.out",
          },
          "<0.1" // Overlap aggressively: start 0.1s after the previous animation starts
        )
        .fromTo(
          ".gsap-hero-item",
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.05,
          },
          "<0.2"
        )
        .fromTo(
          ".gsap-hero-right",
          { scale: 0.95, rotation: -0.5, opacity: 0 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1.4,
          },
          "<0.1"
        )
        .fromTo(
          ".gsap-chip-1",
          { x: -40, y: 20, opacity: 0 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            ease: "back.out(1.5)",
          },
          "<0.2"
        )
        .fromTo(
          ".gsap-chip-2",
          { x: 40, y: -20, opacity: 0 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            ease: "back.out(1.5)",
          },
          "<0.1"
        )
      // Continuous floating animations for chips
      gsap.to(".gsap-chip-1", {
        y: -15,
        rotation: -3,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.5,
      })
      gsap.to(".gsap-chip-2", {
        y: 15,
        rotation: 3,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2,
      })
    },
    { scope: containerRef }
  )
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    // Move the button slightly towards the cursor (e.g. 25% of the distance)
    gsap.to(e.currentTarget, {
      x: distanceX * 0.25,
      y: distanceY * 0.25,
      duration: 0.6,
      ease: "power3.out",
    })
  }
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.05,
      duration: 0.4,
      ease: "power2.out",
    })
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
    <section
      ref={containerRef}
      className="relative"
      style={{ overflowX: "clip" }}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      {/* Ambient glow orb for depth */}
      <div className="absolute top-1/4 right-0 -z-10 hidden h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] lg:block" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-24 lg:grid-cols-12">
        {/* Left — text content */}
        <div className="space-y-8 lg:col-span-6">
          <div className="gsap-hero-badge inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground opacity-0">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Food right when you need it
          </div>
          <h1 className="font-heading text-5xl leading-[1.05] font-bold tracking-tight md:text-6xl lg:text-7xl">
            <div className="overflow-hidden pb-1">
              <div className="gsap-hero-title invisible">Get your favorite</div>
            </div>
            <div className="overflow-hidden pb-2">
              <div className="gsap-hero-title invisible">
                campus meals on{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {APP_NAME}
                </span>
                ,
              </div>
            </div>
            <div className="overflow-hidden pb-2">
              <div className="gsap-hero-title invisible">
                <span className="text-primary">delivered</span> at the speed of
                hunger.
              </div>
            </div>
          </h1>
          <p className="gsap-hero-item max-w-xl text-lg leading-relaxed text-muted-foreground opacity-0">
            Discover the best vendors around school, browse menus and place an
            order in seconds — all in one place.
          </p>
          <div className="gsap-hero-item flex flex-wrap gap-3 opacity-0">
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
            <Button
              asChild
              variant="secondary"
              size="xl"
              className="shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.15)]"
            >
              <Link
                href={`/vendors?${campusQuery}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                Browse vendors <ExternalLink className="ml-2 size-5" />
              </Link>
            </Button>
          </div>
          {/* Social Proof Avatar Group */}
          <div className="gsap-hero-item mt-6 flex items-center gap-4 opacity-0">
            <div className="flex -space-x-3">
              {["A", "C", "S", "K"].map((initial, i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary/90 text-sm font-bold text-white shadow-sm"
                >
                  {initial}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-warning">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Food right when you need it
              </p>
            </div>
          </div>
          <div className="gsap-hero-item relative z-10 mt-8 flex items-center gap-2 opacity-0">
            <span className="text-xs text-muted-foreground">Browsing for:</span>
            <CampusSelector />
          </div>
          {/* Stats — honest pre-launch values */}
          <div className="gsap-hero-item flex flex-wrap items-center gap-6 border-t border-border/60 pt-6 opacity-0">
            <Stat
              icon={<Zap className="text-primary" />}
              value="60 sec"
              label="To place an order"
            />
            <Stat
              icon={<Timer className="text-primary" />}
              value="~15 min"
              label="Est. prep time"
            />
            <Stat
              icon={<MapPin className="text-primary" />}
              value="10+"
              label="Vendors at launch"
            />
          </div>
        </div>
        {/* Right — image carousel */}
        <div className="gsap-hero-right relative opacity-0 lg:col-span-6">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60 bg-muted"
            style={{
              boxShadow:
                "0 20px 60px -12px color-mix(in oklch, var(--color-primary) 40%, transparent), 0 4px 20px -4px color-mix(in oklch, var(--color-primary) 20%, transparent)",
            }}
          >
            {mounted &&
              slides.map((slide, i) => (
                <Image
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  className={`object-cover transition-all duration-1000 ease-out ${
                    i === index
                      ? "scale-100 opacity-100"
                      : "scale-105 opacity-0"
                  }`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ))}
            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-primary" : "w-1.5 bg-background/70"
                  }`}
                />
              ))}
            </div>
          </div>
          {/* Feature chip — replaces fake order number */}
          <div className="gsap-chip-1 absolute -bottom-6 -left-6 hidden w-56 rounded-2xl border border-white/20 bg-card/70 p-4 opacity-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl md:block dark:border-white/10 dark:bg-black/50">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={APP_LOGO_URL}
                  alt={APP_NAME}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm leading-tight font-semibold">
                  Order #BH-24-GJY
                </p>
                <p className="text-xs font-medium text-primary">{APP_NAME}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-medium">Cooking now · 8 min left</span>
            </div>
          </div>
          {/* Value prop chip — replaces fake "ordered today" count */}
          <div className="gsap-chip-2 absolute -top-4 -right-4 hidden items-center gap-2 rounded-2xl border border-white/20 bg-card/70 px-4 py-3 opacity-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl md:flex dark:border-white/10 dark:bg-black/50">
            <Zap className="size-4 fill-primary text-primary" />
            <span className="text-sm font-semibold">
              Order in under 60 seconds
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent">
        {icon}
      </div>
      <div>
        <p className="text-lg leading-none font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
