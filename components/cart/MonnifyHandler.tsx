"use client"
import { useEffect } from "react"
import Script from "next/script"
interface MonnifyConfig {
  amount: number
  currency: string
  reference: string
  customerName: string
  customerEmail: string
  apiKey: string
  contractCode: string
  paymentDescription: string
  incomeSplitConfig?: Array<{
    subAccountCode: string
    splitPercentage?: number
    feeBearer: boolean
  }>
  metadata?: Record<string, unknown>
}
interface MonnifyHandlerProps {
  config: MonnifyConfig
  onSuccess: (reference: string) => void
  onClose: () => void
}
declare global {
  interface Window {
    MonnifySDK?: {
      initialize: (config: Record<string, unknown>) => void
    }
  }
}
export default function MonnifyHandler({
  config,
  onSuccess,
  onClose,
}: MonnifyHandlerProps) {
  const initMonnify = () => {
    if (window.MonnifySDK) {
      window.MonnifySDK.initialize({
        amount: config.amount,
        currency: config.currency,
        reference: config.reference,
        customerFullName: config.customerName,
        customerEmail: config.customerEmail,
        apiKey: config.apiKey,
        contractCode: config.contractCode,
        paymentDescription: config.paymentDescription,
        incomeSplitConfig: config.incomeSplitConfig,
        metadata: config.metadata,
        onLoadStart: () => {},
        onLoadComplete: () => {},
        onComplete: function (response: { paymentReference?: string }) {
          onSuccess(response.paymentReference || config.reference)
        },
        onClose: function () {
          onClose()
        },
      })
    } else {
      console.error("MonnifySDK not loaded")
      onClose()
    }
  }
  useEffect(() => {
    if (window.MonnifySDK) {
      initMonnify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])
  return (
    <Script
      src="https://sdk.monnify.com/plugin/monnify.js"
      strategy="afterInteractive"
      onLoad={initMonnify}
    />
  )
}
