import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Circle, Phone, MessageCircle, Calendar, GraduationCap, Tag } from "lucide-react";
import { VendorMenu } from "@/components/vendors/VendorMenu";
import { ShareButton } from "@/components/vendors/ShareButton";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getVendorData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/vendors/${slug}`, {
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

export default async function VendorDetailPage({ params }: Props) {
  const { slug } = await params;

  const data = await getVendorData(slug);
  
  if (!data || !data.vendor) notFound();

  const { vendor, menuItems: rawMenuItems } = data;

  const menuItems = rawMenuItems.map((item: any) => ({
    id: item._id.toString(),
    vendorId: item.vendorId,
    vendorName: vendor.name,
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    image: item.image ?? null,
    category: item.category,
    isAvailable: item.isAvailable,
    tag: item.price > 1000 ? "🔥 Hot" : null,
  }));

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
        {menuItems.length > 0 ? (
          <VendorMenu initialItems={menuItems} />
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
            <h3 className="text-xl font-heading font-semibold mb-2">No menu items found</h3>
            <p className="text-muted-foreground">This vendor hasn't added any items to their menu yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
