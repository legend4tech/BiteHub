import { MENU_CATEGORIES } from "@/lib/constants";
import { FadeIn } from "@/components/FadeIn";
import Image from "next/image";

export function Categories() {
  // Filter out the "all" entry — it's a filter chip, not a display category
  const displayCategories = MENU_CATEGORIES.filter((c) => c.value !== "all");

  return (
    <section className="py-16 border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn delay={0.1}>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">Explore</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mt-1">Browse by category</h2>
            </div>
            <a href="#menu" className="text-sm font-medium text-muted-foreground hover:text-primary">View all →</a>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayCategories.map((c, i) => (
            <FadeIn key={c.value} delay={0.1 * (i + 1)}>
              <button
                className="w-full group rounded-2xl bg-background border border-border p-3 text-left transition-all duration-200 hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_28px_-6px_rgba(255,107,0,0.25)] flex flex-col"
              >
                <div className="relative h-28 w-full mb-3 rounded-xl overflow-hidden bg-muted">
                  <Image src={c.image} alt={c.label} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 20vw" />
                </div>
                <p className="font-semibold text-sm px-1 pb-1">{c.label}</p>
              </button>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
