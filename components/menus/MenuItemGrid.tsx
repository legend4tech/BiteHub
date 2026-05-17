"use client";

import { FadeIn } from "@/components/FadeIn";
import { MenuItemCard } from "@/components/menus/MenuItemCard";
import type { MenuItem } from "@/lib/types";

interface MenuItemGridProps {
  items: MenuItem[];
  onDifferentVendor: (item: MenuItem) => void;
  /** Optional prefix so keys are unique across multiple grid instances */
  keyPrefix?: string;
}

/**
 * Renders menu items in two layouts:
 *
 * Mobile (< sm):
 *   Two flex columns where the RIGHT column is shifted UP by ~28px,
 *   creating a staggered / offset visual rhythm (Pinterest-style).
 *   Items with different heights naturally produce a masonry feel.
 *
 * sm+:
 *   Standard CSS Grid — 3 cols on sm, 4 on lg, 5 on xl.
 */
export function MenuItemGrid({
  items,
  onDifferentVendor,
  keyPrefix = "",
}: MenuItemGridProps) {

  return (
    <>
      {/* ── Mobile staggered layout (CSS Grid = guaranteed equal widths) ── */}
      {/*
       * Using grid-cols-2 here (not two flex columns) is the key fix.
       * CSS Grid always divides available space equally between columns,
       * so both columns are pixel-perfect the same width.
       *
       * Stagger: even-indexed items land in the LEFT column.
       * We push them down with a mt-6 wrapper, making the RIGHT column
       * appear higher — producing the offset rhythm without any width diff.
       */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:hidden">
        {items.map((item, i) => (
          <FadeIn
            key={`${keyPrefix}${item.id}`}
            delay={0.04 * Math.min(i, 16)}
          >
            {/* even index = left column → push down; odd = right column → stays top */}
            <div className={i % 2 === 0 ? "mt-6" : ""}>
              <MenuItemCard item={item} onDifferentVendor={onDifferentVendor} />
            </div>
          </FadeIn>
        ))}
      </div>

      {/* ── sm+ standard grid ───────────────────────────────── */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item, i) => (
          <FadeIn key={`${keyPrefix}${item.id}-d`} delay={0.04 * Math.min(i, 16)}>
            <MenuItemCard item={item} onDifferentVendor={onDifferentVendor} />
          </FadeIn>
        ))}
      </div>
    </>
  );
}
