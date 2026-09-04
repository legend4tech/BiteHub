"use client"

import { useState, useRef } from "react"
import { MenuItemGrid } from "@/components/menus/MenuItemGrid"
import { CartSheet } from "@/components/cart/CartSheet"
import { CartSummary } from "@/components/cart/CartSummary"
import { MENU_CATEGORIES } from "@/lib/constants"
import { useCart } from "@/hooks/useCart"
import type { MenuItem } from "@/lib/types"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ExternalLink } from "lucide-react"
import { useCampus } from "@/components/providers/CampusProvider"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

interface AllProductsProps {
  initialItems: MenuItem[]
  activeCategory: string
}

export function AllProducts({
  initialItems,
  activeCategory,
}: AllProductsProps) {
  const [orderFormOpen, setOrderFormOpen] = useState(false)
  const [conflictItem, setConflictItem] = useState<MenuItem | null>(null)
  const { clearAndAdd } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { schoolId, campusId } = useCampus()
  const cq = `school=${schoolId}&campus=${campusId}`
  const sectionRef = useRef<HTMLElement>(null)

  const filtered = initialItems
  const displayItems = filtered.slice(0, 10)

  useGSAP(
    () => {
      // Header animation
      gsap.fromTo(
        ".products-header > *",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".products-header",
            start: "top 85%",
          },
        }
      )

      // Tabs stagger
      gsap.fromTo(
        ".products-tab",
        { opacity: 0, scale: 0.8, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: ".products-tabs-container",
            start: "top 85%",
          },
        }
      )

      // Products Grid Stagger
      // Note: The items are inside MenuItemGrid so we target them dynamically if possible
      // Alternatively, we wrap the grid in a container and animate it entering.
      gsap.fromTo(
        ".products-grid-container",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".products-grid-container",
            start: "top 80%",
          },
        }
      )

      // Button pop
      gsap.fromTo(
        ".products-cta",
        { opacity: 0, scale: 0.9, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".products-cta",
            start: "top 90%",
          },
        }
      )
    },
    { scope: sectionRef }
  )

  const handleDifferentVendor = (item: MenuItem) => setConflictItem(item)

  const handleClearAndAdd = () => {
    if (!conflictItem) return
    clearAndAdd(conflictItem)
    setConflictItem(null)
  }

  return (
    <section ref={sectionRef} id="menu" className="relative py-24">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent,rgba(234,88,12,0.03)_50%,transparent)]" />
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="products-header mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold tracking-wider text-primary uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Everything on campus
            </p>
            <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Meals, snacks &amp; drinks
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="rounded-full bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
              {filtered.length} items available
            </p>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="products-tabs-container mb-12 flex flex-wrap gap-3">
          {MENU_CATEGORIES.map((cat) => {
            const params = new URLSearchParams(searchParams)
            if (cat.value === "all") {
              params.delete("category")
            } else {
              params.set("category", cat.value)
            }
            const href = `?${params.toString()}#menu`

            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault()
              startTransition(() => {
                router.push(href)
              })
            }

            return (
              <a
                key={cat.value}
                href={href}
                onClick={handleClick}
                className={`products-tab flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                  activeCategory === cat.value
                    ? "border-primary bg-primary text-white shadow-[0_8px_20px_-4px_rgba(234,88,12,0.5)]"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full shadow-sm">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
                {cat.label}
              </a>
            )
          })}
        </div>

        {/* Grid */}
        <div className="products-grid-container">
          {isPending ? (
            <div className="py-8">
              <PageSkeleton variant="menu-item-grid" count={10} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Nothing in this category"
              description="No meals are available for this filter right now. Try another category or check back soon."
              action={{ label: "View all menus", href: `/menus?${cq}` }}
            />
          ) : (
            <MenuItemGrid
              items={displayItems}
              onDifferentVendor={handleDifferentVendor}
              keyPrefix="landing-"
            />
          )}
        </div>

        <div className="products-cta mt-16 flex justify-center">
          <Button
            asChild
            variant="hero"
            size="xl"
            className="group rounded-2xl px-12 py-7 text-lg shadow-[0_10px_40px_rgb(234,88,12,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_50px_rgb(234,88,12,0.4)]"
          >
            <Link
              href={
                activeCategory === "all"
                  ? `/menus?${cq}`
                  : `/menus?category=${activeCategory}&${cq}`
              }
              className="flex items-center gap-2 font-bold tracking-tight"
            >
              View all menus{" "}
              <ExternalLink className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Floating cart */}
      <CartSummary onCheckout={() => setOrderFormOpen(true)} />

      {/* Cart Sheet */}
      <CartSheet open={orderFormOpen} onClose={() => setOrderFormOpen(false)} />

      {/* Cross-vendor conflict dialog */}
      {conflictItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setConflictItem(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-[0_30px_60px_rgb(0,0,0,0.3)]">
            <h3 className="font-heading text-xl font-bold tracking-tight">
              Start a new cart?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your cart has items from a different vendor. Adding{" "}
              <strong className="text-foreground">{conflictItem.name}</strong>{" "}
              will clear your current cart.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConflictItem(null)}
                className="flex-1 rounded-xl border border-border bg-muted/50 py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Keep cart
              </button>
              <button
                onClick={handleClearAndAdd}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 hover:shadow-primary/30"
              >
                Clear &amp; add
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
