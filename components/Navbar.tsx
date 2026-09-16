"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Info,
  PhoneCall,
  LogIn,
  Search,
  Menu,
  ChevronRight,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ThemeToggle"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"
import { useCampus } from "@/components/providers/CampusProvider"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

export function Navbar() {
  const pathname = usePathname()
  const { schoolId, campusId } = useCampus()
  const { data: session, status } = useSession()

  // Campus query string — appended to any link that triggers a server-side filtered page
  const cq = `school=${schoolId}&campus=${campusId}`

  const navLinks = [
    { name: "Vendors", href: `/vendors?${cq}`, base: "/vendors", icon: Store },
    {
      name: "Menu",
      href: `/menus?${cq}`,
      base: "/menus",
      icon: UtensilsCrossed,
    },
    { name: "Track Order", href: "/order", base: "/order", icon: Search },
    {
      name: "Vendor Login",
      href: "/vendor/login",
      base: "/vendor/login",
      icon: LogIn,
    },
    { name: "About Us", href: "/about", base: "/about", icon: Info },
    { name: "Contact Us", href: "/contact", base: "/contact", icon: PhoneCall },
  ]

  return (
    <header className="pointer-events-none sticky top-0 z-50 flex w-full justify-center px-4 py-4 sm:px-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pointer-events-auto flex h-20 w-full max-w-7xl items-center justify-between rounded-3xl border border-white/20 bg-background/60 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-2xl sm:px-6 dark:border-white/10"
      >
        <Link href={`/?${cq}`} className="group flex items-center gap-2.5">
          <Image
            src={APP_LOGO_URL}
            alt={APP_NAME}
            width={48}
            height={48}
            className="h-12 w-auto rounded-xl object-contain transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2"
          />
          <div className="flex flex-col -space-y-1">
            <span className="font-heading text-2xl leading-none font-black tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl">
              Bite<span className="text-primary">Hub</span>
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.base || pathname.startsWith(link.base + "/")
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group relative overflow-hidden rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative z-10 flex items-center gap-2">
                  <link.icon
                    className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground transition-colors group-hover:text-primary"}`}
                  />
                  {link.name}
                </div>
                {!isActive && (
                  <div className="absolute inset-0 translate-y-full bg-primary/5 transition-transform duration-300 group-hover:translate-y-0" />
                )}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 -z-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {status === "loading" ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-sm transition-transform hover:scale-105 active:scale-95">
                  <AvatarImage
                    src={session.user.image || ""}
                    alt={session.user.name || "User"}
                  />
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border-white/10 bg-background/95 p-2 shadow-xl backdrop-blur-md"
              >
                <div className="mb-1 px-2 py-1.5">
                  <p className="truncate text-sm font-semibold">
                    {session.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                >
                  <Link
                    href={
                      session.user.role === "admin" ||
                      session.user.role === "superadmin"
                        ? "/admin"
                        : session.user.role === "vendor"
                          ? "/vendor/dashboard"
                          : session.user.role === "vendor_manager"
                            ? "/vendor-manager"
                            : "/customer/dashboard"
                    }
                  >
                    Go to Dashboard
                  </Link>
                </DropdownMenuItem>
                <ConfirmDialog
                  title="Log out"
                  description="Are you sure you want to log out?"
                  confirmText="Log out"
                  isDestructive={true}
                  onConfirm={() => signOut({ callbackUrl: "/" })}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      Log out
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="hero"
              size="lg"
              className="group rounded-2xl px-3 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30 active:scale-95 sm:px-6"
            >
              <Link
                href={`/customer/login?redirect=/menus?${cq}`}
                className="flex items-center gap-2"
              >
                <ShoppingBag className="size-4 transition-transform group-hover:rotate-12" />
                <span className="hidden sm:inline">Login to order</span>
              </Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl xl:hidden"
              >
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full w-[85vw] max-w-[350px] flex-col overflow-hidden border-l border-white/10 bg-background/90 p-0 shadow-2xl backdrop-blur-2xl data-[side=right]:w-[85vw] data-[side=right]:max-w-[350px]"
            >
              {/* Decorative Background Orbs */}
              <div className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-full overflow-hidden">
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
                <div className="absolute top-1/2 -left-20 h-48 w-48 rounded-full bg-status-confirmed/10 blur-[60px]" />
                <div className="absolute right-0 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/50 px-6 py-6">
                <Image
                  src={APP_LOGO_URL}
                  alt={APP_NAME}
                  width={40}
                  height={40}
                  className="h-10 w-auto rounded-xl object-contain shadow-sm"
                />
                <span className="font-heading text-2xl leading-none font-black tracking-tight text-foreground">
                  Bite<span className="text-primary">Hub</span>
                </span>
              </div>

              {/* ── Scrollable Nav ── */}
              <div
                className="scrollbar-hide flex-1 overflow-y-auto px-4 py-6"
                data-lenis-prevent
              >
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const isActive =
                      pathname === link.base ||
                      pathname.startsWith(link.base + "/")
                    return (
                      <SheetClose asChild key={link.name}>
                        <Link
                          href={link.href}
                          className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition-all active:scale-[0.98] ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`rounded-xl p-2 transition-colors ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-primary group-hover:shadow-sm"
                              }`}
                            >
                              <link.icon className="size-5" />
                            </div>
                            <span className="text-base">{link.name}</span>
                          </div>
                          <ChevronRight
                            className={`size-4 transition-transform duration-300 ${
                              isActive
                                ? "translate-x-1 text-primary-foreground/70"
                                : "text-muted-foreground/30 group-hover:translate-x-1 group-hover:text-primary"
                            }`}
                          />
                        </Link>
                      </SheetClose>
                    )
                  })}
                </div>
              </div>

              {/* Footer CTA & Info */}
              <div className="mt-auto border-t border-border/50 bg-background/50 p-6 backdrop-blur-md">
                <SheetClose asChild>
                  {session?.user ? (
                    <Button
                      asChild
                      variant="hero"
                      size="lg"
                      className="h-14 w-full rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                    >
                      <Link
                        href={
                          session.user.role === "admin" ||
                          session.user.role === "superadmin"
                            ? "/admin"
                            : session.user.role === "vendor"
                              ? "/vendor/dashboard"
                              : session.user.role === "vendor_manager"
                                ? "/vendor-manager"
                                : "/customer/dashboard"
                        }
                        className="flex items-center justify-center gap-2"
                      >
                        Go to Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="hero"
                      size="lg"
                      className="h-14 w-full rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                    >
                      <Link
                        href={`/customer/login?redirect=/menus?${cq}`}
                        className="flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="size-5" />
                        Login to order
                      </Link>
                    </Button>
                  )}
                </SheetClose>
                <p className="mt-4 text-center text-xs font-medium text-muted-foreground opacity-80">
                  Empowering campus food businesses.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  )
}
