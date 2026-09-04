# Architecture Vision: Feature-Sliced Design (FSD)

This document outlines the long-term architectural vision for BiteHub as the application scales.

## Current State: Domain-Driven (Phase 1 & 2)
The application currently uses a Domain-Driven structure where technical concerns (types, schemas, hooks) are separated by file type at the root level, but grouped internally by domain:
- `/types/vendor.ts`
- `/hooks/vendor/useVendorOrders.ts`
- `/lib/schemas/vendor.ts`

This is highly effective for reducing file sizes and managing complexity, but it still requires developers to navigate across multiple root directories to build a single feature.

## Future State: Feature-Sliced Design (Phase 3)
As we build entirely new, major features (e.g. a complex analytics dashboard or a new driver portal), we will adopt **Feature-Sliced Design**.

Instead of spreading a feature across `/types`, `/components`, `/hooks`, and `/lib/schemas`, we will encapsulate *everything* needed for that feature into a single `/features/[domain]/` directory.

### Example Structure for a New Feature
If we were to build a new "Vendor Discounts" feature, the structure would look like this:

```text
/features/vendor-discounts/
  ├── types.ts          (TypeScript interfaces)
  ├── schemas.ts        (Zod validation rules)
  ├── hooks.ts          (React Query queries & mutations)
  ├── api.ts            (Server actions or frontend fetch logic)
  └── components/       (UI elements: forms, buttons, modals)
```

### Adoption Strategy
- **Do NOT** refactor the existing `/types`, `/hooks`, or `/components` directories into `/features` immediately. 
- **DO** use the `/features/` pattern when building massive *new* features to validate the workflow before committing to a codebase-wide refactor.
