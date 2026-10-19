"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { useSession } from "next-auth/react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"
import { useCampus } from "@/components/providers/CampusProvider"
import { HERO_SLIDES } from "@/lib/config/heroSlides"

const AUTOPLAY_S = 5
const N = HERO_SLIDES.length

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * Full-bleed hero stage. One image fills the full width; each new image
 * wipes in from the right edge like a curtain while the photo drifts inside.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(
    () => new Set([0, 1])
  )
  const { schoolId, campusId } = useCampus()
  const { data: session } = useSession()
  const menusHref = `/menus?school=${schoolId}&campus=${campusId}`
  const stageRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<gsap.core.Tween | null>(null)
  const indexRef = useRef(0)
  const busyRef = useRef(false)
  const pausedRef = useRef(false)
  const goRef = useRef<(dir: 1 | -1, target?: number) => void>(() => {})

  const startProgress = useCallback(() => {
    if (!barRef.current) return
    progressRef.current?.kill()
    gsap.set(barRef.current, { scaleX: 0 })
    progressRef.current = gsap.to(barRef.current, {
      scaleX: 1,
      duration: AUTOPLAY_S,
      ease: "none",
      onComplete: () => goRef.current(1),
    })
    if (pausedRef.current) progressRef.current.pause()
  }, [])

  const go = (dir: 1 | -1, target?: number) => {
    if (busyRef.current) return
    const from = indexRef.current
    const to = target ?? (from + dir + N) % N
    if (to === from) return

    // Pre-mount the target slide and the one immediately after it
    setLoadedSlides((prev) => {
      const nextNext = (to + 1) % N
      if (prev.has(to) && prev.has(nextNext)) return prev
      const updated = new Set(prev)
      updated.add(to)
      updated.add(nextNext)
      return updated
    })

    const inEl = slideRefs.current[to]
    const outEl = slideRefs.current[from]
    if (!inEl || !outEl) return

    busyRef.current = true
    const enter = dir === 1
    const dur = prefersReducedMotion() ? 0.01 : 1.2
    const inImg = inEl.querySelector(".hc-img")

    gsap.set(inEl, {
      visibility: "visible",
      zIndex: 2,
      clipPath: enter ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
    })
    gsap.set(outEl, { zIndex: 1 })

    gsap
      .timeline({
        defaults: { duration: dur, ease: "power4.inOut", force3D: true },
        onComplete: () => {
          gsap.set(outEl, { visibility: "hidden", xPercent: 0, opacity: 1 })
          gsap.set(inEl, { clearProps: "clipPath" })
          busyRef.current = false
        },
      })
      // Curtain wipe from the right (or left when going back)
      .to(inEl, { clipPath: "inset(0% 0% 0% 0%)" }, 0)
      // Parallax: the photo drifts inside its frame while the wipe opens
      .fromTo(
        inImg,
        { xPercent: enter ? 15 : -15, scale: 1.15 },
        {
          xPercent: 0,
          scale: 1,
          duration: dur * 1.3,
          ease: "power3.out",
          force3D: true,
        },
        0
      )
      // Outgoing image slides away slower and dims, giving depth
      .to(outEl, { xPercent: enter ? -25 : 25, opacity: 0.4, force3D: true }, 0)

    indexRef.current = to
    setIndex(to)
    startProgress()
  }

  useEffect(() => {
    goRef.current = go
  })

  // Intro: the first image wipes in from the right edge on load
  useEffect(() => {
    const first = slideRefs.current[0]
    if (!first) return
    const dur = prefersReducedMotion() ? 0.01 : 1.6
    gsap.killTweensOf(first)
    gsap.fromTo(
      first,
      { clipPath: "inset(0% 0% 0% 100%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: dur,
        ease: "power4.out",
        clearProps: "clipPath",
      }
    )
    gsap.fromTo(
      first.querySelector(".hc-img"),
      { xPercent: 15, scale: 1.2 },
      {
        xPercent: 0,
        scale: 1,
        duration: dur * 1.4,
        ease: "power3.out",
        force3D: true,
      }
    )
    startProgress()
    return () => {
      progressRef.current?.kill()
    }
  }, [startProgress])

  // Writeup re-animates lightly on every slide
  useEffect(() => {
    if (!stageRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hc-copy-item",
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.08,
          delay: index === 0 ? 0.5 : 0.35,
          ease: "power3.out",
        }
      )
    }, stageRef)
    return () => ctx.revert()
  }, [index])

  const pause = (paused: boolean) => {
    pausedRef.current = paused
    if (paused) progressRef.current?.pause()
    else progressRef.current?.resume()
  }

  return (
    <div className="w-full px-3 pt-3 sm:px-5 sm:pt-4 lg:px-8">
      <div
        ref={stageRef}
        className="relative h-[min(75vh,700px)] min-h-[420px] w-full overflow-hidden rounded-3xl bg-muted"
        onMouseEnter={() => pause(true)}
        onMouseLeave={() => pause(false)}
      >
        {/* Slides: stacked, full-bleed with on-demand pre-mounting */}
        {HERO_SLIDES.map((slide, i) => {
          const isLoaded = loadedSlides.has(i)
          return (
            <div
              key={slide.src}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              className="absolute inset-0 overflow-hidden"
              style={{
                visibility: i === 0 ? "visible" : "hidden",
                zIndex: i === 0 ? 2 : 0,
              }}
            >
              {isLoaded && (
                <div className="hc-img absolute inset-0 [transform:translateZ(0)] [will-change:transform]">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Soft scrim only on the bottom-left so the rest of the photo stays clean */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-background/70 via-transparent to-transparent md:from-background/60 md:via-transparent" />

        {/* Compact writeup, bottom-left with optimized backdrop blur */}
        <div className="absolute bottom-6 left-4 z-20 max-w-[min(92vw,460px)] rounded-2xl border border-border/70 bg-card/85 p-4 shadow-xl backdrop-blur-md sm:left-8 sm:p-5 lg:bottom-10 lg:left-14 dark:bg-card/75">
          <div className="hc-copy-item inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Food right when you need it
          </div>
          <h1 className="hc-copy-item mt-3 font-heading text-2xl leading-[1.1] font-bold tracking-tight sm:text-3xl lg:text-4xl">
            <span className="text-primary">Hungry?</span> Order on{" "}
            <span className="text-primary">{APP_NAME}</span> in a few clicks.
          </h1>
          <p className="hc-copy-item mt-2 hidden text-sm text-muted-foreground sm:block">
            Discover vendors around school and order in seconds.
          </p>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-3 sm:right-8 md:top-auto md:bottom-6 lg:right-14 lg:bottom-10">
          <Button
            asChild
            variant="hero"
            size="lg"
            className="hidden h-10 rounded-full px-5 md:inline-flex"
          >
            <Link
              href={
                session?.user
                  ? menusHref
                  : `/customer/login?redirect=${menusHref}`
              }
            >
              {session?.user ? "Order now" : "Login to order"}{" "}
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/85 p-1.5 backdrop-blur-sm dark:bg-card/75">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => go(-1)}
              aria-label="Previous slide"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => go(1, i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-6 bg-primary"
                      : "w-2 bg-foreground/30 hover:bg-foreground/50"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => go(1)}
              aria-label="Next slide"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Autoplay progress */}
        <div
          ref={barRef}
          className="absolute bottom-0 left-0 z-30 h-0.5 w-full origin-left bg-primary"
        />
      </div>
    </div>
  )
}
