"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVendorAuth } from "@/hooks/useVendorAuth";

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/menu",      label: "Menu",      icon: UtensilsCrossed },
  { href: "/vendor/orders",    label: "Orders",    icon: ClipboardList },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const { session, logout } = useVendorAuth();

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-border bg-card min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg grid place-items-center text-primary-foreground font-bold text-sm bg-primary shadow-lg shadow-primary/20">C</div>
          <span className="font-heading font-bold text-base">Campus<span className="text-primary">Bites</span></span>
        </Link>
        <p className="text-xs text-muted-foreground mt-3">Vendor Portal</p>
        {session && (
          <p className="text-sm font-semibold mt-1 truncate">{session.vendorName}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-white shadow-[0_4px_12px_-2px_rgba(255,107,0,0.4)]"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-border pt-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
