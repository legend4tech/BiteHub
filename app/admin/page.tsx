"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Button } from "@/components/ui/button";
import { vendors as staticVendors } from "@/lib/data";
import { LS_VENDORS, ADMIN_PHONE } from "@/lib/constants";
import type { Vendor } from "@/lib/types";
import { Plus, X, Power, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function loadVendors(): Vendor[] {
  try {
    const raw = localStorage.getItem(LS_VENDORS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveVendors(list: Vendor[]) {
  localStorage.setItem(LS_VENDORS, JSON.stringify(list));
}

export default function AdminPage() {
  const { session, isAuthenticated, mounted } = useVendorAuth();
  const router = useRouter();
  const [extraVendors, setExtraVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "", campus: "COOU Uli", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    // Authentication redirect removed for open access
    setExtraVendors(loadVendors());
  }, [mounted, isAuthenticated, session]);

  const allVendors = [...staticVendors, ...extraVendors];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError("Name and phone are required."); return; }
    if (allVendors.find((v) => v.phone === form.phone)) { setError("A vendor with this phone already exists."); return; }
    const newVendor: Vendor = {
      id: `vendor-${Date.now()}`,
      name: form.name.trim(),
      initials: form.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
      phone: form.phone.trim(),
      campus: form.campus,
      location: form.location.trim() || "TBD",
      slug: form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: "Fresh campus food, served daily.",
      category: "general",
      tags: [],
      whatsappNumber: form.phone.trim(),
      school: "COOU",
      tagline: "Fresh campus food, served daily.",
      isActive: true,
      password: form.password || "vendor123",
    };
    const updated = [...extraVendors, newVendor];
    saveVendors(updated);
    setExtraVendors(updated);
    setForm({ name: "", phone: "", location: "", campus: "COOU Uli", password: "" });
    setShowForm(false);
    setError("");
  };

  const toggleActive = (id: string) => {
    const target = extraVendors.find((v) => v.id === id);
    if (!target) return;
    const updated = extraVendors.map((v) => v.id === id ? { ...v, isActive: !v.isActive } : v);
    saveVendors(updated);
    setExtraVendors(updated);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="size-5" /></Link>
        <div>
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Admin Portal</p>
          <h1 className="font-heading text-2xl font-bold">Vendor Management</h1>
        </div>
        <div className="ml-auto">
          <Button variant="hero" onClick={() => setShowForm(true)}><Plus className="size-4" /> Add Vendor</Button>
        </div>
      </div>

      {/* Create vendor form */}
      {showForm && (
        <div className="rounded-3xl bg-card border border-border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold text-lg">New Vendor</h2>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setError(""); }}><X /></Button>
          </div>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
            {error && <p className="sm:col-span-2 text-xs text-destructive bg-destructive/10 rounded-xl px-4 py-2">{error}</p>}
            {[
              { label: "Vendor name *", key: "name", placeholder: "e.g. Mama Nkechi's Kitchen" },
              { label: "Phone (WhatsApp) *", key: "phone", placeholder: "2348012345678" },
              { label: "Location", key: "location", placeholder: "e.g. Block C" },
              { label: "Campus", key: "campus", placeholder: "COOU Uli" },
              { label: "Password (default: vendor123)", key: "password", placeholder: "vendor123" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="hero" className="flex-1">Create vendor</Button>
            </div>
          </form>
        </div>
      )}

      {/* Vendors table */}
      <div className="rounded-3xl bg-card border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-semibold">{allVendors.length} vendors</p>
        </div>
        <div className="divide-y divide-border">
          {allVendors.map((vendor) => (
            <div key={vendor.id} className="flex items-center gap-4 px-6 py-4">
              <div className="h-10 w-10 rounded-xl grid place-items-center text-primary-foreground font-bold text-sm shrink-0 bg-primary shadow-lg shadow-primary/20">{vendor.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{vendor.name}</p>
                <p className="text-xs text-muted-foreground">{vendor.phone} · {vendor.location}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${vendor.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                {vendor.isActive ? "Active" : "Disabled"}
              </span>
              {extraVendors.find((v) => v.id === vendor.id) && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(vendor.id)} title={vendor.isActive ? "Disable" : "Enable"}>
                  <Power className={`size-4 ${vendor.isActive ? "text-destructive" : "text-green-600"}`} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
