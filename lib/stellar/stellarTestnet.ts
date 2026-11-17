import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Asset,
  Operation,
  Memo,
} from "@stellar/stellar-sdk"

export const STELLAR_TESTNET_HORIZON = "https://horizon-testnet.stellar.org"

// Official Circle Testnet USDC
export const TESTNET_USDC_CODE = "USDC"
export const TESTNET_USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

// Default testnet deposit receiving address for BiteHub Demo
export const BITEHUB_RECEIVING_ACCOUNT =
  process.env.STELLAR_RECEIVING_ACCOUNT ||
  "GDRB2UO4JRQ2D7P64DTMZAFNJFOVYXWPONBGB5YH56ZRNRXDNHRHP2RI"

export const MOCK_USDC_NAIRA_RATE = 1600 // 1 USDC = ₦1,600

export interface StellarDepositSession {
  sessionId: string
  memo: string
  amountInNaira: number
  amountInUSDC: string
  exchangeRate: number
  destinationAddress: string
  qrUri: string
  expiresAt: string
}

/**
 * Fetches live USDC/NGN exchange rate from CoinGecko with ExchangeRate-API and static fallback.
 */
export async function getLiveUsdcNgnRate(): Promise<number> {
  try {
    const cgRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn",
      { next: { revalidate: 300 } }
    )
    if (cgRes.ok) {
      const cgData = await cgRes.json()
      const ngnRate = cgData?.["usd-coin"]?.ngn
      if (typeof ngnRate === "number" && ngnRate > 100) {
        return Math.round(ngnRate * 100) / 100
      }
    }
  } catch {
    // Try secondary provider below
  }

  try {
    const erRes = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 },
    })
    if (erRes.ok) {
      const erData = await erRes.json()
      const ngnRate = erData?.rates?.NGN
      if (typeof ngnRate === "number" && ngnRate > 100) {
        return Math.round(ngnRate * 100) / 100
      }
    }
  } catch {
    // Fallback to default rate
  }

  return MOCK_USDC_NAIRA_RATE
}

/**
 * Creates an in-memory/simulated Stellar testnet deposit session.
 * Does not touch real customer wallet balances.
 */
export function createStellarDepositSession(
  amountInNaira: number,
  exchangeRate: number = MOCK_USDC_NAIRA_RATE
): StellarDepositSession {
  // Generate random 6-digit memo
  const memoNumber = Math.floor(100000 + Math.random() * 900000).toString()
  const rawUSDC = amountInNaira / exchangeRate
  const amountInUSDC = rawUSDC.toFixed(2)

  const destinationAddress = BITEHUB_RECEIVING_ACCOUNT
  const qrUri = `web+stellar:pay?destination=${destinationAddress}&amount=${amountInUSDC}&memo=${memoNumber}&memo_type=MEMO_TEXT&asset_code=${TESTNET_USDC_CODE}&asset_issuer=${TESTNET_USDC_ISSUER}`

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5-minute lock

  return {
    sessionId: `STELLAR-SES-${Date.now()}-${memoNumber}`,
    memo: memoNumber,
    amountInNaira,
    amountInUSDC,
    exchangeRate,
    destinationAddress,
    qrUri,
    expiresAt,
  }
}

/**
 * Verifies on Horizon testnet if an incoming payment exists matching the memo.
 */
export async function checkStellarPaymentOnChain(memoText: string): Promise<{
  confirmed: boolean
  hash?: string
  amount?: string
  ledger?: number
  explorerUrl?: string
}> {
  try {
    const server = new Horizon.Server(STELLAR_TESTNET_HORIZON)
    const transactions = await server
      .transactions()
      .forAccount(BITEHUB_RECEIVING_ACCOUNT)
      .order("desc")
      .limit(10)
      .call()

    for (const tx of transactions.records) {
      if (tx.memo === memoText) {
        return {
          confirmed: true,
          hash: tx.hash,
          ledger: tx.ledger_attr,
          explorerUrl: `https://stellar.expert/explorer/testnet/tx/${tx.hash}`,
        }
      }
    }

    return { confirmed: false }
  } catch (error) {
    console.error("Horizon check error:", error)
    return { confirmed: false }
  }
}

/**
 * Simulates a real on-chain transaction from a pre-funded testnet sponsor keypair.
 * If no sponsor secret is configured, gracefully generates and funds an ephemeral one via Friendbot.
 */
export async function executeSimulatedSponsorPayment(
  destinationAddress: string,
  memoText: string,
  amount: string = "5.00"
): Promise<{
  success: boolean
  hash: string
  ledger?: number
  explorerUrl: string
}> {
  const server = new Horizon.Server(STELLAR_TESTNET_HORIZON)
  let sponsorKeypair: Keypair

  if (process.env.STELLAR_SPONSOR_SECRET) {
    sponsorKeypair = Keypair.fromSecret(process.env.STELLAR_SPONSOR_SECRET)
  } else {
    // Generate an ephemeral keypair for demonstration
    sponsorKeypair = Keypair.random()
    // Fund with Friendbot
    await server.friendbot(sponsorKeypair.publicKey()).call()

    // Add USDC trustline
    const sponsorAccount = await server.loadAccount(sponsorKeypair.publicKey())
    const trustlineTx = new TransactionBuilder(sponsorAccount, {
      fee: "100",
      networkPassphrase: "Test SDF Network ; September 2015",
    })
      .addOperation(
        Operation.changeTrust({
          asset: new Asset(TESTNET_USDC_CODE, TESTNET_USDC_ISSUER),
        })
      )
      .setTimeout(30)
      .build()

    trustlineTx.sign(sponsorKeypair)
    await server.submitTransaction(trustlineTx)
  }

  const account = await server.loadAccount(sponsorKeypair.publicKey())
  const usdcAsset = new Asset(TESTNET_USDC_CODE, TESTNET_USDC_ISSUER)

  const paymentTx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: "Test SDF Network ; September 2015",
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: usdcAsset,
        amount: amount,
      })
    )
    .addMemo(Memo.text(memoText))
    .setTimeout(30)
    .build()

  paymentTx.sign(sponsorKeypair)
  const result = await server.submitTransaction(paymentTx)

  return {
    success: true,
    hash: result.hash,
    ledger: result.ledger,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
  }
}
