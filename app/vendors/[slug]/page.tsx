import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Circle, Phone, MessageCircle, Calendar, GraduationCap, Tag } from "lucide-react";
import { VendorMenu } from "@/components/vendors/VendorMenu";
import { ShareButton } from "@/components/vendors/ShareButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getVendorData(slug: string, category?: string, q?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let url = `${baseUrl}/api/vendors/${slug}`;
  
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  const res = await fetch(url, {
    cache: "no-store"
  });
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch vendor");
  }
  
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVendorData(slug);
  
  if (!data || !data.vendor) return { title: "Vendor Not Found — CampusBites" };
  
  return {
    title: `${data.vendor.name} — CampusBites`,
    description: data.vendor.description || data.vendor.tagline,
  };
}

export default async function VendorDetailPage({ params, searchParams }: Props) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "all";
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";

  const data = await getVendorData(slug, category, q);
  
  if (!data || !data.vendor) notFound();

  const { vendor, menuItems: rawMenuItems, allCategories } = data;
  console.log("VENDOR FROM API", vendor); 

  const menuItems = rawMenuItems.map((item: any) => ({
    id: item.id,
    vendorId: item.vendorId,
    vendorName: vendor.name,
    // Pass vendor WhatsApp number onto each item so the cart can forward it
    // to the order API. Without this, cart.vendorWhatsappNumber is always null.
    vendorWhatsappNumber: vendor.whatsappNumber ?? "",
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    image: item.image ?? null,
    category: item.category,
    isAvailable: item.isAvailable,
    tag: item.tag,
  }));

  console.log("FIRST MENU ITEM", menuItems[0]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-10 pb-28">
        {/* Vendor header */}
        <div className="rounded-3xl bg-card border border-border p-8 mb-8 overflow-hidden relative shadow-sm">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          {/* Share button — always top-right on every screen */}
          <div className="absolute top-5 right-5 z-20">
            <ShareButton slug={vendor.slug} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 relative z-10">
            {/* Logo/Initials */}
            <div className="h-28 w-28 rounded-3xl grid place-items-center text-primary-foreground font-bold text-4xl shrink-0 bg-gradient-to-br from-primary to-orange-600 shadow-xl shadow-primary/20">
              {vendor.initials || vendor.name.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">{vendor.name}</h1>
                    {vendor.isActive ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-bold tracking-wide bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full uppercase">
                        <Circle className="size-2 fill-current" /> Open
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold tracking-wide bg-muted px-3 py-1.5 rounded-full uppercase">
                        Closed
                      </span>
                    )}
                </div>

                {vendor.description && (
                  <p className="text-muted-foreground mt-3 text-base md:text-lg max-w-2xl leading-relaxed">
                    {vendor.description}
                  </p>
                )}
              </div>

              {/* Badges/Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary capitalize">
                  <Tag className="size-3.5" />
                  {vendor.category}
                </span>
                {vendor.tags?.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground capitalize">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mt-6 pt-6 border-t border-border/50">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <GraduationCap className="size-4 text-primary" />
                    <span><strong className="text-foreground font-medium">Location:</strong> {vendor.school} • {vendor.campus}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Calendar className="size-4 text-primary" />
                    <span><strong className="text-foreground font-medium">Joined:</strong> {formatDate(vendor.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Phone className="size-4 text-primary" />
                    <span>
                      <strong className="text-foreground font-medium">Phone:</strong> {vendor.phone || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <MessageCircle className="size-4 text-green-500" />
                    <span className="flex items-center gap-2">
                      <strong className="text-foreground font-medium">WhatsApp:</strong>
                      {vendor.whatsappNumber ? (
                        <a href={`https://wa.me/${vendor.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">
                          {vendor.whatsappNumber}
                        </a>
                      ) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VendorMenu owns: category tabs, grid, cart, conflict dialog */}
        <Suspense
          key={category + q}
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
              title={category === "all" ? "No menu items found" : "No items in this category"}
              description={
                category === "all"
                  ? "This vendor hasn't added any items to their menu yet."
                  : "Try a different category or search term."
              }
              className="py-20 bg-card rounded-3xl border border-border"
              action={category !== "all" ? { label: "Clear filter", href: `/vendors/${vendor.slug}` } : undefined}
            />
          )}
        </Suspense>
      </div>
    </main>
  );
}
