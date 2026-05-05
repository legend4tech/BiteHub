"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, buildOrderWhatsAppMessage } from "@/lib/constants";

interface WhatsAppButtonProps {
  vendorPhone: string;
  order: {
    orderId: string;
    customerName: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    notes?: string;
  };
  className?: string;
  size?: "default" | "xl";
}

export function WhatsAppButton({
  vendorPhone,
  order,
  className,
  size = "xl",
}: WhatsAppButtonProps) {
  const handleClick = () => {
    const message = buildOrderWhatsAppMessage(order);
    const link = buildWhatsAppLink(vendorPhone, message);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      onClick={handleClick}
      size={size}
      className={`bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0 ${className ?? ""}`}
    >
      <MessageCircle className="size-5" />
      Chat vendor on WhatsApp
    </Button>
  );
}
