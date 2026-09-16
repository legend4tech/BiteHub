"use client"

import React, { useState, useEffect } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/types/customer"
import { TransactionReceiptPdf } from "./TransactionReceiptPdf"

interface Props {
  transaction: Transaction
  customerName: string
}

export function DownloadReceiptButton({ transaction, customerName }: Props) {
  // We need to delay rendering the PDFDownloadLink until the client has mounted
  // because @react-pdf/renderer uses browser APIs that cause hydration mismatch.
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Button variant="ghost" size="icon" disabled title="Download Receipt">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={
        <TransactionReceiptPdf
          transaction={transaction}
          customerName={customerName}
        />
      }
      fileName={`receipt-${transaction.reference}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant="ghost"
          size="icon"
          title="Download Receipt"
          disabled={loading}
          className="hover:bg-primary/10 hover:text-primary"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
