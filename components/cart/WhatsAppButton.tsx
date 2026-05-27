"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildWhatsAppLink, buildOrderWhatsAppMessage } from "@/lib/constants"
import type { OrderStatus } from "@/lib/types"

interface WhatsAppButtonProps {
  vendorPhone: string
  order: {
    orderId: string
    customerName: string
    items: { name: string; quantity: number; price: number }[]
    total?: number
    totalAmount?: number
    notes?: string
    paymentMethod?: "paystack"
    paymentStatus?: string
  }
  status?: OrderStatus
  className?: string
  size?: "default" | "xl"
}

export function WhatsAppButton({
  vendorPhone,
  order,
  status,
  className,
  size = "xl",
}: WhatsAppButtonProps) {
  const handleClick = () => {
    let message = ""

    if (status === "pending") {
      message = `Hello! My order *${order.orderId}* is still pending. Could you please check on it?`
    } else if (status === "confirmed") {
      message = `Hello! I see my order *${order.orderId}* is confirmed. Could you give me a rough estimate of when it will be ready?`
    } else if (status === "preparing") {
      message = `Hello! I see you are preparing my order *${order.orderId}*. Thank you!`
    } else if (status === "ready") {
      message = `Hello! I see my order *${order.orderId}* is ready for pickup. I am on my way!`
    } else if (status === "completed") {
      message = `Hello! I just received my order *${order.orderId}*. Thank you so much!`
    } else {
      message = buildOrderWhatsAppMessage(order)
    }

    const link = buildWhatsAppLink(vendorPhone, message)
    window.open(link, "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      onClick={handleClick}
      size={size}
      className={`border-0 bg-[#25D366] text-white hover:bg-[#1ebe5d] ${className ?? ""}`}
    >
      <MessageCircle className="size-5" />
      {status === "pending"
        ? "Ask why still pending"
        : status === "confirmed"
          ? "Ask for ETA"
          : status === "preparing"
            ? "Say thank you"
            : status === "ready"
              ? "Say I'm on my way"
              : status === "completed"
                ? "Send a thank you"
                : "Chat vendor on WhatsApp"}
    </Button>
  )
}
