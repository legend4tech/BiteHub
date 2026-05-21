"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, UtensilsCrossed, Info, PhoneCall, LogIn, Search, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";
import { useCampus } from "@/components/providers/CampusProvider";

export function Navbar() {
  const pathname = usePathname();
  const { schoolId, campusId } = useCampus();

  // Campus query string — appended to any link that triggers a server-side filtered page
  const cq = `school=${schoolId}&campus=${campusId}`;

  const navLinks = [
    { name: "Vendors", href: `/vendors?${cq}`, base: "/vendors", icon: Store },
    { name: "Menu", href: `/menus?${cq}`, base: "/menus", icon: UtensilsCrossed },
    { name: "Track Order", href: "/order", base: "/order", icon: Search },
    { name: "Vendor Login", href: "/vendor/login", base: "/vendor/login", icon: LogIn },
    { name: "How it works", href: "/#how", base: "/#how", icon: Info },
    { name: "Contact Us", href: "/contact", base: "/contact", icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 py-4 flex justify-center pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pointer-events-auto w-full max-w-7xl rounded-3xl border border-white/20 dark:border-white/10 bg-background/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-4 sm:px-6 h-20 flex items-center justify-between"
      >
        <Link href={`/?${cq}`} className="flex items-center gap-2.5 group">
          <img 
            src={APP_LOGO_URL} 
            alt={APP_NAME} 
            className="h-12 w-auto object-contain rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2" 
          />
          <div className="flex flex-col -space-y-1">
            <span className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground transition-colors group-hover:text-primary leading-none">
              Bite<span className="text-primary">Hub</span>
            </span>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.base || pathname.startsWith(link.base + "/");
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group overflow-hidden ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <link.icon className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                  {link.name}
                </div>
                {!isActive && (
                  <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                )}
                {isActive && (
                  <motion.div 
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary/10 rounded-xl -z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button asChild variant="hero" size="lg" className="rounded-2xl px-3 sm:px-6 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 group font-bold">
            <Link href={`/menus?${cq}`} className="flex items-center gap-2">
              <ShoppingBag className="size-4 group-hover:rotate-12 transition-transform" /> 
              <span className="hidden sm:inline">Order now</span>
            </Link>
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden rounded-xl">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background/95 backdrop-blur-xl border-border/60">
              <div className="flex flex-col gap-6 mt-12">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.base || pathname.startsWith(link.base + "/");
                    return (
                      <SheetClose asChild key={link.name}>
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                          }`}
                        >
                          <link.icon className={`size-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          {link.name}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  );
}
