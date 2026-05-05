"use client";

import Image from "next/image";
import Link from "next/link";
import { useMenus } from "@/hooks/useMenus";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

// Shows the first 6 menu items as a "Trending" preview section.
// The full browsable product grid is in AllProducts (id="menu").
export function PopularDishes() {
  const { data: menuItems = [], isLoading } = useMenus();
  const featured = menuItems.filter((m) => m.isAvailable).slice(0, 6);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              Trending now
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mt-2 max-w-2xl">
              The dishes everyone is ordering this week
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="#menu">See full menu</Link>
          </Button>
        </div>

        {isLoading ? (
          <PageSkeleton variant="menu-item-grid" count={6} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((d) => (
              <article
                key={d.id}
                className="group rounded-3xl bg-card border border-border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_-6px_rgba(255,107,0,0.25)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {d.image && (
                    <Image
                      src={d.image}
                      alt={d.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  {d.tag && (
                    <span className="absolute top-3 left-3 bg-background/95 backdrop-blur text-foreground text-xs font-semibold px-3 py-1 rounded-full border border-border">
                      {d.tag}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted-foreground">{d.vendorName}</p>
                  <h3 className="font-heading font-semibold text-lg mt-1 leading-tight">{d.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-bold text-lg text-primary">₦{d.price.toLocaleString()}</p>
                    <Button asChild size="sm" variant="hero">
                      <Link href="#menu">Order</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
