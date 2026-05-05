import { Search, Utensils, BellRing, type LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

const steps: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Search,
    title: "Browse vendors",
    desc: "Find kitchens near your hostel and explore today's menus.",
  },
  {
    icon: Utensils,
    title: "Place your order",
    desc: "Pick your meals, checkout in seconds and get a unique order ID.",
  },
  {
    icon: BellRing,
    title: "Track in real time",
    desc: "Watch your order move from kitchen to your door, right inside the app.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn delay={0.1}>
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              How it works
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold mt-2">
              From craving to bite in 3 steps
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <FadeIn key={s.title} delay={0.1 * (i + 1)}>
              <div
                className="relative rounded-3xl bg-card border border-border p-8 hover:border-primary hover:-translate-y-1 transition-all duration-200 hover:shadow-[0_8px_32px_-6px_rgba(255,107,0,0.25)] h-full"
              >
                <span className="absolute top-6 right-6 font-heading text-5xl font-bold text-accent-foreground/15">
                  0{i + 1}
                </span>
                <div className="h-12 w-12 rounded-2xl bg-accent grid place-items-center text-primary mb-6">
                  <s.icon />
                </div>
                <h3 className="font-heading font-bold text-xl">{s.title}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
