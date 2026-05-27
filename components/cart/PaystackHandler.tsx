"use client"

import { useEffect, useRef } from "react"
import { usePaystackPayment } from "react-paystack"

interface PaystackHandlerProps {
  config: { reference: string } & Record<string, unknown>
  onSuccess: (reference: string) => void
  onClose: () => void
}

export default function PaystackHandler({
  config,
  onSuccess,
  onClose,
}: PaystackHandlerProps) {
  const initializePayment = usePaystackPayment(config)
  const lastReference = useRef<string | null>(null)

  useEffect(() => {
    if (
      config &&
      initializePayment &&
      lastReference.current !== config.reference
    ) {
      lastReference.current = config.reference
      // The react-paystack hook returns a function that triggers the popup
      // It uses window.PaystackPop.setup under the hood
      try {
        initializePayment({
          onSuccess,
          onClose,
        })
      } catch (error) {
        console.error("Failed to initialize Paystack:", error)
        onClose()
      }
    }
  }, [config, initializePayment, onSuccess, onClose])

  return null
}
