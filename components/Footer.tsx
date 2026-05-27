import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin } from "lucide-react"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"

const VENDOR_FORM_URL = "https://forms.gle/KEwY8nthHHfjLL1n6"

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card/40">
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 right-0 -mt-64 -mr-64 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 -mb-48 -ml-48 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-7 lg:gap-8">
          {/* Brand section */}
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="group flex items-center gap-2.5">
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
              <SocialLink href="#" alt="Twitter" />
              <SocialLink href="#" alt="Instagram" />
              <SocialLink href="#" alt="Facebook" />
              <SocialLink href="#" alt="Github" />
            </div>
          </div>

          {/* Links sections */}
          <div className="lg:col-span-1">
            <FooterHeading>Product</FooterHeading>
            <ul className="mt-4 space-y-3">
              <FooterLink href="/vendors">Browse Vendors</FooterLink>
              <FooterLink href="/menus">Our Menus</FooterLink>
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
                <span>contact@bitehubapp.com</span>
              </div>
              <div className="group flex cursor-pointer items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <MapPin className="size-4" />
                </div>
                <span>Available across campuses nationwide</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="mb-2 text-xs font-bold text-foreground">
                Subscribe to our updates
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 rounded-xl border border-border bg-accent/50 px-4 py-2 text-xs transition-colors focus:border-primary focus:outline-none"
                />
                <button className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 text-xs font-medium text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Crafted with ❤️ for
            students everywhere.
          </p>
          <div className="flex items-center gap-8">
            {/* <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link> */}
            {/* <Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link> */}
          </div>
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
      className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-accent text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:bg-primary/10 hover:text-primary"
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            width={20}
            height={20}
            className="size-5 object-contain"
          />
        </>
      ) : (
        <div className="size-4 rounded-sm bg-muted-foreground/30" title={alt} />
      )}
    </a>
  )
}
