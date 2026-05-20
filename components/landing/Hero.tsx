"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Smartphone, Timer, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";
import { CampusSelector } from "@/components/shared/CampusSelector";
import { useCampus } from "@/components/providers/CampusProvider";
import { useSearchParams } from "next/navigation";


const slides = [
  {
    src: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=1200&h=900&fit=crop&auto=format",
    alt: "Assorted Nigerian campus food",
  },
  {
    src: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1200&h=900&fit=crop&auto=format",
    alt: "Smoky jollof rice with chicken",
  },
  {
    src: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200&h=900&fit=crop&auto=format",
    alt: "Beef shawarma special",
  },
  {
    src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=900&fit=crop&auto=format",
    alt: "Pepper suya sticks",
  },
  {
    src: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&h=900&fit=crop&auto=format",
    alt: "Fried plantain",
  },
  {
    src: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=1200&h=900&fit=crop&auto=format",
    alt: "Tropical smoothie",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { schoolId, campusId } = useCampus();
  const searchParams = useSearchParams();

  // Build campus query string so CTA links carry the active filter
  const campusQuery = `school=${schoolId}&campus=${campusId}`;

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative" style={{ overflowX: "clip" }}>
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left — text content */}
        <div className="lg:col-span-6 space-y-8 animate-fade-in-up">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Your campus. Your vendors. Your meal.
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Get your favorite campus meals on{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">{APP_NAME}</span>,{" "}
              <span className="text-primary">delivered</span> at the speed of hunger.
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Discover the best vendors around school, browse menus and place an order in seconds
              — all in one place.
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link href={`/menus?${campusQuery}`}>
                  Browse menus
                  <ExternalLink className="ml-2 size-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href={`/vendors?${campusQuery}`}>
                  Browse vendors <ExternalLink className="ml-2 size-5" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Browsing for:</span>
              <CampusSelector />
            </div>
          </FadeIn>

          {/* Stats — honest pre-launch values */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-border/60">
              <Stat
                icon={<Zap className="text-primary" />}
                value="60 sec"
                label="To place an order"
              />
              <Stat
                icon={<Timer className="text-primary" />}
                value="~15 min"
                label="Est. prep time"
              />
              <Stat
                icon={<MapPin className="text-primary" />}
                value="10+"
                label="Vendors at launch"
              />
            </div>
          </FadeIn>
        </div>

        {/* Right — image carousel */}
        <div className="lg:col-span-6 relative animate-fade-in-scale">
          <div
            className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-border/60 bg-muted"
            style={{
              boxShadow:
                "0 20px 60px -12px color-mix(in oklch, var(--color-primary) 40%, transparent), 0 4px 20px -4px color-mix(in oklch, var(--color-primary) 20%, transparent)",
            }}
          >
            {mounted &&
              slides.map((slide, i) => (
                <Image
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  className={`object-cover transition-opacity duration-700 ${
                    i === index ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ))}

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-primary" : "w-1.5 bg-background/70"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Feature chip — replaces fake order number */}
         <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl p-4 shadow-[var(--shadow-soft)] w-56 hidden md:block animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-auto rounded-xl overflow-hidden shrink-0">
                <Image
                  src={APP_LOGO_URL}
                  alt={APP_NAME}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Order #BH-24-GJY</p>
                <p className="text-xs text-muted-foreground">{APP_NAME}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-medium">Cooking now · 8 min left</span>
            </div>
          </div>

          {/* Value prop chip — replaces fake "ordered today" count */}
          <FadeIn delay={0.7}>
            <div className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl px-4 py-3 shadow-[var(--shadow-soft)] hidden md:flex items-center gap-2 animate-slide-down">
              <Zap className="size-4 fill-primary text-primary" />
              <span className="text-sm font-semibold">Order in under 60 seconds</span>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-accent grid place-items-center">{icon}</div>
      <div>
        <p className="font-bold text-lg leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}