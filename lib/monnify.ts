import axios from "axios"
import https from "https"

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ family: 4 }),
})
const MONNIFY_API_URL =
  process.env.NEXT_PUBLIC_MONNIFY_API_URL || "https://sandbox.monnify.com"
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY || ""
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY || ""
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || ""

export async function getMonnifyToken() {
  const authString = Buffer.from(
    `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`
  ).toString("base64")
  const response = await axiosInstance.post(
    `${MONNIFY_API_URL}/api/v1/auth/login`,
    {},
    {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    }
  )
  if (response.data.requestSuccessful) {
    return response.data.responseBody.accessToken
  }
  throw new Error("Failed to authenticate with Monnify")
}

export async function createMonnifySubaccount(
  bankCode: string,
  accountNumber: string,
  email: string,
  splitPercentage: number
) {
  const token = await getMonnifyToken()
  try {
    const response = await axiosInstance.post(
      `${MONNIFY_API_URL}/api/v1/sub-accounts`,
      [
        {
          currencyCode: "NGN",
          bankCode,
          accountNumber,
          email,
          defaultSplitPercentage: splitPercentage,
        },
      ],
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.data.requestSuccessful) {
      // Returns an array of created subaccounts, we only create one at a time
      return response.data.responseBody[0]
    }
    throw new Error(
      response.data.responseMessage || "Failed to create Monnify subaccount"
    )
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const responseMsg = err.response?.data?.responseMessage || ""
      if (
        !responseMsg.includes("already exists") &&
        !responseMsg.toLowerCase().includes("could not find bvn")
      ) {
        console.error(
          "MONNIFY ERROR DETAILS:",
          JSON.stringify(err.response?.data, null, 2)
        )
      }
      if (responseMsg) {
        throw new Error(`Monnify Error: ${responseMsg}`)
      }
    }
    throw err
  }
}

export async function getSubaccounts() {
  const token = await getMonnifyToken()
  try {
    const response = await axiosInstance.get(
      `${MONNIFY_API_URL}/api/v1/sub-accounts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.data.requestSuccessful) {
      return response.data.responseBody
    }
    throw new Error(
      response.data.responseMessage || "Failed to fetch Monnify subaccounts"
    )
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        "MONNIFY GET SUBACCOUNTS ERROR DETAILS:",
        JSON.stringify(err.response?.data, null, 2)
      )
      if (err.response?.data?.responseMessage) {
        throw new Error(`Monnify Error: ${err.response.data.responseMessage}`)
      }
    }
    throw err
  }
}

export async function updateMonnifySubaccount(
  subAccountCode: string,
  bankCode: string,
  accountNumber: string,
  email: string,
  splitPercentage: number
) {
  const token = await getMonnifyToken()
  try {
    const response = await axiosInstance.put(
      `${MONNIFY_API_URL}/api/v1/sub-accounts`,
      {
        subAccountCode,
        currencyCode: "NGN",
        bankCode,
        accountNumber,
        email,
        defaultSplitPercentage: splitPercentage,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.data.requestSuccessful) {
      return response.data.responseBody
    }
    throw new Error(
      response.data.responseMessage || "Failed to update Monnify subaccount"
    )
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        "MONNIFY UPDATE ERROR DETAILS:",
        JSON.stringify(err.response?.data, null, 2)
      )
      if (err.response?.data?.responseMessage) {
        throw new Error(`Monnify Error: ${err.response.data.responseMessage}`)
      }
    }
    throw err
  }
}

export async function verifyMonnifyTransaction(paymentReference: string) {
  const token = await getMonnifyToken()
  try {
    const response = await axiosInstance.get(
      `${MONNIFY_API_URL}/api/v2/merchant/transactions/query`,
      {
        params: { paymentReference },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (response.data.requestSuccessful) {
      return response.data.responseBody
    }
    throw new Error(
      response.data.responseMessage || "Failed to verify Monnify transaction"
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error(
      "[verifyMonnifyTransaction] Error:",
      axios.isAxiosError(err) ? err.response?.data : errorMsg
    )
    throw err
  }
}

export async function initMonnifyTransaction({
  amount,
  paymentReference,
  customerName,
  customerEmail,
  paymentDescription,
  vendorSubAccountCode,
  vendorSplitAmount,
  redirectUrl,
}: {
  amount: number
  paymentReference: string
  customerName: string
  customerEmail: string
  paymentDescription: string
  vendorSubAccountCode: string
  vendorSplitAmount: number
  redirectUrl: string
}) {
  const token = await getMonnifyToken()
  try {
    const response = await axiosInstance.post(
      `${MONNIFY_API_URL}/api/v1/merchant/transactions/init-transaction`,
      {
        amount,
        paymentReference,
        customerName,
        customerEmail,
        paymentDescription,
        currencyCode: "NGN",
        contractCode: MONNIFY_CONTRACT_CODE,
        redirectUrl,
        incomeSplitConfig: [
          {
            subAccountCode: vendorSubAccountCode,
            // splitAmount = vendor's exact NGN share of the BASE (food + delivery).
            // The remaining balance (customer service fee + platform commission)
            // stays with the merchant contract, from which Monnify deducts its 1.5%
            // processing fee. This ensures the customer's gross-up service fee covers
            // Monnify's charge, keeping the platform's commission clean.
            splitAmount: vendorSplitAmount,
            feeBearer: false,
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (response.data.requestSuccessful) {
      return {
        checkoutUrl: response.data.responseBody.checkoutUrl as string,
        transactionReference: response.data.responseBody
          .transactionReference as string,
      }
    }
    throw new Error(
      response.data.responseMessage || "Failed to init Monnify transaction"
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error"
    console.error(
      "[initMonnifyTransaction] Error:",
      axios.isAxiosError(err) ? err.response?.data : errorMsg
    )
    throw err
  }
}
