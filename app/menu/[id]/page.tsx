import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  Tag,
  ExternalLink,
  UtensilsCrossed,
} from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { getMenuItemById } from "@/lib/services/menuService"
import { formatPrice } from "@/lib/format"
import { isPreorderPrepTime, formatPrepTime } from "@/lib/format"
import { SingleItemCartControls } from "@/components/menus/SingleItemCartControls"
import { MenuItemCard } from "@/components/menus/MenuItemCard"
import { FadeIn } from "@/components/FadeIn"
import { ClientCartWrapper } from "./ClientCartWrapper"
import { RelatedItemsGrid } from "./RelatedItemsGrid"
import { ShareButton } from "@/components/public-vendors/ShareButton"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const data = await getMenuItemById(id)
    if (!data) return { title: "Item Not Found" }

    const { mainItem, vendor } = data
    const title = `${mainItem.name} from ${vendor.name} — BiteHub`
    const description =
      mainItem.description ||
      `Order ${mainItem.name} from ${vendor.name} on BiteHub. ${formatPrice(mainItem.price)}.`

    // Fallback to vendor image or default OG image if the item doesn't have an image
    const itemImageUrl =
      typeof mainItem.image === "string" ? mainItem.image : mainItem.image?.url
    const vendorImageUrl = vendor.image?.url

    const imageUrl = itemImageUrl || vendorImageUrl || "/og-image.png"

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `/menu/${id}`,
        images: [
          { url: imageUrl, width: 800, height: 800, alt: mainItem.name },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    }
  } catch (error) {
    return { title: "Item Not Found" }
  }
}

export default async function SingleMenuPage({ params }: Props) {
  const { id } = await params
  let data

  try {
    data = await getMenuItemById(id)
  } catch (error) {
    notFound()
  }

  if (!data) notFound()

  const { mainItem, relatedItems, vendor } = data

  const imageUrl =
    typeof mainItem.image === "string" ? mainItem.image : mainItem.image?.url

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <div className="flex-1 px-6 py-10 pb-32">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/vendors/${vendor.slug}`}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to {vendor.name}
          </Link>

          <FadeIn>
            <div className="grid grid-cols-1 gap-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 md:grid-cols-2 md:gap-14">
              {/* Image Section */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted md:aspect-[4/5]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={mainItem.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30">
                    <UtensilsCrossed className="mb-4 size-16" />
                    <span className="text-sm font-medium tracking-widest text-muted-foreground/50 uppercase">
                      No Image
                    </span>
                  </div>
                )}
                {mainItem.tag && (
                  <span className="absolute top-4 left-4 rounded-full border border-border bg-background/95 px-3 py-1 text-xs font-bold text-foreground shadow-sm">
                    {mainItem.tag}
                  </span>
                )}
              </div>

              {/* Details Section */}
              <div className="flex flex-col">
                <div className="flex-1">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-primary capitalize">
                          <Tag className="size-3" />
                          {mainItem.category}
                        </span>
                        {vendor.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold tracking-wide text-green-700 uppercase dark:bg-green-900/30 dark:text-green-400">
                            Vendor Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                            Vendor Closed
                          </span>
                        )}
                        {((mainItem.prepTimeValue && mainItem.prepTimeUnit) ||
                          vendor.prepTime) && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
                            <Clock className="size-3" />
                            <span
                              className={
                                mainItem.prepTimeValue ? "capitalize" : ""
                              }
                            >
                              {mainItem.prepTimeValue &&
                              mainItem.prepTimeUnit ? (
                                <>
                                  {isPreorderPrepTime(
                                    mainItem.prepTimeValue,
                                    mainItem.prepTimeUnit
                                  ) ? (
                                    <span className="font-bold text-primary">
                                      Pre-order:{" "}
                                    </span>
                                  ) : (
                                    "Prep time: "
                                  )}
                                  {formatPrepTime(
                                    mainItem.prepTimeValue,
                                    mainItem.prepTimeUnit
                                  )}
                                </>
                              ) : (
                                `Prep time: ${vendor.prepTime}`
                              )}
                            </span>
                          </span>
                        )}
                      </div>

                      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {mainItem.name}
                      </h1>
                    </div>
                    <ShareButton
                      urlPath={`/menu/${mainItem.id}`}
                      title={`Order ${mainItem.name} from ${vendor.name} on BiteHub!`}
                      buttonText="Share"
                    />
                  </div>

                  <p className="mb-6 text-3xl font-black text-primary tabular-nums">
                    {formatPrice(mainItem.price)}
                  </p>

                  <Link
                    href={`/vendors/${vendor.slug}`}
                    className="group mb-8 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary shadow-inner">
                      {vendor.image?.url ? (
                        <Image
                          src={vendor.image.url}
                          alt={vendor.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        vendor.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                        {vendor.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {vendor.prepTime || "Prep time varies"}
                      </p>
                    </div>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>

                  {mainItem.description && (
                    <div className="mb-8">
                      <h3 className="mb-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
                        Description
                      </h3>
                      <p className="text-base leading-relaxed text-foreground/80">
                        {mainItem.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Fixed controls area */}
                <div className="mt-auto border-t border-border pt-8">
                  <SingleItemCartControls item={mainItem} />
                </div>
              </div>
            </div>
          </FadeIn>

          {/* More from this vendor */}
          {relatedItems.length > 0 && (
            <div className="mt-20">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-heading text-2xl font-bold">
                  More from {vendor.name}
                </h2>
                <Link
                  href={`/vendors/${vendor.slug}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View full menu
                </Link>
              </div>
              <RelatedItemsGrid items={relatedItems} />
            </div>
          )}
        </div>
      </div>

      <ClientCartWrapper />
      <Footer />
    </main>
  )
}
