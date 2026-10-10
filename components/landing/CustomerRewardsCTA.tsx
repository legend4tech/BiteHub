"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Gift, Trophy, Sparkles, ArrowRight } from "lucide-react"
import { APP_NAME } from "@/lib/constants"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function CustomerRewardsCTA() {
  const sectionRef = useRef<HTMLElement>(null)

  const perks = [
    {
      icon: <Trophy className="h-5 w-5 text-primary" />,
      text: "Hit order targets to automatically unlock cash vouchers straight to your wallet.",
    },
    {
      icon: <Gift className="h-5 w-5 text-primary" />,
      text: "Share your unique referral code with friends and score instant rewards when they join and order.",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      text: "Catch exclusive flash-sale promo codes and surprise discounts delivered right to your inbox.",
    },
  ]

  useGSAP(
    () => {
      // CTA Container Scale and Parallax
      gsap.fromTo(
        ".customer-cta-container",
        { opacity: 0, scale: 0.95, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".customer-cta-container",
            start: "top 85%",
          },
        }
      )

      // Text Stagger
      gsap.fromTo(
        ".customer-cta-text > *",
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".customer-cta-container",
            start: "top 75%",
          },
        }
      )

      // Perks Stagger
      gsap.fromTo(
        ".customer-cta-perk",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".customer-cta-container",
            start: "top 70%",
          },
        }
      )

      // Mascot floating animation
      gsap.fromTo(
        ".customer-cta-mascot",
        { y: 15, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: ".customer-cta-container",
            start: "top 70%",
          },
        }
      )

      gsap.to(".customer-cta-mascot-img", {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      })
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="customer-rewards-cta" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="customer-cta-container relative overflow-hidden rounded-[3rem] border border-orange-100 bg-orange-50 p-10 shadow-[0_20px_60px_-15px_rgba(234,88,12,0.1)] md:p-16 dark:border-orange-900/50 dark:bg-orange-950/30">
          {/* Decorative elements */}
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />

          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div className="customer-cta-text z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-primary uppercase">
                BiteHub Rewards
              </p>
              <h2 className="mt-6 font-heading text-4xl leading-[1.1] font-extrabold tracking-tight text-foreground md:text-5xl">
                Level up your cravings. <br />
                <span className="text-primary">
                  Earn real rewards just for eating.
                </span>
              </h2>
              <p className="mt-6 max-w-lg text-lg font-medium text-muted-foreground">
                Why just order food when you can unlock achievements? {APP_NAME}{" "}
                turns your daily meals into cash vouchers and exclusive perks.
                Eat. Earn. Repeat.
              </p>

              <div className="mt-8 space-y-4">
                {perks.map((perk, i) => (
                  <div
                    key={i}
                    className="customer-cta-perk flex items-center gap-4 rounded-2xl border border-border/50 bg-background/60 p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {perk.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground md:text-base">
                      {perk.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 rounded-full px-8 text-base font-bold shadow-xl transition-transform hover:scale-105"
                  asChild
                >
                  <Link href="/customer/signup">
                    Start Ordering Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-border bg-white px-8 text-base font-bold shadow-sm transition-colors hover:bg-orange-50 dark:bg-background dark:hover:bg-orange-950/50"
                  asChild
                >
                  <Link href="/menus">Browse Menus</Link>
                </Button>
              </div>
            </div>

            <div className="customer-cta-mascot relative z-10 flex items-center justify-center lg:justify-end">
              <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                {/* Glow behind mascot */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-[60px]" />
                <Image
                  src="/avatars/mascot.png"
                  alt="BiteHub Mascot"
                  fill
                  className="customer-cta-mascot-img object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
