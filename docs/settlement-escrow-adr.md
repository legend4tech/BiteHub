# ADR: Vendor Settlement Timing (Escrow / T+0 / T+1)

**Date:** 2026-05-27  
**Status:** Deferred — revisit when chargebacks/disputes become a reported problem

---

## Context

Currently BiteHub uses Monnify income splits. When a customer pays, the vendor's
share is deposited into their Monnify subaccount immediately at transaction time.
BiteHub has no control over disbursement timing after the split fires.

A T+1 or escrow model was proposed to create a dispute window.

---

## Decision

**Keep the current instant split model.** Do not implement escrow yet.

### Reasons
- Campus food delivery dispute rate is near zero (community trust, sub-60min delivery)
- Vendors depend on same-day earnings for next-day stock purchases
- T+1 would hurt vendor cash flow without solving a real reported problem
- Adding escrow now would significantly increase complexity and maintenance burden

---

## Future Implementation Plan (when needed)

If chargebacks or disputes become a real problem, migrate to this model:

### Architecture
1. Remove `subAccountCode` from Monnify charge config → all funds land in BiteHub account
2. Add `pendingBalance: number` field to Vendor model
3. Credit `pendingBalance` when payment is confirmed (webhook/verify)
4. When order status → `completed`: call Monnify Transfer API to disburse to vendor bank
5. On transfer failure: retry queue + admin alert

### Settlement Options
| Model | Trigger | Vendor impact |
|---|---|---|
| **T+0 on completion** | Order marked "completed" | Same day — recommended |
| **T+1** | Midnight batch after payment | Next day — hurts vendors |

### Monnify APIs needed
- `POST /transfer` — initiate bank transfer
- `GET /transfer/:id` — check transfer status
- Webhook: `transfer.success` / `transfer.failed` events

### Regulatory note
Holding 3rd-party vendor funds in BiteHub's account at scale may require
CBN payment service licensing. Assess at the time of implementation.

---

## Trigger for revisiting
- Multiple vendor-reported payment disputes in a 30-day window, OR
- A chargeback incident that results in financial loss to BiteHub
