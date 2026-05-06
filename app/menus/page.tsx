import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MenuGrid } from "@/components/menus/MenuGrid";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadMoreMenus } from "@/components/menus/LoadMoreMenus";
import { FadeIn } from "@/components/FadeIn";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { Suspense } from "react";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Vendor from "@/models/Vendor";

// ── Isolated async component: only this throws if DB is down ─────────────────
async function MenuListContent({
  q,
  category,
}: {
  q: string;
  category: string;
}) {
  await dbConnect();

  let query: Record<string, unknown> = { isAvailable: true };
  if (category !== "all") query.category = category;
  if (q) {
    query = {
      ...query,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    };
  }

  const [items, totalItems, vendors] = await Promise.all([
    MenuItem.find(query).sort({ createdAt: -1 }).limit(20),
    MenuItem.countDocuments(query),
    Vendor.find({}),
  ]);

  const vendorMap = new Map<string, string>();
  vendors.forEach((v) => vendorMap.set(v._id.toString(), v.name));

  const mappedItems = items.map((item) => {
    const doc = item.toJSON();
    doc.vendorName = vendorMap.get(doc.vendorId) || "Campus Vendor";
    doc.tag = doc.price > 1000 ? "🔥 Hot" : null;
    return doc;
  });

  return (
    <>
      <p className="text-sm text-muted-foreground mb-6">{totalItems} items available</p>
      <MenuGrid initialItems={mappedItems} activeCategory={category} />
      {items.length === 20 && (
        <LoadMoreMenus
          initialPage={1}
          searchParams={{
            q: q || undefined,
            category: category !== "all" ? category : undefined,
          }}
        />
      )}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const category =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "all";

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Always renders */}
      <Navbar />

      <div className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-6">
          {/* Static header — always renders */}
          <FadeIn delay={0.1}>
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="size-4" /> Back to home
              </Link>
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <h1 className="font-heading text-3xl md:text-5xl font-bold">
                    All Menus
                  </h1>
                  <p className="text-muted-foreground mt-2 mb-4">
                    Discover every meal available on campus.
                  </p>
                  <SearchInput placeholder="Search for meals, snacks..." />
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Data section — inline error if DB unreachable */}
          <SectionErrorBoundary
            title="Couldn't load menu items"
            message="We couldn't reach the server. Check your connection and try again."
          >
            <Suspense
              key={`${q}-${category}`}
              fallback={
                <div className="py-8">
                  <PageSkeleton variant="menu-item-grid" count={12} />
                </div>
              }
            >
              <MenuListContent q={q} category={category} />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Always renders */}
      <Footer />
    </main>
  );
}
