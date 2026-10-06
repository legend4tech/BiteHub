# Production `*InKobo` Field Migration (naira -> kobo)

> **Status: NOT YET RUN on production.**
> Do not run `--apply` until the new code is ready to deploy.

## Why this is needed

Production code still stores and reads **naira** with the OLD field names (`price`, `deliveryFee`, `isRated`, ...).
This branch stores **kobo** (₦1 = 100 kobo) with NEW names (`priceInKobo`, `deliveryFeeInKobo`, `isFullyRated`, ...)
and divides by 100 when displaying.

So production data needs TWO changes per money field: **rename** it AND **multiply by 100**.
Renaming alone is not enough: a ₦1,558.40 balance would display as ₦15.58.

> [!WARNING]
> The dev database was only renamed (not multiplied), so its money values are currently the wrong scale.
> Do not use dev as a reference for what production should look like.

If you migrate production **before** the new code is deployed, the old production code will break.
If you deploy the new code **before** migrating, the new code will see empty/wrong fields.
So do both at about the same time.

## Field-by-field conversion table

### Rename AND multiply by 100

| Collection | Old field -> New field |
|---|---|
| menuitems | `price` -> `priceInKobo` |
| orders | `deliveryFee` -> `deliveryFeeInKobo` |
| orders | `serviceFee` -> `serviceFeeInKobo` |
| orders | `platformCommission` -> `platformCommissionInKobo` |
| orders | `vendorRevenue` -> `vendorRevenueInKobo` |
| orders | `totalAmount` -> `totalAmountInKobo` |
| orders | `sponsoredDiscountAmount` -> `sponsoredDiscountAmountInKobo` |
| orders | `walletPromoAmountUsed` -> `walletPromoAmountUsedInKobo` |
| orders | `walletDepositAmountUsed` -> `walletDepositAmountUsedInKobo` |
| orders | `items[].price` -> `items[].priceInKobo` |
| vendors | `defaultDeliveryFee` -> `defaultDeliveryFeeInKobo` |
| vendors | `pendingWalletBalance` -> `pendingWalletBalanceInKobo` |
| vendors | `walletTotalDisbursed` -> `walletTotalDisbursedInKobo` |
| vendors | `monnifyTotalDisbursed` -> `monnifyTotalDisbursedInKobo` |
| vendors | `landmarkOverrides[].fee` -> `landmarkOverrides[].feeInKobo` |
| vendors | `subLandmarkOverrides[].fee` -> `subLandmarkOverrides[].feeInKobo` |
| landmarks | `defaultDeliveryFee` -> `defaultDeliveryFeeInKobo` |
| sublandmarks | `defaultDeliveryFee` -> `defaultDeliveryFeeInKobo` |
| wallets | `balance`, `depositBalance`, `promoBalance` -> same name + `InKobo` |
| wallettransactions | `amount`, `balanceAfter`, `remainingAmount` -> same name + `InKobo` |
| rewardcampaigns | `minOrderValue`, `rewardValue`, `budgetAllocated`, `budgetSpent` -> same name + `InKobo` |
| platformwithdrawals | `amount` -> `amountInKobo` |

### Rename only (NO multiplication)

| Collection | Old field -> New field |
|---|---|
| orders | `isRated` -> `isFullyRated` (boolean) |

## What the last production check found (counts of documents with the old field)

| Collection | Old field | Documents |
|---|---|---|
| menuitems | `price` | 205 |
| orders | `deliveryFee`, `serviceFee`, `platformCommission`, `vendorRevenue`, `totalAmount`, `items.price` | 102 each |
| orders | `isRated` | 99 |
| vendors | `monnifyTotalDisbursed` | 27 |
| vendors | `landmarkOverrides.fee` / `subLandmarkOverrides.fee` | 15 / 11 |
| landmarks | `defaultDeliveryFee` | 12 |

Wallets, wallet transactions and reward campaigns had no old fields at that time.
Counts will change as new data arrives, so re-run the checks before migrating.

## Scripts (all in `scripts/`)

| Script | Purpose | Writes? |
|---|---|---|
| `check-db-fields.ts` | Lists old field names still present | No (read-only) |
| `migrate-db-fields.ts` | Renames AND multiplies by 100 | **Only with `--apply`** (dry-run by default) |
| `verify-new-fields.ts` | Counts documents that have the new fields | No (read-only) |

How `migrate-db-fields.ts` stays safe:
- **Dry-run by default.** It prints counts and a sample before/after value, and writes nothing.
- Rename + multiply happen in **one atomic update per document**, so a document is never half-converted.
- It only touches documents that still have an old field, so a second run does nothing (no double ×100).
- It **aborts** if any document has both the old and new field, or a non-numeric old value.
- Values are rounded to whole kobo.
- Running it against the dev database changes nothing (the old names are gone there).

## Still to do

- [ ] Finish testing the features on this branch.
- [ ] Back up the production database (Atlas snapshot or `mongodump`).
- [ ] Point `.env` at production, then run the dry-run and check the sample values.
- [ ] Deploy the new code and run `--apply` at about the same time, during low traffic.
- [ ] Re-run `check-db-fields.ts` (expect nothing found) and `verify-new-fields.ts`.
- [ ] Spot-check the app against known figures.
- [ ] Point `.env` back at dev and delete the helper scripts (including the stray `scripts/check-db-fields.js`).

## Steps

1. **Check `.env`** points at the right database. It should have
   `MONGODB_URI` and `MONGODB_DB` for production, not for dev.
2. **Back up** the production database.
3. **Before** state:
   ```bash
   npx tsx --env-file=.env scripts/check-db-fields.ts
   ```
4. **Dry-run** (writes nothing). Read the sample lines:
   ```bash
   npx tsx --env-file=.env scripts/migrate-db-fields.ts
   ```
   A sample BEFORE of `price: 1200` must show AFTER `priceInKobo: 120000`.
   If the script prints `ABORTING`, fix what it lists before going on.
5. **Deploy the new code and apply at about the same time:**
   ```bash
   npx tsx --env-file=.env scripts/migrate-db-fields.ts --apply
   ```
6. **After** state. The check should report nothing found:
   ```bash
   npx tsx --env-file=.env scripts/check-db-fields.ts
   npx tsx --env-file=.env scripts/verify-new-fields.ts
   ```
7. Spot-check the app: a menu item price, an order total, a wallet balance and the vendor stats page.

> [!IMPORTANT]
> Anything created in production between the backup and the deploy is still in the old format.
> Run the migration during low traffic and re-run the check afterwards.
> The script is safe to run again to catch stragglers.

## Rollback

Restore from the backup taken in step 2, and redeploy the previous code.
