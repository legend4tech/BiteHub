"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin, Timer, Zap, ExternalLink } from "lucide-react"
import Link from "next/link"
import { FadeIn } from "@/components/FadeIn"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import { CampusSelector } from "@/components/shared/CampusSelector"
import { useCampus } from "@/components/providers/CampusProvider"
import { useSearchParams } from "next/navigation"

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

  return (
    <section className="relative" style={{ overflowX: "clip" }}>
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      {/* Ambient glow orb for depth */}
      <div className="absolute top-1/4 right-0 -z-10 hidden h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] lg:block" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-24 lg:grid-cols-12">
        {/* Left — text content */}
        <div className="animate-fade-in-up space-y-8 lg:col-span-6">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Your campus. Your vendors. Your meal.
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="font-heading text-5xl leading-[1.05] font-bold tracking-tight md:text-6xl lg:text-7xl">
              Get your favorite campus meals on{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
              , <span className="text-primary">delivered</span> at the speed of
              hunger.
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Discover the best vendors around school, browse menus and place an
              order in seconds — all in one place.
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link href={`/menus?${campusQuery}`}>
                  Browse menus
                  <ExternalLink className="ml-2 size-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href={`/vendors?${campusQuery}`}>
                  Browse vendors <ExternalLink className="ml-2 size-5" />
                </Link>
              </Button>
            </div>
            {/* Social Proof Avatar Group */}
            <div className="mt-6 flex items-center gap-4">
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
                <div className="flex items-center gap-1 text-amber-500">
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
                  Loved by early students on campus
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Browsing for:
              </span>
              <CampusSelector />
            </div>
          </FadeIn>

          {/* Stats — honest pre-launch values */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap items-center gap-6 border-t border-border/60 pt-6">
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
          </FadeIn>
        </div>

        {/* Right — image carousel */}
        <div className="animate-fade-in-scale relative lg:col-span-6">
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
          <div className="absolute -bottom-6 -left-6 hidden w-56 animate-float rounded-2xl border border-white/20 bg-card/70 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl md:block dark:border-white/10 dark:bg-black/50">
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
          <FadeIn delay={0.7}>
            <div
              className="absolute -top-4 -right-4 hidden animate-float items-center gap-2 rounded-2xl border border-white/20 bg-card/70 px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl md:flex dark:border-white/10 dark:bg-black/50"
              style={{ animationDelay: "2s" }}
            >
              <Zap className="size-4 fill-primary text-primary" />
              <span className="text-sm font-semibold">
                Order in under 60 seconds
              </span>
            </div>
          </FadeIn>
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
