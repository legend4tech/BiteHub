import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/FadeIn";
import dbConnect from "@/lib/db";
import Vendor from "@/models/Vendor";

export async function FeaturedVendors() {
  await dbConnect();
  // Fetch real data from DB and use the fabricated virtuals
  const vendorDocs = await Vendor.find({ isActive: true }).limit(4);
  const fetchedVendors = vendorDocs.map(v => ({
    id: v.id,
    name: v.name,
    initials: v.initials,
    tagline: v.tagline,
    location: v.location,
  }));

  return (
    <section id="vendors" className="py-24 bg-card/40 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn delay={0.1}>
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">Featured kitchens</p>
              <h2 className="font-heading text-3xl md:text-5xl font-bold mt-2 max-w-2xl">
                Hand-picked vendors students love
              </h2>
            </div>
            <Button asChild variant="hero" size="sm">
              <Link href="/vendors">
                View all vendors &rarr;
              </Link>
            </Button>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {fetchedVendors.map((v, i) => (
            <FadeIn key={v.id} delay={0.1 * (i + 1)}>
              <Link
                href={`/vendors/${v.id}`}
                className="group rounded-3xl bg-background border border-border p-6 hover:border-primary transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_-6px_rgba(255,107,0,0.25)] flex flex-col h-full"
              >
                <div className="flex items-start justify-between">
                  <div className="h-14 w-14 rounded-2xl grid place-items-center text-white font-bold text-lg bg-primary">
                    {v.initials}
                  </div>
                  <ArrowUpRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-lg mt-5 leading-tight">{v.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">{v.tagline}</p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-5 pt-4 border-t border-border">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {v.location}
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
