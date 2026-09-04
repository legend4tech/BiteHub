"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Star,
  Settings,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants"

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/vendor/orders", label: "Orders", icon: ClipboardList },
  { href: "/vendor/feedback", label: "Feedback", icon: Star },
  { href: "/vendor/delivery-settings", label: "Delivery Fees", icon: MapPin },
  { href: "/vendor/settings", label: "Settings", icon: Settings },
]

function NavLinks({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0" : "px-4",
                    active
                      ? "bg-primary text-white shadow-[0_4px_12px_-2px_rgba(255,107,0,0.3)]"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-5 shrink-0 transition-transform group-hover:scale-110",
                      active
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                  {active && !collapsed && (
                    <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </nav>
    </TooltipProvider>
  )
}

function SidebarContent({
  collapsed,
  setCollapsed,
  onNavigate,
}: {
  collapsed: boolean
  setCollapsed?: (v: boolean) => void
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex h-full flex-col">
      {/* Logo + collapse toggle */}
      <div className="relative flex min-h-[76px] items-center justify-center border-b border-border/50 px-4 py-5">
        {!collapsed && (
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            onClick={onNavigate}
          >
            <Image
              src={APP_LOGO_URL}
              alt={APP_NAME}
              width={40}
              height={40}
              className="h-10 w-auto rounded-lg object-contain transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2"
            />
            <div className="flex flex-col -space-y-1">
              <span className="font-heading text-2xl leading-none font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                Bite<span className="text-primary">Hub</span>
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link
            href="/"
            className="group flex items-center justify-center"
            onClick={onNavigate}
          >
            <Image
              src={APP_LOGO_URL}
              alt={APP_NAME}
              width={36}
              height={36}
              className="h-9 w-auto rounded-lg object-contain transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2"
            />
          </Link>
        )}
        {setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent",
              collapsed ? "ml-1.5" : "absolute right-3"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronLeft className="size-3.5" />
            )}
          </button>
        )}
      </div>

      {/* User badge */}
      {!collapsed && session?.user && (
        <div className="mx-3 mt-4 flex items-center gap-2.5 rounded-xl border border-border/30 bg-accent/40 px-3 py-2.5">
          <div className="to-primary/70/80 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/80 text-xs font-bold text-white">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "Vendor"}
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            ) : (
              (session.user.name?.charAt(0).toUpperCase() ?? "V")
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">
              {session.user.name}
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-completed" />
              <p className="text-[10px] text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav — flex-1 here ensures bottom bar is always pinned to the bottom */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavLinks
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      {/* Bottom */}
      <div
        className={cn(
          "space-y-2 border-t border-border/50 pt-4 pb-5",
          collapsed ? "px-2" : "px-3"
        )}
      >
        <TooltipProvider delayDuration={0}>
          <div
            className={cn(
              "flex items-center rounded-xl bg-accent/30",
              collapsed ? "justify-center p-2" : "justify-between px-4 py-2.5"
            )}
          >
            {!collapsed && (
              <span className="text-xs font-medium text-muted-foreground">
                Theme
              </span>
            )}
            <ThemeToggle />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ConfirmDialog
                  trigger={
                    <button
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10",
                        collapsed ? "justify-center p-3" : "px-4 py-3"
                      )}
                    >
                      <LogOut className="size-4.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      {!collapsed && "Log out"}
                    </button>
                  }
                  title="Are you absolutely sure?"
                  description="This will log you out of your vendor dashboard. You will need to sign in again to manage your store."
                  confirmText="Yes, log out"
                  isDestructive
                  onConfirm={() => {
                    toast.success("Successfully logged out")
                    signOut({ callbackUrl: "/vendor/login" })
                  }}
                />
              </span>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                Log out
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

// ── Desktop Sidebar ──────────────────────────────────────────────────────────
export function VendorSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 md:flex",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  )
}

// ── Mobile Trigger (hamburger) ────────────────────────────────────────────────
export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent md:hidden">
          <Menu className="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] border-r border-border bg-card p-0 data-[side=left]:w-[280px]"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
