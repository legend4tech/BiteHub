"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { Mail, MapPin, Heart } from "lucide-react"
import { APP_NAME, APP_LOGO_URL, CONTACT_EMAIL } from "@/lib/constants"
import { useCampus } from "@/components/providers/CampusProvider"

const VENDOR_FORM_URL = "https://forms.gle/KEwY8nthHHfjLL1n6"

export function Footer() {
  const { schoolId, campusId } = useCampus()
  const cq = `school=${schoolId}&campus=${campusId}`
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to subscribe")

      if (data.alreadySubscribed) {
        toast.info("You are already subscribed to our updates.", {
          action: {
            label: "Unsubscribe",
            onClick: () => window.location.assign(data.unsubscribeUrl),
          },
          duration: 5000,
        })
      } else {
        toast.success("Subscribed successfully!")
      }

      setEmail("")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="relative overflow-hidden border-t border-border bg-card/40">
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 right-0 -mt-64 -mr-64 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-48 -ml-48 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-7 lg:gap-8">
          {/* Brand section */}
          <div className="space-y-6 lg:col-span-2">
            <Link href={`/?${cq}`} className="group flex items-center gap-2.5">
              <Image
                src={APP_LOGO_URL}
                alt={APP_NAME}
                width={44}
                height={44}
                className="h-11 w-auto rounded-xl object-contain transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2"
              />
              <div className="flex flex-col -space-y-1">
                <span className="font-heading text-2xl leading-none font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                  Bite<span className="text-primary">Hub</span>
                </span>
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Empowering campus vendors and students through seamless food
              discovery and ordering. Built for the modern Nigerian campus life.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink href="https://x.com" alt="X" src="/x-icon.png" />
              <SocialLink
                href="https://tiktok.com"
                alt="TikTok"
                src="/tiktok-icon.png"
              />
              <SocialLink
                href="https://linkedin.com"
                alt="LinkedIn"
                src="/linkedin-icon.png"
              />
            </div>
          </div>

          {/* Links sections */}
          <div className="lg:col-span-1">
            <FooterHeading>Product</FooterHeading>
            <ul className="mt-4 space-y-3">
              <FooterLink href={`/vendors?${cq}`}>Browse Vendors</FooterLink>
              <FooterLink href={`/menus?${cq}`}>Our Menus</FooterLink>
              <FooterLink href="/#how">How it Works</FooterLink>
              {/* <FooterLink href="/#pricing">Pricing</FooterLink> */}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <FooterHeading>Company</FooterHeading>
            <ul className="mt-4 space-y-3">
              <FooterLink href="/about">About Us</FooterLink>
              {/* <FooterLink href="/careers">Join the Team</FooterLink> */}
              <FooterLink href="/contact">Contact Support</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Use</FooterLink>
              {/* <FooterLink href="/press">Media Kit</FooterLink> */}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <FooterHeading>For Vendors</FooterHeading>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={VENDOR_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Register as Vendor
                </a>
              </li>
              <FooterLink href="/vendor/login">Vendor Login</FooterLink>
              <FooterLink href="/#vendor-cta">Why join us?</FooterLink>
            </ul>
          </div>

          {/* Contact info */}
          <div className="space-y-6 lg:col-span-2">
            <FooterHeading>Get in Touch</FooterHeading>
            <div className="space-y-4">
              <div className="group flex cursor-pointer items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Mail className="size-4" />
                </div>
                <span>{CONTACT_EMAIL}</span>
              </div>
              <div className="group flex cursor-pointer items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <MapPin className="size-4" />
                </div>
                <span>Available across campuses nationwide</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="mb-3 font-heading text-sm font-bold tracking-tight text-foreground">
                Subscribe to our updates
              </p>
              <form
                onSubmit={handleSubscribe}
                className="flex w-full max-w-sm gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  placeholder="Enter your email"
                  className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 text-xs font-medium text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Crafted with{" "}
            <Heart className="mx-1 inline size-3.5 fill-destructive text-destructive" />{" "}
            for students everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-bold tracking-widest text-foreground uppercase">
      {children}
    </h4>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        {children}
      </Link>
    </li>
  )
}

function SocialLink({
  href,
  alt,
  src,
}: {
  href: string
  alt: string
  src?: string
}) {
  return (
    <a
      href={href}
      className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-accent text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:text-primary"
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            width={40}
            height={40}
            className="size-full object-cover"
          />
        </>
      ) : (
        <div className="size-5 rounded-sm bg-muted-foreground/30" title={alt} />
      )}
    </a>
  )
}
