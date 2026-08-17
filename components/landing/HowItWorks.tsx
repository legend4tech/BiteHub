"use client"

import { useRef } from "react"
import { Search, Utensils, BellRing, type LucideIcon } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const steps: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Search,
    title: "Browse vendors",
    desc: "Find kitchens near your hostel and explore today's menus.",
  },
  {
    icon: Utensils,
    title: "Place your order",
    desc: "Pick your meals, checkout in seconds and get a unique order ID.",
  },
  {
    icon: BellRing,
    title: "Track in real time",
    desc: "Watch your order move from kitchen to your door, right inside the app.",
  },
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      // Header reveal
      gsap.fromTo(
        ".how-header > *",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".how-header",
            start: "top 85%",
          },
        }
      )

      // Staggered Steps
      gsap.fromTo(
        ".how-step",
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".how-grid",
            start: "top 80%",
          },
        }
      )

      // Connecting line animation (if we add a horizontal line between steps on desktop)
      if (window.innerWidth > 768) {
        gsap.fromTo(
          ".how-connector",
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: ".how-grid",
              start: "top 75%",
            },
          }
        )
      }
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      id="how"
      className="relative overflow-hidden py-24"
    >
      {/* Decorative background circle */}
      <div className="absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] -translate-x-1/3 translate-y-1/3 rounded-full bg-accent/30 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="how-header mb-16 max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold tracking-wider text-primary uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            How it works
          </p>
          <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            From craving to bite in 3 steps
          </h2>
        </div>

        <div className="how-grid relative grid gap-6 md:grid-cols-3 lg:gap-10">
          {/* Connector line for desktop */}
          <div className="how-connector absolute top-12 right-1/6 left-1/6 -z-10 hidden h-[2px] bg-gradient-to-r from-transparent via-border to-transparent md:block" />

          {steps.map((s, i) => (
            <div
              key={s.title}
              className="how-step group relative h-full rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_10px_40px_-10px_rgba(234,88,12,0.2)]"
            >
              <span className="absolute top-6 right-6 font-heading text-6xl font-extrabold text-accent-foreground/5 transition-colors duration-300 group-hover:text-primary/10">
                0{i + 1}
              </span>
              <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                <s.icon className="size-6" />
              </div>
              <h3 className="font-heading text-2xl font-bold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 leading-relaxed font-medium text-muted-foreground">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
