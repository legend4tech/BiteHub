# BiteHub — Contribution Guide

> This guide applies to **all contributors**: human developers and AI coding assistants (LLMs) alike.
> Every rule here exists because the codebase already follows it. Don't deviate without a strong reason — and document when you do.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [File Size Limit](#3-file-size-limit)
4. [Separation of Concerns](#4-separation-of-concerns)
5. [DRY — Don't Repeat Yourself](#5-dry--dont-repeat-yourself)
6. [TypeScript Rules](#6-typescript-rules)
7. [API Route Patterns](#7-api-route-patterns)
8. [Service Layer](#8-service-layer)
9. [Database & Mongoose Patterns](#9-database--mongoose-patterns)
10. [Serializers](#10-serializers)
11. [Zod Schemas](#11-zod-schemas)
12. [React Query Hooks](#12-react-query-hooks)
13. [Loading, Error & Empty Fallbacks](#13-loading-error--empty-fallbacks)
14. [Component Guidelines](#14-component-guidelines)
15. [Commenting & Documentation](#15-commenting--documentation)
16. [Naming Conventions](#16-naming-conventions)
17. [Security Rules](#17-security-rules)
18. [Environment Variables](#18-environment-variables)
19. [Git & Commit Rules](#19-git--commit-rules)

---

## 1. Project Overview

BiteHub is a **campus food ordering platform** built with:

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: MongoDB via Mongoose
- **Auth**: NextAuth v5
- **State**: React Query (server cache) + Context (local UI state)
- **Validation**: Zod
- **Styling**: Tailwind CSS + shadcn/ui
- **Notifications**: WhatsApp Business API (Meta)
- **Monitoring**: Sentry
- **File uploads**: Cloudinary

---

## 2. Folder Structure

```
bitehub/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # All backend API route handlers
│   │   ├── vendor/         # Vendor-scoped API routes
│   │   ├── admin/          # Admin-scoped API routes
│   │   ├── orders/         # Public order routes
│   │   └── whatsapp/       # Webhook handlers
│   ├── vendor/             # Vendor dashboard pages
│   ├── admin/              # Admin dashboard pages
│   └── (public pages)      # Landing, menus, vendors, order tracking
│
├── components/
│   ├── shared/             # Reusable cross-feature components
│   │   │                   # (PageSkeleton, EmptyState, FetchError, ConfirmDialog…)
│   ├── ui/                 # shadcn/ui primitives ONLY — no business logic here
│   ├── vendor/             # Vendor dashboard components
│   ├── admin/              # Admin dashboard components
│   ├── landing/            # Landing page section components
│   ├── menus/              # Menu browsing components
│   ├── vendors/            # Vendor listing components
│   ├── cart/               # Cart components
│   └── providers/          # React context providers
│
├── hooks/
│   ├── queries/            # React Query data-fetching hooks
│   └── (root)              # Non-async UI hooks (useCart, useDebounce…)
│
├── lib/
│   ├── services/           # Server-only DB query functions
│   ├── schemas.ts          # All Zod validation schemas + inferred types
│   ├── types.ts            # All shared TypeScript interfaces
│   ├── serializers.ts      # Mongoose .lean() → plain JSON mappers
│   ├── constants.ts        # App-wide constants (ORDER_STATUS, categories…)
│   ├── db.ts               # MongoDB connection singleton
│   ├── axios.ts            # Configured axios client
│   ├── format.ts           # Display formatters (currency, dates…)
│   └── whatsapp.ts         # WhatsApp notification helpers
│
├── models/                 # Mongoose models (one file per model)
├── emails/                 # React Email templates
├── types/                  # Global TypeScript declaration files
└── scripts/                # One-off scripts (seeding, migrations)
```

### Rules

- **Never** place business logic inside `components/ui/`. Those are primitives.
- **Never** create a new top-level folder without team discussion.
- Feature-specific components live in their feature folder (`vendor/`, `menus/`, etc.). Only truly reusable components belong in `shared/`.
- API routes mirror their UI counterpart: `app/vendor/menu/` ↔ `app/api/vendor/menu/`.

---

## 3. File Size Limit

> **Hard limit: 450 lines per file.**

If a file is approaching 450 lines:

1. **Split by concern** — extract sub-components, hooks, or helper functions into their own files.
2. **Extract the form** — forms always live in their own `*Form.tsx` file.
3. **Extract sub-sections** — large UI sections become their own named components.

```
❌ VendorDashboardPage.tsx  — 600 lines (too large)

✅ VendorDashboardPage.tsx  — 120 lines  (composes sub-components)
✅ VendorMenuManagement.tsx — 220 lines  (extracted feature component)
✅ MenuItemForm.tsx         — 280 lines  (extracted form)
```

This limit enforces readability, reviewability, and single responsibility.

---

## 4. Separation of Concerns

Each layer has **one job**. Do not mix them.

| Layer | Responsibility | Location |
|---|---|---|
| **Page** | Compose layout, fetch server data, pass to components | `app/**/page.tsx` |
| **Component** | Render UI, handle local interactions | `components/` |
| **Hook** | Encapsulate data-fetching or reusable stateful logic | `hooks/` |
| **Service** | Complex DB queries shared between routes and pages | `lib/services/` |
| **API Route** | HTTP layer: validate input → call service → return response | `app/api/**/route.ts` |
| **Model** | Define DB schema and indexes | `models/` |
| **Serializer** | Convert Mongoose docs to clean frontend JSON | `lib/serializers.ts` |
| **Schema** | Validate and infer types from user input | `lib/schemas.ts` |

### Violations to avoid

```tsx
// ❌ BAD — DB query inside a component
export default function VendorList() {
  const vendors = await Vendor.find({ isActive: true }); // wrong layer
}

// ✅ GOOD — DB query lives in the service; component receives data
export default async function VendorList() {
  const { vendors } = await getVendors({ campus });
}
```

```ts
// ❌ BAD — manual validation inside an API route
if (!body.name || body.name.length < 2) return NextResponse.json({ error: "..." }, { status: 400 });

// ✅ GOOD — validation via Zod schema
const parsed = mySchema.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
```

---

## 5. DRY — Don't Repeat Yourself

### Shared types

All shared types live in `lib/types.ts`. Never redefine an interface that already exists.

```ts
// ❌ BAD — redefining MenuItem locally
interface MenuItemLocal { id: string; name: string; ... }

// ✅ GOOD
import type { MenuItem } from "@/lib/types";
```

### Shared payload types

When a type is used in multiple places with the same `Omit`/`Pick`, define it once:

```ts
// lib/types.ts
export type MenuItemPayload = Omit<
  MenuItem,
  "id" | "vendorId" | "vendorName" | "createdAt" | "updatedAt"
>;
```

### Shared DB queries

If the same query is needed in both an API route and a Server Component, extract it to `lib/services/`. Never copy-paste DB logic.

### Shared constants

All constants (status values, categories, limits, URLs) live in `lib/constants.ts`. Never hardcode a magic string or number inside a component or route.

```ts
// ❌ BAD
if (order.status === "pending") { ... }

// ✅ GOOD
import { ORDER_STATUS } from "@/lib/constants";
if (order.status === ORDER_STATUS.PENDING) { ... }
```

---

## 6. TypeScript Rules

- **Strict mode is on.** Do not suppress errors with `// @ts-ignore` or `as any` without a documented reason.
- **Never use `any`** as a return type or parameter. Use `unknown` and narrow it.
- **Prefer `null` over `undefined`** for optional DB fields — `undefined` is silently dropped by `JSON.stringify`, `null` is preserved.
- **Convert `undefined → null`** at the boundary between form values and API payloads:

```ts
description: values.description ?? null,       // undefined → null
availableFrom: values.availableFrom || null,   // "" or undefined → null
```

- **Always export inferred Zod types** alongside the schema:

```ts
export const mySchema = z.object({ ... });
export type MyValues = z.infer<typeof mySchema>;
```

---

## 7. API Route Patterns

Every file in `app/api/` must follow this structure:

```ts
// app/api/vendor/menu/route.ts

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { mySchema } from "@/lib/schemas";

// ── GET /api/vendor/menu ─────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Parse + validate query params or body via Zod
    // 2. Auth check (if protected)
    // 3. Call service or model
    // 4. Serialize result
    // 5. Return response

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/vendor/menu]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### HTTP Status Code Reference

| Code | When to use |
|---|---|
| `200` | Successful GET |
| `201` | Successful creation (POST) |
| `400` | Bad input / validation error |
| `401` | Unauthenticated |
| `403` | Authenticated but not authorised |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate) |
| `500` | Unexpected server error |

### Rules

- **Always** call `await dbConnect()` before any Mongoose operation.
- **Always** validate request bodies with Zod `.safeParse()`.
- **Always** wrap the handler body in `try/catch` and return a `500`.
- **Always** prefix error logs with the route path: `[POST /api/orders]`.
- **Never trust** client-sent prices, IDs, or totals — re-fetch from the DB.
- **Protected routes** must verify the session before doing any DB work.

---

## 8. Service Layer

Files in `lib/services/` are **server-only** modules. They hold complex DB queries reused across API routes and Server Components.

```ts
/**
 * vendorService.ts
 *
 * Single source of truth for all vendor DB queries.
 * Used by /api/vendors (React Query) AND server pages (landing, vendors listing).
 */

export async function getVendors(options: GetVendorsOptions = {}) {
  await dbConnect(); // always connect inside the function
  // ... query logic
  return { vendors: serializedVendors, totalVendors };
}
```

### Rules

- Call `await dbConnect()` inside the function — callers should not be responsible for this.
- Return **serialized plain objects**, never raw Mongoose documents.
- Add a file-level JSDoc header explaining what the service owns and where it is consumed.
- Never import from `components/` or `hooks/` inside a service.

---

## 9. Database & Mongoose Patterns

### Model structure

```ts
// models/MenuItem.ts

const MenuItemSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: { type: String, required: true },
    // ...
  },
  {
    timestamps: true, // ← always enable; never manually set createdAt/updatedAt
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Indexes — declare for every field used in a filter/sort
MenuItemSchema.index({ vendorId: 1 });
MenuItemSchema.index({ vendorId: 1, isAvailable: 1 });
```

### Query rules

- Use `.lean()` for read-only queries — faster and returns plain objects.
- When using `.lean()`, always run the result through a **serializer** — `.lean()` skips `toJSON` so `_id` is an ObjectId and virtuals are absent.
- Use `Promise.all` for parallel independent queries:

```ts
// ✅ Parallel — not sequential awaits
const [items, total] = await Promise.all([
  MenuItem.find(query).lean(),
  MenuItem.countDocuments(query),
]);
```

---

## 10. Serializers

All Mongoose `.lean()` documents must pass through a serializer in `lib/serializers.ts` before being sent to the client.

```ts
// ❌ BAD — raw Mongoose doc, leaks _id, __v, sensitive fields
return NextResponse.json(vendor);

// ✅ GOOD
import { serializeVendor } from "@/lib/serializers";
return NextResponse.json(serializeVendor(vendor));
```

When adding a new model, add a corresponding `serializeX()` function that:

1. Maps `_id → id` (string)
2. Maps `Date` timestamps → `.toISOString()` strings
3. Maps ObjectId refs → strings
4. Replaces `undefined` with `null` using `?? null`
5. Omits sensitive fields (`password`, `__v`, tokens, etc.)

---

## 11. Zod Schemas

All validation schemas live in `lib/schemas.ts`. Never define a schema inline inside a component or route handler.

```ts
// ❌ BAD — inline schema
const schema = z.object({ name: z.string() });

// ✅ GOOD — centralised
import { menuItemFormSchema, type MenuItemFormValues } from "@/lib/schemas";
```

### Form schemas vs API schemas

| Schema type | Rule |
|---|---|
| **Form schema** (used with `zodResolver`) | Must **not** use `.transform()` — it breaks the resolver |
| **API schema** (used in route handlers) | Can use `.transform()` for normalisation (e.g. phone numbers) |

When both are needed for the same resource, export two:
- `myFormInputSchema` — for the form
- `mySchema` — for the API route

---

## 12. React Query Hooks

All client-side data fetching goes through a React Query hook in `hooks/queries/`. Never call `fetch` or `apiClient` directly from a component.

```ts
// hooks/queries/useMenuItems.ts

export function useMenuItems(vendorId: string) {
  return useQuery({
    queryKey: ["menu-items", vendorId],
    queryFn: () => apiClient.get(`/vendor/menu?vendorId=${vendorId}`).then(r => r.data),
    enabled: !!vendorId,
  });
}
```

### Rules

- Name hooks `use[Resource]` or `use[Resource][Action]` — e.g. `useVendorOrders`, `useMenuItemDetail`.
- Always use a **stable, descriptive `queryKey`** — it drives cache invalidation.
- Use `enabled` to gate queries on required data being available.
- After a mutation, invalidate the related query:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["menu-items", vendorId] });
}
```

---

## 13. Loading, Error & Empty Fallbacks

**Every data-dependent UI must handle all three states.** This is non-negotiable.

### 🟡 Loading — `PageSkeleton`, not a full-page spinner

```tsx
// ❌ BAD
if (isLoading) return <Spinner />;

// ✅ GOOD
if (isLoading) return <PageSkeleton variant="menu-item-edit" />;
```

**Spinners are only allowed for small inline operations:**
- Submit buttons while a form is posting (`isSubmitting`)
- Inline refresh indicators on small widgets

When adding a new page type, add a corresponding `variant` to `components/shared/PageSkeleton.tsx`.

### 🔴 Error — `FetchError`

```tsx
if (isError) return <FetchError onRetry={() => refetch()} message="Failed to load menu items." />;
```

Never show a blank screen or raw error text on fetch failure. Always include a retry mechanism.

### ⚪ Empty — `EmptyState`

```tsx
if (items.length === 0) {
  return (
    <EmptyState
      title="No items yet"
      description="Add your first menu item to get started."
      action={{ label: "Add Item", href: "/vendor/menu/new" }}
    />
  );
}
```

Never render nothing. Always communicate why the list is empty and what the user can do.

### Quick reference

| Situation | Use |
|---|---|
| Full page loading | `<PageSkeleton variant="..." />` |
| Button submitting | Spinner inside button + `disabled` prop |
| Fetch failed | `<FetchError onRetry={refetch} />` |
| List is empty | `<EmptyState title description action />` |
| Section render error | `<SectionErrorBoundary />` |

---

## 14. Component Guidelines

### File naming

| Type | Convention | Example |
|---|---|---|
| Component | `PascalCase.tsx` | `MenuItemCard.tsx` |
| Hook | `camelCase.ts` | `useMenuItems.ts` |
| Page | `page.tsx` | `app/vendor/menu/page.tsx` |
| Layout | `layout.tsx` | `app/vendor/layout.tsx` |

### Rules

- **One component per file** for any component with meaningful complexity.
- **No business logic** in `components/ui/` — those are display-only primitives.
- **Always type props explicitly** with a named interface:

```tsx
interface MenuItemCardProps {
  item: MenuItem;
  onDelete: (id: string) => void;
}

export function MenuItemCard({ item, onDelete }: MenuItemCardProps) { ... }
```

- **Avoid prop drilling beyond 2 levels.** Use context or restructure.
- **`"use client"`** must be the very first line of client components.
- **Never import server-only code** (`lib/db`, `lib/services/*`, Mongoose models) in a client component.
- **Forms live in their own `*Form.tsx` file** — never inline a large form inside a page.

---

## 15. Commenting & Documentation

### Comment the *why*, not the *what*

```ts
// ❌ BAD — states the obvious
// Loop through vendors
for (const vendor of vendors) { ... }

// ✅ GOOD — explains a non-obvious decision
// .lean() skips toJSON virtuals, so we serialize manually via serializeVendor()
const vendors = await Vendor.find(query).lean();
```

### File-level headers (required for services and utilities)

```ts
/**
 * menuService.ts
 *
 * Single source of truth for all menu DB queries.
 * Used by /api/menus (React Query) AND server pages (vendor menu listing).
 */
```

### Section separators (for files > 100 lines)

```ts
// ─── Section Name ─────────────────────────────────────────────────────────────
```

### JSDoc for public functions

```ts
/**
 * Normalise a Nigerian phone number to international +234 format.
 * Accepts: 08012345678, 8012345678, +2348012345678
 * Returns: +2348012345678
 */
export function normaliseNigerianPhone(raw: string): string { ... }
```

### TODOs

```ts
// TODO: Send push notification when order status changes to "ready"
```

---

## 16. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `MenuItemCard` |
| Hooks | `camelCase` with `use` prefix | `useMenuItems` |
| Service files | `camelCase` + `Service` suffix | `vendorService.ts` |
| API route files | Always `route.ts` | `app/api/orders/route.ts` |
| Model files | `PascalCase` | `MenuItem.ts` |
| Mongoose interfaces | `I` prefix | `IMenuItem` |
| Zod schemas | `camelCase` + `Schema` suffix | `menuItemFormSchema` |
| Inferred Zod types | `PascalCase` + `Values` suffix | `MenuItemFormValues` |
| Constants | `SCREAMING_SNAKE_CASE` | `ORDER_STATUS.PENDING` |
| Boolean props/vars | `is` or `has` prefix | `isAvailable`, `hasError` |
| Event handlers | `handle` prefix | `handleSave`, `handleDelete` |
| React Query keys | kebab-case strings | `"menu-items"`, `"vendor-orders"` |

---

## 17. Security Rules

- **Never trust client-sent prices or totals.** Always recalculate server-side from DB records.
- **Never expose vendor WhatsApp numbers** from client state to an API body — source from DB server-side.
- **Rate-limit sensitive endpoints** (auth, OTP, contact) using `lib/rate-limit.ts`.
- **Protect vendor/admin routes** — verify the session and ownership before any mutation.
- **Never log sensitive data** — no passwords, tokens, or full phone numbers in `console.log`.
- **Always validate server-side** via Zod even when client-side validation exists.
- **Webhook endpoints** must verify the signature or verify token before processing any payload.

---

## 18. Environment Variables

- Document every env var in `.env.example` — update it whenever you add a new one.
- **Server-only secrets** (DB URI, API tokens, Cloudinary secrets) must **never** have `NEXT_PUBLIC_` prefix.
- **Client-exposed vars** must use `NEXT_PUBLIC_` and must **never** contain secrets.
- Degrade gracefully when an optional service is unconfigured:

```ts
const token = process.env.WHATSAPP_ACCESS_TOKEN;
if (!token) {
  // Don't crash the order flow — just skip the notification
  console.warn("[whatsapp] WHATSAPP_ACCESS_TOKEN not set — skipping notification.");
  return;
}
```

---

## 19. Git & Commit Rules

### Branch naming

```
feature/add-vendor-notifications
fix/menu-item-type-error
chore/update-dependencies
refactor/extract-menu-service
```

### Commit format ([Conventional Commits](https://www.conventionalcommits.org/))

```
feat: add WhatsApp order notification to vendor
fix: correct undefined → null type mismatch in MenuItemForm
chore: add CONTRIBUTING.md
refactor: extract vendor query logic into vendorService
docs: document webhook subscription fields
```

### Pre-PR checklist

- [ ] `pnpm run build` passes with **zero** TypeScript errors
- [ ] No `console.log` left in production paths (use `console.error` for genuine errors only)
- [ ] All new pages have **loading**, **error**, and **empty** fallbacks
- [ ] No file exceeds **450 lines**
- [ ] New Mongoose models have a serializer in `lib/serializers.ts`
- [ ] New API routes follow the standard structure (§7)
- [ ] New environment variables are documented in `.env.example`
- [ ] New shared types are added to `lib/types.ts`, not defined locally
- [ ] New constants are added to `lib/constants.ts`, not hardcoded inline

---

*Last updated: May 2026 · Maintained by the BiteHub core team.*
