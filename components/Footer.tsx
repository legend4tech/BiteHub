import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";


export function Footer() {
  return (
    <footer className="relative border-t border-border bg-card/40 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img 
                src={APP_LOGO_URL} 
                alt={APP_NAME} 
                className="h-11 w-auto object-contain rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2" 
              />
              <div className="flex flex-col -space-y-1">
                <span className="font-heading font-black text-2xl tracking-tight text-foreground transition-colors group-hover:text-primary leading-none">
                  Bite<span className="text-primary">Hub</span>
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Empowering campus vendors and students through seamless food discovery and ordering. Built for the modern Nigerian campus life.
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
            <ul className="space-y-3 mt-4">
              <FooterLink href="/vendors">Browse Vendors</FooterLink>
              <FooterLink href="/menus">Our Menus</FooterLink>
              <FooterLink href="/#how">How it Works</FooterLink>
              {/* <FooterLink href="/#pricing">Pricing</FooterLink> */}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <FooterHeading>Company</FooterHeading>
            <ul className="space-y-3 mt-4">
              {/* <FooterLink href="/about">About Us</FooterLink> */}
              {/* <FooterLink href="/careers">Join the Team</FooterLink> */}
              <FooterLink href="/contact">Contact Support</FooterLink>
              {/* <FooterLink href="/press">Media Kit</FooterLink> */}
            </ul>
          </div>

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <FooterHeading>Get in Touch</FooterHeading>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground group hover:text-foreground transition-colors cursor-pointer">
                <div className="h-9 w-9 rounded-xl bg-accent grid place-items-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Mail className="size-4" />
                </div>
                <span>contact@bitehubapp.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground group hover:text-foreground transition-colors cursor-pointer">
                <div className="h-9 w-9 rounded-xl bg-accent grid place-items-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <MapPin className="size-4" />
                </div>
                <span>Available across campuses nationwide</span>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-xs font-bold text-foreground mb-2">Subscribe to our updates</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-accent/50 border border-border px-4 py-2 rounded-xl text-xs flex-1 focus:outline-none focus:border-primary transition-colors"
                />
                <button className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-medium">
          <p>© {new Date().getFullYear()} {APP_NAME}. Crafted with ❤️ for students everywhere.</p>
          <div className="flex items-center gap-8">
            {/* <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link> */}
            {/* <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link> */}
            {/* <Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">{children}</h4>;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, alt, src }: { href: string; alt: string; src?: string }) {
  return (
    <a 
      href={href} 
      className="h-9 w-9 rounded-xl bg-accent grid place-items-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {src ? (
        <img src={src} alt={alt} className="size-5 object-contain" />
      ) : (
        <div className="size-4 bg-muted-foreground/30 rounded-sm" title={alt} />
      )}
    </a>
  );
}
