"use client"

import React, { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/types/customer"
import { TransactionReceiptPdf } from "./TransactionReceiptPdf"

interface Props {
  transaction: Transaction
  customerName: string
}

export function DownloadReceiptButton({ transaction, customerName }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    try {
      setIsGenerating(true)
      // Dynamically import the pdf builder to avoid blocking the main thread
      const { pdf } = await import("@react-pdf/renderer")

      const blob = await pdf(
        <TransactionReceiptPdf
          transaction={transaction}
          customerName={customerName}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `receipt-${transaction.reference}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to generate PDF", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Download Receipt"
      onClick={handleDownload}
      disabled={isGenerating}
      className="hover:bg-primary/10 hover:text-primary"
    >
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
    </Button>
  )
}
