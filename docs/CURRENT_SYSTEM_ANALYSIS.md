# BiteHub Current System Architecture & Workflow Analysis
**Date:** September 2026

This document breaks down exactly how the BiteHub platform currently operates at a technical and operational level, based on an analysis of the existing codebase.

---

## 1. Technical Stack & Architecture
BiteHub is built on a modern, highly scalable stack designed to act as a robust marketplace:
- **Frontend/Backend:** Next.js (App Router) with React Server Components.
- **Database:** MongoDB (via Mongoose), allowing for flexible, document-based storage of vendors, orders, and users.
- **State Management:** React Query (used heavily via domain-driven hooks like `useVendorOrders` and `useCustomerProfile` to handle caching and real-time data fetching).
- **Validation:** Zod schemas (ensuring strict data typing between the UI forms and API routes).
- **Payments:** Monnify Integration (Handling checkouts, wallet funding, and sub-account vendor splits).

## 2. Order & Payment Flow
When a customer places an order, the system processes it as follows:
1. **Checkout:** The customer builds a cart and enters the checkout flow.
2. **Payment Gateway:** The order is routed through Monnify. The customer pays via Bank Transfer, Card, or USSD. (Customers can also use the newly built BiteHub Wallet for zero-fee checkouts).
3. **The Split (Escrow is NOT used):** Monnify is configured to instantly split the income. The vendor's cut goes straight into their Monnify Sub-Account (`subAccountCode`). BiteHub takes the platform fee immediately.
4. **Fulfillment:** The vendor receives the order on their dashboard. They manually update the status (Pending → Preparing → Delivering → Completed).

## 3. The Platform Economics (The Code Reality)
Based on the global settings and order processing APIs (`app/api/orders/route.ts` and `lib/services/settingService.ts`):
- **Platform Fee Percentage:** The global default is **5%**, though it is dynamically configurable in the Admin Dashboard (via the `GlobalSettings` model).
- **Service Fees:** The system has fields for a `serviceFee` to be applied to orders, but this is currently not aggressively utilized to offset gateway costs.
- **Delivery Zones & Fees:** Vendors have the power to define their own `deliveryZones` and set their own `deliveryFee`. BiteHub currently acts purely as a software bridge, leaving the physical logistics entirely to the vendor.

## 4. Current Bottlenecks & Code Limitations
1. **No Built-in Dispatch System:** The codebase does not have a "Rider App" or dispatch logic. When an order goes to "Delivering", the system blindly trusts the vendor to figure out how to transport the food. This is the root cause of the 2-hour delays.
2. **Vendor Control:** Vendors have too much control over pausing menus or ignoring orders without automated penalties. The system lacks a strict SLA (Service Level Agreement) auto-cancellation feature (e.g., "If vendor doesn't accept in 5 mins, cancel and refund").
3. **Fee Structure UI:** The checkout page is set up to add multiple potential line items (Total, Delivery, Service Fee), which can lead to the "Fee Fatigue" discussed in the business advisory.

---

## 5. Summary of Current Operations
BiteHub is currently operating as a **B2B2C Software Provider**, not a logistics company. 
- You provide the digital storefront.
- You process the payments.
- You take a 5% cut.
- You leave the hardest part (delivery) to the vendors, who are failing at it.

To pivot to profitability and better UX, the codebase will eventually need to introduce an administrative dispatch module (to assign the "2 Trusted Bikers") and a simplified fee calculation engine (the "Handling Fee").

---

## 6. Critical Architectural Questions & Vulnerabilities
Based on the current codebase and the proposed business pivots, here are the dangerous edge cases we must answer before writing more code:

### Q1: The "Forgot to Click Complete" Dilemma (SLA Vulnerability)
*If we implement a strict auto-cancel SLA (e.g., "Cancel and refund if the order isn't marked 'Completed' in 90 minutes"), what happens if the vendor actually delivered the food but just forgot to press the button on their dashboard?*
- **The Risk:** The system will automatically refund the customer. The customer gets free food, and the vendor loses their money and the meal. This will cause massive vendor disputes.
- **How to fix it:** We cannot rely on the vendor to mark it completed. The *customer* must confirm receipt, or the *Trusted Biker* must mark it delivered.

### Q2: The Monnify Split Refund Dilemma (Settlement Vulnerability)
*Monnify has a Refund API, but because we use sub-account income splits, how exactly does Monnify handle a refund before the 10 PM settlement?*
- **The Question for Monnify Support:** If a customer cancels at 2 PM and we issue a refund, does Monnify reverse the split entirely so the vendor doesn't get paid at 10 PM? Or do they deduct the refund amount from BiteHub's global balance and *still* credit the vendor at 10 PM (meaning BiteHub takes a massive loss)? We must confirm this before enabling automated refunds.

### Q3: Enforcing the "Captive Fleet" (Logistics Vulnerability)
*If we deploy the 2 Trusted Bikers and pay them directly from BiteHub's collected funds, how do we handle vendors who are already on the platform?*
- **The Question:** Do we force all existing vendors to use our bikers, or is it a choice? If it is a choice, how does the codebase differentiate between an order that uses a BiteHub biker vs a vendor's personal biker? The system needs a toggle (`useBitehubLogistics: boolean`) to know who gets the delivery fee.

### Q4: The "Handling Fee" Math (Pricing Vulnerability)
*If we bundle the Gateway Fee and Service Fee into a single "Handling Fee" to prevent cart abandonment, how does the codebase calculate the split?*
- **The Risk:** The code currently calculates percentages based on the `totalAmount` or `foodSubtotal`. If we manipulate the fees, we must ensure the vendor's 5% commission is only calculated on the *food price*, not the combined delivery/handling fee, otherwise we will overcharge the vendor.
