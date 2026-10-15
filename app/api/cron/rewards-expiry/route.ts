import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import mongoose from "mongoose"
import crypto from "crypto"
import { toMajorUnit } from "@/lib/money"

export async function POST(req: Request) {
  try {
    // 1. Authorization Check (QStash Bearer token)
    const authHeader = req.headers.get("authorization")
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`

    if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
      console.warn("[POST /api/cron/rewards-expiry] Unauthorized attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Dynamically import models to ensure they are registered
    const WalletTransaction = (await import("@/models/WalletTransaction"))
      .default
    const Wallet = (await import("@/models/Wallet")).default
    const Customer = (await import("@/models/Customer")).default
    const { sendRewardWarningEmail } = await import("@/lib/rewardMail")
    const { serializeWalletTransaction, serializeCustomer } =
      await import("@/lib/serializers")

    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(now.getDate() + 7)

    // ─────────────────────────────────────────────────────────────────────────────
    // TASK A: Process Actual Expirations
    // ─────────────────────────────────────────────────────────────────────────────
    const rawExpiredTransactions = await WalletTransaction.find({
      type: "reward",
      direction: "credit",
      isExpired: false,
      expiresAt: { $lt: now },
      $or: [
        { remainingAmountInKobo: { $gt: 0 } },
        { remainingAmountInKobo: { $exists: false } },
      ],
    }).lean()

    const expiredTransactions = rawExpiredTransactions
      .map(serializeWalletTransaction)
      .filter((tx): tx is NonNullable<typeof tx> => tx !== null)

    let expiredProcessed = 0
    let expiredUsers = 0

    if (expiredTransactions.length > 0) {
      // Group by customerId to batch operations
      const expiredByCustomer: Record<string, number> =
        expiredTransactions.reduce((acc: Record<string, number>, tx) => {
          const id = tx.customerId
          const amountToExpire = tx.remainingAmountInKobo ?? tx.amountInKobo
          if (amountToExpire > 0) {
            acc[id] = (acc[id] || 0) + amountToExpire
          }
          return acc
        }, {})

      for (const [customerId, totalExpiredAmount] of Object.entries(
        expiredByCustomer
      )) {
        const session = await mongoose.startSession()
        try {
          await session.withTransaction(async () => {
            const wallet = await Wallet.findOne({ customerId }).session(session)
            if (!wallet) return

            // Safety check: Never deduct more than the current PROMO balance.
            // We should not touch their depositBalance if promoBalance is out of sync.
            const deductionAmount = Math.min(
              wallet.promoBalanceInKobo || 0,
              totalExpiredAmount
            )

            if (deductionAmount > 0) {
              wallet.promoBalanceInKobo -= deductionAmount
              wallet.balanceInKobo -= deductionAmount
              await wallet.save({ session })

              // Create a debit transaction to explain the deduction
              await WalletTransaction.create(
                [
                  {
                    customerId,
                    type: "reward",
                    direction: "debit",
                    amountInKobo: deductionAmount,
                    balanceAfterInKobo: wallet.balanceInKobo,
                    reference: `EXP-${customerId.toString().slice(-6)}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
                    description: "BiteHub Coins Expired",
                  },
                ],
                { session }
              )
            }

            // Mark all the individual credit transactions as expired
            await WalletTransaction.updateMany(
              {
                customerId,
                type: "reward",
                direction: "credit",
                isExpired: false,
                expiresAt: { $lt: now },
              },
              { $set: { isExpired: true, remainingAmountInKobo: 0 } },
              { session }
            )

            expiredUsers++
            expiredProcessed += expiredTransactions.filter(
              (t) => t.customerId.toString() === customerId
            ).length
          })
        } catch (error) {
          console.error(
            `[CRON EXPIRE] Failed for customer ${customerId}:`,
            error
          )
        } finally {
          await session.endSession()
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TASK B: Send 7-Day Warnings (BHC & Vouchers)
    // ─────────────────────────────────────────────────────────────────────────────
    const RewardVoucher = (await import("@/models/RewardVoucher")).default

    const rawWarningTransactions = await WalletTransaction.find({
      type: "reward",
      direction: "credit",
      isExpired: false,
      warningEmailSentAt: { $exists: false },
      expiresAt: { $gt: now, $lt: sevenDaysFromNow },
      $or: [
        { remainingAmountInKobo: { $gt: 0 } },
        { remainingAmountInKobo: { $exists: false } },
      ],
    }).lean()

    const rawWarningVouchers = await RewardVoucher.find({
      isUsed: false,
      warningEmailSentAt: { $exists: false },
      expiresAt: { $gt: now, $lt: sevenDaysFromNow },
    }).lean()

    const warningTransactions = rawWarningTransactions
      .map(serializeWalletTransaction)
      .filter((tx): tx is NonNullable<typeof tx> => tx !== null)

    let warningsSent = 0

    if (warningTransactions.length > 0 || rawWarningVouchers.length > 0) {
      // Group by customerId so we send 1 email per user
      type WarningData = { bhcAmount: number; voucherCount: number }
      const warningByCustomer: Record<string, WarningData> = {}

      // Add BHC warnings
      warningTransactions.forEach((tx) => {
        const id = tx.customerId
        const warningAmt = tx.remainingAmountInKobo ?? tx.amountInKobo
        if (warningAmt > 0) {
          if (!warningByCustomer[id])
            warningByCustomer[id] = { bhcAmount: 0, voucherCount: 0 }
          warningByCustomer[id].bhcAmount += warningAmt
        }
      })

      // Add Voucher warnings
      rawWarningVouchers.forEach((v) => {
        const id = v.customerId.toString()
        if (!warningByCustomer[id])
          warningByCustomer[id] = { bhcAmount: 0, voucherCount: 0 }
        warningByCustomer[id].voucherCount += 1
      })

      // We need customer details for the emails
      const customerIds = Object.keys(warningByCustomer)
      const rawCustomers = await Customer.find({
        _id: { $in: customerIds },
      }).lean()
      const customers = rawCustomers
        .map(serializeCustomer)
        .filter((c): c is NonNullable<typeof c> => c !== null)

      const customerMap = customers.reduce(
        (acc, c) => {
          acc[c.id] = c
          return acc
        },
        {} as Record<string, (typeof customers)[number]>
      )

      for (const [customerId, data] of Object.entries(warningByCustomer)) {
        const customer = customerMap[customerId]
        if (customer && customer.email) {
          try {
            const warningText = []
            if (data.bhcAmount > 0)
              warningText.push(`${toMajorUnit(data.bhcAmount)} BHC`)
            if (data.voucherCount > 0)
              warningText.push(
                `${data.voucherCount} Free Meal Voucher${data.voucherCount > 1 ? "s" : ""}`
              )

            const expiringItemsText = warningText.join(" and ")

            await sendRewardWarningEmail(
              customer.email,
              customer.name,
              expiringItemsText
            )

            // Mark BHC as warned
            if (data.bhcAmount > 0) {
              await WalletTransaction.updateMany(
                {
                  customerId,
                  type: "reward",
                  direction: "credit",
                  isExpired: false,
                  warningEmailSentAt: { $exists: false },
                  expiresAt: { $gt: now, $lt: sevenDaysFromNow },
                },
                { $set: { warningEmailSentAt: new Date() } }
              )
            }

            // Mark Vouchers as warned
            if (data.voucherCount > 0) {
              await RewardVoucher.updateMany(
                {
                  customerId,
                  isUsed: false,
                  warningEmailSentAt: { $exists: false },
                  expiresAt: { $gt: now, $lt: sevenDaysFromNow },
                },
                { $set: { warningEmailSentAt: new Date() } }
              )
            }

            warningsSent++
          } catch (error) {
            console.error(
              `[CRON WARNING] Failed for customer ${customerId}:`,
              error
            )
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reward expiry cron completed",
      expired: {
        transactions: expiredProcessed,
        users: expiredUsers,
      },
      warningsSent,
    })
  } catch (error) {
    console.error("[POST /api/cron/rewards-expiry]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
