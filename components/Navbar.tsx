import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between" suppressHydrationWarning>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold text-lg bg-primary">
            C
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">
            Campus<span className="text-primary">Bites</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/vendors" className="hover:text-foreground transition-colors">
            Vendors
          </Link>
          <Link href="/menus" className="hover:text-foreground transition-colors">
            Menu
          </Link>
          <Link href="/#how" className="hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="/#vendor-cta" className="hover:text-foreground transition-colors">
            For vendors
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search />
          </Button>
          <ThemeToggle />
          <Button asChild variant="hero" size="default" className="hidden sm:inline-flex">
            <Link href="/menus"><ShoppingBag /> Order now</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
