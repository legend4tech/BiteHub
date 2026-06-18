import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"
import { FadeIn } from "@/components/FadeIn"
import { APP_NAME } from "@/lib/constants"

const VENDOR_FORM_URL = "https://forms.gle/KEwY8nthHHfjLL1n6"

export function VendorCTA() {
  const perks = [
    "Reach thousands of hungry students every day",
    "Manage your menu and orders from one dashboard",
    "Built-in order management — zero commission to start",
  ]
  return (
    <section id="vendor-cta" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn delay={0.1}>
          <div className="relative overflow-hidden rounded-[2rem] bg-primary p-10 text-primary-foreground md:p-16">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
            <div className="relative grid items-center gap-10 md:grid-cols-2">
              <div>
                <FadeIn delay={0.2}>
                  <p className="text-sm font-semibold tracking-wider uppercase opacity-80">
                    For vendors
                  </p>
                </FadeIn>
                <FadeIn delay={0.3}>
                  <h2 className="mt-2 font-heading text-3xl leading-tight font-bold md:text-5xl">
                    Selling food, snacks, or drinks on campus? List on{" "}
                    {APP_NAME}.
                  </h2>
                </FadeIn>
                <FadeIn delay={0.4}>
                  <p className="mt-4 max-w-lg text-primary-foreground/90">
                    Get more orders, less stress. Sign up today and start
                    receiving orders within 24 hours.
                  </p>
                </FadeIn>
                <FadeIn delay={0.5}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button
                      size="xl"
                      variant="default"
                      className="bg-background text-foreground hover:bg-background/90"
                      asChild
                    >
                      <Link
                        href={VENDOR_FORM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Become a vendor <ArrowRight />
                      </Link>
                    </Button>
                    <Button
                      size="xl"
                      variant="ghost"
                      className="text-primary-foreground hover:bg-white/10"
                      asChild
                    >
                      <Link
                        href={VENDOR_FORM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Apply now
                      </Link>
                    </Button>
                  </div>
                </FadeIn>
              </div>
              <ul className="space-y-4">
                {perks.map((p, i) => (
                  <FadeIn key={p} delay={0.3 + i * 0.1} direction="left">
                    <li className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-background text-primary">
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
  )
}
