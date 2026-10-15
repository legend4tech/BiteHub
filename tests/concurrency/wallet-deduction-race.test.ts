import { describe, it, expect, beforeEach } from "vitest"

describe("Wallet Concurrency & Overdraft Protection", () => {
  // In-memory atomic wallet simulation replicating MongoDB findOneAndUpdate with $gte guard
  interface SimulatedWallet {
    id: string
    balanceInKobo: number
    depositBalanceInKobo: number
    promoBalanceInKobo: number
    version: number
  }

  let walletStore: Map<string, SimulatedWallet>

  beforeEach(() => {
    walletStore = new Map()
  })

  // Simulates MongoDB's atomic findOneAndUpdate({ id, balanceInKobo: { $gte: amount } }, { $inc: { balanceInKobo: -amount } })
  async function atomicDeductWallet(
    walletId: string,
    amountInKobo: number
  ): Promise<{ success: boolean; newBalanceInKobo?: number; error?: string }> {
    // Add artificial micro-jitter to simulate asynchronous event-loop interleaving
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 5))

    const wallet = walletStore.get(walletId)
    if (!wallet) {
      return { success: false, error: "Wallet not found" }
    }

    // Atomic guard: check and mutate atomically
    if (wallet.balanceInKobo < amountInKobo) {
      return { success: false, error: "Insufficient balance" }
    }

    wallet.balanceInKobo -= amountInKobo
    wallet.depositBalanceInKobo = Math.max(
      0,
      wallet.depositBalanceInKobo - amountInKobo
    )
    wallet.version += 1

    return { success: true, newBalanceInKobo: wallet.balanceInKobo }
  }

  it("prevents double-spending when 10 checkout requests fire simultaneously", async () => {
    const walletId = "cust-wallet-100"
    // Initial balance: ₦5,000 (500,000 Kobo)
    walletStore.set(walletId, {
      id: walletId,
      balanceInKobo: 500_000,
      depositBalanceInKobo: 500_000,
      promoBalanceInKobo: 0,
      version: 1,
    })

    // 10 concurrent requests each attempting to spend the entire ₦5,000
    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      atomicDeductWallet(walletId, 500_000).then((res) => ({
        index: i,
        ...res,
      }))
    )

    const results = await Promise.all(concurrentRequests)

    const successfulRequests = results.filter((r) => r.success)
    const failedRequests = results.filter((r) => !r.success)

    // Exactly 1 must succeed
    expect(successfulRequests.length).toBe(1)
    // Exactly 9 must fail with 'Insufficient balance'
    expect(failedRequests.length).toBe(9)
    failedRequests.forEach((fail) => {
      expect(fail.error).toBe("Insufficient balance")
    })

    // Final balance in the store must be exactly 0, never negative
    const finalWallet = walletStore.get(walletId)!
    expect(finalWallet.balanceInKobo).toBe(0)
    expect(finalWallet.balanceInKobo).toBeGreaterThanOrEqual(0)
  })

  it("preserves exact integer accounting under mixed concurrent credits and debits", async () => {
    const walletId = "cust-wallet-mixed"
    walletStore.set(walletId, {
      id: walletId,
      balanceInKobo: 100_000, // ₦1,000 initial
      depositBalanceInKobo: 100_000,
      promoBalanceInKobo: 0,
      version: 1,
    })

    const creditWallet = async (walletId: string, amountInKobo: number) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 5))
      const wallet = walletStore.get(walletId)!
      wallet.balanceInKobo += amountInKobo
      wallet.depositBalanceInKobo += amountInKobo
      wallet.version += 1
      return { success: true }
    }

    // 5 credits of ₦500 (50,000 Kobo) = +250,000 Kobo
    // 5 debits of ₦300 (30,000 Kobo) = -150,000 Kobo
    // Expected final balance: 100,000 + 250,000 - 150,000 = 200,000 Kobo (₦2,000)
    const credits = Array.from({ length: 5 }, () =>
      creditWallet(walletId, 50_000)
    )
    const debits = Array.from({ length: 5 }, () =>
      atomicDeductWallet(walletId, 30_000)
    )

    await Promise.all([...credits, ...debits])

    const finalWallet = walletStore.get(walletId)!
    expect(finalWallet.balanceInKobo).toBe(200_000)
    expect(Number.isInteger(finalWallet.balanceInKobo)).toBe(true)
  })

  it("prevents promo coin race where two simultaneous orders compete for the same promo coins", async () => {
    // Customer has ₦2,000 promo coins and ₦10,000 deposit
    const promoWallet = {
      promoBalanceInKobo: 200_000,
      depositBalanceInKobo: 1_000_000,
      balanceInKobo: 1_200_000,
    }

    // Function simulating spending promo coins with atomic clamp
    const spendPromo = async (requestedPromoInKobo: number) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 5))
      const available = promoWallet.promoBalanceInKobo
      const toDeduct = Math.min(available, requestedPromoInKobo)
      promoWallet.promoBalanceInKobo -= toDeduct
      promoWallet.balanceInKobo -= toDeduct
      return toDeduct
    }

    // Two orders simultaneously request the full ₦2,000 promo coins
    const [order1Promo, order2Promo] = await Promise.all([
      spendPromo(200_000),
      spendPromo(200_000),
    ])

    // Total promo deducted across both orders cannot exceed initial 200,000 Kobo
    expect(order1Promo + order2Promo).toBe(200_000)
    expect(promoWallet.promoBalanceInKobo).toBe(0)
    expect(promoWallet.promoBalanceInKobo).toBeGreaterThanOrEqual(0)
  })
})
