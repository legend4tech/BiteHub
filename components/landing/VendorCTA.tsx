import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

export function VendorCTA() {
  const perks = [
    "Reach thousands of hungry students every day",
    "Manage your menu and orders from one dashboard",
    "Built-in order management — zero commission to start",
  ];
  return (
    <section id="vendor-cta" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn delay={0.1}>
          <div
            className="relative overflow-hidden rounded-[2rem] p-10 md:p-16 bg-primary text-primary-foreground"
          >
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <FadeIn delay={0.2}>
                  <p className="text-sm font-semibold uppercase tracking-wider opacity-80">For vendors</p>
                </FadeIn>
                <FadeIn delay={0.3}>
                  <h2 className="font-heading text-3xl md:text-5xl font-bold mt-2 leading-tight">
                    Run a kitchen on campus? List it on CampusBites.
                  </h2>
                </FadeIn>
                <FadeIn delay={0.4}>
                  <p className="mt-4 text-primary-foreground/90 max-w-lg">
                    Get more orders, less stress. Sign up today and start receiving orders within 24 hours.
                  </p>
                </FadeIn>
                <FadeIn delay={0.5}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button size="xl" variant="default" className="bg-background text-foreground hover:bg-background/90">
                      Become a vendor <ArrowRight />
                    </Button>
                    <Button size="xl" variant="ghost" className="text-primary-foreground hover:bg-white/10">
                      Talk to us
                    </Button>
                  </div>
                </FadeIn>
              </div>
              <ul className="space-y-4">
                {perks.map((p, i) => (
                  <FadeIn key={p} delay={0.3 + (i * 0.1)} direction="left">
                    <li className="flex items-start gap-3 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
                      <span className="h-7 w-7 rounded-full bg-background text-primary grid place-items-center shrink-0">
                        <Check className="size-4" />
                      </span>
                      <span className="font-medium">{p}</span>
                    </li>
                  </FadeIn>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
