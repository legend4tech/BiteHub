"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Store,
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShieldCheck,
  Home,
  Settings,
  MapPin,
  ShoppingCart,
} from "lucide-react"
import { cn } from "@/lib/utils"
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

interface VendorManagerSidebarProps {
  role?: string
}

// ─── Nav Items ────────────────────────────────────────────────────────────────

const navItems: {
  section: string
  label: string
  icon: React.ElementType
}[] = [
  { section: "", label: "Overview", icon: LayoutDashboard },
  { section: "vendors", label: "Vendors", icon: Store },
  { section: "orders", label: "Orders", icon: ShoppingCart },
  { section: "feedback", label: "Feedback", icon: Star },
  { section: "settings", label: "Settings", icon: Settings },
]

// ─── Nav Links ────────────────────────────────────────────────────────────────

function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {navItems.map((item) => {
          const href =
            item.section === ""
              ? `/vendor-manager`
              : `/vendor-manager/${item.section}`
          // Strict active match for overview so it doesn't stay highlighted on other pages
          const active =
            item.section === ""
              ? pathname === "/vendor-manager"
              : pathname.startsWith(href)

          return (
            <Tooltip key={item.section}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
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

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({
  collapsed,
  setCollapsed,
  onNavigate,
}: {
  collapsed: boolean
  setCollapsed?: (v: boolean) => void
  onNavigate?: () => void
}) {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Vendor Manager"

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand + Collapse toggle ── */}
      <div className="relative flex min-h-[76px] shrink-0 items-center justify-center border-b border-border/50 px-4 py-5">
        {!collapsed && (
          <Link href="/" className="group flex items-center gap-2.5">
            <img
              src={APP_LOGO_URL}
              alt={APP_NAME}
              className="h-10 w-10 shrink-0 rounded-lg object-contain transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2"
            />
            <div className="flex flex-col -space-y-0.5">
              <span className="font-heading text-xl leading-none font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                Bite<span className="text-primary">Hub</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Vendor Manager
              </span>
            </div>
          </Link>
        )}

        {collapsed && (
          <Link href="/" className="group flex items-center justify-center">
            <img
              src={APP_LOGO_URL}
              alt={APP_NAME}
              className="h-9 w-9 rounded-lg object-contain transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2"
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

      {/* ── Scrollable middle: role badge + nav ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* ── Role badge ── */}
        {!collapsed && (
          <div className="mx-3 mt-4 flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10">
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">
                {userName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Management access
              </p>
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <NavLinks collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/* ── Bottom bar (always visible) ── */}
      <div
        className={cn(
          "shrink-0 space-y-2 border-t border-border/50 pt-4 pb-5",
          collapsed ? "px-2" : "px-3"
        )}
      >
        <TooltipProvider delayDuration={0}>
          {/* Back to site */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground",
                  collapsed ? "justify-center p-3" : "px-4 py-3"
                )}
              >
                <Home className="size-4.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                {!collapsed && "Back to site"}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                Back to site
              </TooltipContent>
            )}
          </Tooltip>

          {/* Theme toggle row */}
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

          {/* Logout */}
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
                  description="This will log you out of the secure admin dashboard. You will need to re-authenticate to access it again."
                  confirmText="Yes, log out"
                  isDestructive
                  onConfirm={() => {
                    toast.success("Successfully logged out")
                    signOut({ callbackUrl: "/vendor-manager/login" })
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

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

export function VendorManagerSidebar({ role }: VendorManagerSidebarProps) {
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

// ─── Mobile Trigger ────────────────────────────────────────────────────────────

export function VendorManagerMobileTrigger({
  role,
}: VendorManagerSidebarProps) {
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
          <SheetTitle>Admin Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
