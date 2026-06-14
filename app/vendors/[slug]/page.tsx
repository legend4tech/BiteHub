import { notFound } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import {
  Circle,
  Phone,
  Calendar,
  GraduationCap,
  Tag,
  Clock,
} from "lucide-react"
import { VendorMenu } from "@/components/public-vendors/VendorMenu"
import { ShareButton } from "@/components/public-vendors/ShareButton"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageSkeleton } from "@/components/shared/PageSkeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import Image from "next/image"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface RawMenuItem {
  id: string
  vendorId: string
  name: string
  description?: string
  price: number
  image?: { url: string }
  category: string
  isAvailable: boolean
  availableFrom?: string
  availableTo?: string
  tag?: string
}

async function getVendorData(slug: string, category?: string, q?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  let url = `${baseUrl}/api/vendors/${slug}`

  const params = new URLSearchParams()
  if (category && category !== "all") params.set("category", category)
  if (q) params.set("q", q)

  const queryString = params.toString()
  if (queryString) url += `?${queryString}`

  const res = await fetch(url, {
    cache: "no-store",
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error("Failed to fetch vendor")
  }

  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getVendorData(slug)

  if (!data || !data.vendor) return { title: "Vendor Not Found" }

  const vendor = data.vendor
  const title = `${vendor.name} — BiteHub`
  const description =
    vendor.description ||
    vendor.tagline ||
    `Order from ${vendor.name} on BiteHub. Browse their menu and place your order in seconds.`
  const ogImage = vendor.image?.url
    ? { url: vendor.image.url, width: 800, height: 800, alt: vendor.name }
    : {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${vendor.name} on BiteHub`,
      }

  return {
    title: vendor.name,
    description,
    openGraph: {
      title,
      description,
      url: `/vendors/${slug}`,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  }
}

export default async function VendorDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ])
  const category =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "all"
  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : ""

  const data = await getVendorData(slug, category, q)

  if (!data || !data.vendor) notFound()

  const { vendor, menuItems: rawMenuItems, allCategories } = data
  console.log("VENDOR FROM API", vendor)

  const menuItems = rawMenuItems.map((item: RawMenuItem) => ({
    id: item.id,
    vendorId: item.vendorId,
    vendorName: vendor.name,
    vendorSlug: vendor.slug,
    vendorWhatsappNumber: vendor.whatsappNumber ?? "",
    vendorDeliveryFee: vendor.deliveryFee ?? 0,
    vendorPrepTime: vendor.prepTime ?? "",
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    image: item.image ?? null,
    category: item.category,
    isAvailable: item.isAvailable,
    availableFrom: item.availableFrom,
    availableTo: item.availableTo,
    tag: item.tag,
  }))

  console.log("FIRST MENU ITEM", menuItems[0])

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10 pb-28">
        {/* Vendor header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm">
          {/* Background decoration */}
          <div className="pointer-events-none absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          {/* Share button — always top-right on every screen */}
          <div className="absolute top-5 right-5 z-20">
            <ShareButton
              urlPath={`/vendors/${vendor.slug}`}
              title={`Order from ${vendor.name} on BiteHub!`}
              buttonText="Share profile"
            />
          </div>

          <div className="relative z-10 flex flex-col gap-8 md:flex-row">
            {/* Logo/Initials */}
            <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-600 text-4xl font-bold text-primary-foreground shadow-xl shadow-primary/20">
              {vendor.image?.url ? (
                <Image
                  src={vendor.image.url}
                  alt={vendor.name}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                />
              ) : (
                vendor.initials || vendor.name.substring(0, 2).toUpperCase()
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {vendor.name}
                  </h1>
                  {vendor.isActive ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold tracking-wide text-green-600 uppercase dark:bg-green-900/30 dark:text-green-400">
                      <Circle className="size-2 fill-current" /> Open
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Closed
                    </span>
                  )}
                </div>

                {vendor.description && (
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                    {vendor.description}
                  </p>
                )}
              </div>

              {/* Badges/Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary capitalize">
                  <Tag className="size-3.5" />
                  {vendor.category}
                </span>
                {vendor.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-border/50 pt-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <GraduationCap className="size-4 text-primary" />
                    <span>
                      <strong className="font-medium text-foreground">
                        Location:
                      </strong>{" "}
                      {vendor.school} • {vendor.campus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Calendar className="size-4 text-primary" />
                    <span>
                      <strong className="font-medium text-foreground">
                        Joined:
                      </strong>{" "}
                      {formatDate(vendor.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {vendor.prepTime && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Clock className="size-4 text-primary" />
                      <span>
                        <strong className="font-medium text-foreground">
                          Prep Time:
                        </strong>{" "}
                        {vendor.prepTime}
                      </span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Phone className="size-4 text-primary" />
                      <span>
                        <strong className="font-medium text-foreground">
                          Phone:
                        </strong>{" "}
                        {vendor.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VendorMenu owns: category tabs, grid, cart, conflict dialog */}
        <Suspense
          fallback={
            <div className="py-12">
              <PageSkeleton variant="vendor-detail" />
            </div>
          }
        >
          {menuItems.length > 0 ? (
            <VendorMenu
              initialItems={menuItems}
              activeCategory={category}
              allCategories={allCategories ?? []}
            />
          ) : (
            <EmptyState
              title={
                category === "all"
                  ? "No menu items found"
                  : "No items in this category"
              }
              description={
                category === "all"
                  ? "This vendor hasn't added any items to their menu yet."
                  : "Try a different category or search term."
              }
              className="rounded-3xl border border-border bg-card py-20"
              action={
                category !== "all"
                  ? { label: "Clear filter", href: `/vendors/${vendor.slug}` }
                  : undefined
              }
            />
          )}
        </Suspense>
      </div>
    </main>
  )
}
