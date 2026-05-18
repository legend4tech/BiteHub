import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AllProducts } from "@/components/landing/AllProducts";
import { FeaturedVendors } from "@/components/landing/FeaturedVendors";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { VendorCTA } from "@/components/landing/VendorCTA";
import { Footer } from "@/components/Footer";
import { FadeIn } from "@/components/FadeIn";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { Suspense } from "react";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Vendor from "@/models/Vendor";

export const metadata: Metadata = {
  title: "BiteHub — Campus food, delivered fast",
  description:
    "Discover the best campus food vendors around you, browse menus and order food in seconds — all from one app.",
  openGraph: {
    title: "BiteHub — Campus food, delivered fast",
    description: "Order from your favorite campus kitchens in seconds.",
  },
};

// ── Isolated async component: only this throws if DB is down ─────────────────
async function LandingMenuSection({ category }: { category: string }) {
  await dbConnect();

  let query: Record<string, unknown> = { isAvailable: true };
  if (category !== "all") query.category = category;

  const [items, vendors] = await Promise.all([
    MenuItem.find(query).sort({ createdAt: -1 }).limit(10),
    Vendor.find({}),
  ]);

  const vendorMap = new Map<string, { name: string; slug: string }>();
  vendors.forEach((v) => vendorMap.set(v._id.toString(), { name: v.name, slug: v.slug }));

  const mappedItems = items.map((item) => {
    const doc = item.toJSON();
    const vendorData = vendorMap.get(doc.vendorId);
    doc.vendorName = vendorData?.name || "Campus Vendor";
    doc.vendorSlug = vendorData?.slug || "";
    doc.tag = doc.price > 1000 ? "🔥 Hot" : null;
    return doc;
  });

  return <AllProducts initialItems={mappedItems} activeCategory={category} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const category =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "all";

  return (
    <>
      {/* Navbar must be outside main to avoid overflow-x-hidden breaking sticky */}
      <Navbar />
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Menu section — shows inline error if DB unreachable */}
        <Hero />
        <SectionErrorBoundary
          title="Couldn't load menu items"
          message="We couldn't reach the server. Check your connection and try again."
          padded
        >
          <Suspense
            key={category}
            fallback={
              <section className="py-20">
                <div className="mx-auto max-w-7xl px-6">
                  <PageSkeleton variant="menu-item-grid" count={10} />
                </div>
              </section>
            }
          >
            <LandingMenuSection category={category} />
          </Suspense>
        </SectionErrorBoundary>

        {/* Featured vendors — self-contained async component with its own DB call */}
        <SectionErrorBoundary
          title="Couldn't load featured vendors"
          message="We couldn't reach the server. Check your connection and try again."
          padded
        >
          <Suspense
            fallback={
              <section className="py-24 bg-card/40 border-y border-border/60">
                <div className="mx-auto max-w-7xl px-6">
                  <PageSkeleton variant="menu-item-grid" count={4} />
                </div>
              </section>
            }
          >
            <FeaturedVendors />
          </Suspense>
        </SectionErrorBoundary>

        {/* Always render — no data dependency */}
        <HowItWorks />
        <VendorCTA />
        <Footer />
      </main>
    </>
  );
}
