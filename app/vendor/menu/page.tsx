"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { MenuItemRow } from "@/components/vendor/MenuItemRow";
import { MenuItemForm } from "@/components/vendor/MenuItemForm";
import { Button } from "@/components/ui/button";
import { menuItems as staticItems } from "@/lib/data";
import type { MenuItem } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";

const LS_MENU_KEY = "cb_menu_overrides";

function loadItems(vendorId: string): MenuItem[] {
  try {
    const raw = localStorage.getItem(LS_MENU_KEY);
    const overrides: MenuItem[] = raw ? JSON.parse(raw) : [];
    const overrideIds = new Set(overrides.map((i) => i.id));
    const base = staticItems.filter((i) => i.vendorId === vendorId && !overrideIds.has(i.id));
    return [...base, ...overrides.filter((i) => i.vendorId === vendorId)];
  } catch {
    return staticItems.filter((i) => i.vendorId === vendorId);
  }
}

function saveOverride(item: MenuItem) {
  try {
    const raw = localStorage.getItem(LS_MENU_KEY);
    const overrides: MenuItem[] = raw ? JSON.parse(raw) : [];
    const idx = overrides.findIndex((i) => i.id === item.id);
    if (idx >= 0) overrides[idx] = item; else overrides.push(item);
    localStorage.setItem(LS_MENU_KEY, JSON.stringify(overrides));
  } catch { /* noop */ }
}

function removeOverride(id: string) {
  try {
    const raw = localStorage.getItem(LS_MENU_KEY);
    const overrides: MenuItem[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LS_MENU_KEY, JSON.stringify(overrides.filter((i) => i.id !== id)));
  } catch { /* noop */ }
}

export default function VendorMenuPage() {
  const { session } = useVendorAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const load = () => {
    if (session) setItems(loadItems(session.vendorId));
  };

  useEffect(() => { load(); }, [session]);

  const handleSave = (data: Omit<MenuItem, "id" | "vendorId" | "vendorName">) => {
    if (!session) return;
    const item: MenuItem = {
      ...data,
      id: editing?.id ?? `item-${Date.now()}`,
      vendorId: session.vendorId,
      vendorName: session.vendorName,
    };
    saveOverride(item);
    load();
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    removeOverride(id);
    load();
  };

  const handleToggle = (id: string, available: boolean) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    saveOverride({ ...item, isAvailable: available });
    load();
  };

  const handleEdit = (item: MenuItem) => {
    setEditing(item);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} items</p>
        </div>
        <Button variant="hero" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="size-4" /> Add item
        </Button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="rounded-3xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg">{editing ? "Edit item" : "Add new item"}</h2>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditing(null); }}><X /></Button>
          </div>
          <MenuItemForm initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      {/* Items list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyState
            size="sm"
            icon="🍽️"
            showImage={false}
            title="No menu items yet"
            description="Start building your menu. Add your first dish and make it visible to students on campus."
            action={{ label: "Add first item", onClick: () => { setEditing(null); setShowForm(true); } }}
          />
        ) : (
          items.map((item) => (
            <MenuItemRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} onToggleAvailability={handleToggle} />
          ))
        )}
      </div>
    </div>
  );
}
