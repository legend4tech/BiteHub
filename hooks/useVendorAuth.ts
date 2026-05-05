"use client";

import { useState, useEffect, useCallback } from "react";
import type { VendorSession } from "@/lib/types";
import { vendors } from "@/lib/data";
import {
  LS_VENDOR_SESSION,
  LS_VENDORS,
  VENDOR_DEFAULT_PASSWORD,
  ADMIN_PHONE,
  ADMIN_PASSWORD,
} from "@/lib/constants";

const AUTH_EVENT = "cb:vendor:auth:update";

export function useVendorAuth() {
  const [session, setSession] = useState<VendorSession | null>(null);
  const [mounted, setMounted] = useState(false);

  const syncSession = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_VENDOR_SESSION);
      setSession(raw ? JSON.parse(raw) : null);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    syncSession();
    window.addEventListener(AUTH_EVENT, syncSession);
    return () => window.removeEventListener(AUTH_EVENT, syncSession);
  }, [syncSession]);

  const login = useCallback(
    (phone: string, password: string): { ok: boolean; error?: string } => {
      // Admin check
      if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
        const s: VendorSession = {
          vendorId: "admin",
          vendorName: "Admin",
          vendorPhone: "admin",
        };
        localStorage.setItem(LS_VENDOR_SESSION, JSON.stringify(s));
        setSession(s);
        window.dispatchEvent(new Event(AUTH_EVENT));
        return { ok: true };
      }

      // Merge static vendors with any admin-created vendors in localStorage
      const extra: typeof vendors = (() => {
        try {
          const raw = localStorage.getItem(LS_VENDORS);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();

      const allVendors = [...vendors, ...extra];
      const vendor = allVendors.find((v) => v.phone === phone);

      if (!vendor) return { ok: false, error: "No vendor found with that phone number." };

      const expectedPassword = vendor.password ?? VENDOR_DEFAULT_PASSWORD;
      if (password !== expectedPassword)
        return { ok: false, error: "Incorrect password." };

      if (!vendor.isActive)
        return { ok: false, error: "Your account has been disabled. Contact admin." };

      const s: VendorSession = {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorPhone: vendor.phone,
      };
      localStorage.setItem(LS_VENDOR_SESSION, JSON.stringify(s));
      setSession(s);
      window.dispatchEvent(new Event(AUTH_EVENT));
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(LS_VENDOR_SESSION);
    setSession(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  return {
    session,
    isAuthenticated: mounted && session !== null,
    isAdmin: session?.vendorId === "admin",
    mounted,
    login,
    logout,
  };
}
