import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VendorCard } from "@/components/vendors/VendorCard";
import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";
import MenuItem from "@/models/MenuItem";
import { FadeIn } from "@/components/FadeIn";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadMoreVendors } from "@/components/vendors/LoadMoreVendors";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";

export const metadata: Metadata = {
  title: "Vendors — CampusBites",
  description: "Browse all active food vendors on COOU Uli campus.",
};

// ── Isolated async component: only this throws if DB is down ─────────────────
async function VendorListContent({ q }: { q: string }) {
  await dbConnect();

  let query: Record<string, unknown> = { isActive: true };
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  const [vendorDocs, totalVendors, menuItems] = await Promise.all([
    Vendor.find(query).sort({ createdAt: -1 }).limit(20),
    Vendor.countDocuments(query),
    MenuItem.find({ isAvailable: true }),
  ]);

  const fetchedVendors = vendorDocs.map((v) => ({
    id: v.id,
    name: v.name,
    initials: v.initials,
    tagline: v.tagline,
    location: v.location,
    isActive: v.isActive,
    slug: v.slug,
    description: v.description,
    category: v.category,
    tags: v.tags,
    phone: v.phone,
    whatsappNumber: v.whatsappNumber,
    school: v.school,
    campus: v.campus,
  }));

  return (
    <>
      <p className="text-muted-foreground text-sm mb-6">
        {totalVendors} active kitchen{totalVendors !== 1 ? "s" : ""} ready to serve you.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {fetchedVendors.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title={q ? `No vendors matched "${q}"` : "No vendors yet"}
              description={
                q
                  ? "Try a different search term or browse all vendors."
                  : "No active vendors are available right now. Check back soon!"
              }
              action={q ? { label: "Clear search", href: "/vendors" } : undefined}
            />
          </div>
        ) : (
          fetchedVendors.map((vendor, i) => {
            const itemCount = menuItems.filter(
              (m) => m.vendorId.toString() === vendor.id
            ).length;
            return (
              <FadeIn key={vendor.id} delay={0.05 * Math.min(i, 20)}>
                <VendorCard vendor={vendor} itemCount={itemCount} />
              </FadeIn>
            );
          })
        )}
      </div>

      {vendorDocs.length === 20 && (
        <LoadMoreVendors
          initialPage={1}
          searchParams={{ q: q || undefined }}
        />
      )}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Always renders */}
      <Navbar />

      <div className="flex-1 py-16">
        <div className="mx-auto max-w-7xl px-6">
          {/* Static header — always renders */}
          <FadeIn delay={0.1}>
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                  COOU Uli Campus
                </p>
                <h1 className="font-heading text-4xl md:text-5xl font-bold mt-2">
                  All Vendors
                </h1>
              </div>
              <div className="w-full md:w-auto">
                <SearchInput placeholder="Search vendors by name, category..." />
              </div>
            </div>
          </FadeIn>

          {/* Data section — inline error if DB unreachable */}
          <SectionErrorBoundary
            title="Couldn't load vendors"
            message="We couldn't reach the server. Check your connection and try again."
          >
            <Suspense
              key={q}
              fallback={
                <div className="py-8">
                  <PageSkeleton variant="menu-item-grid" count={8} />
                </div>
              }
            >
              <VendorListContent q={q} />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Always renders */}
      <Footer />
    </main>
  );
}
