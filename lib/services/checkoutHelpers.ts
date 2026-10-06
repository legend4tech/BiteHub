/**
 * checkoutHelpers.ts
 *
 * Helper functions extracted from checkoutService.ts to keep file sizes within
 * the 450-line limit mandated by the contributor guide.
 */

export async function sendCheckoutNotifications({
  paymentMethod,
  customerEmail,
  customerName,
  customerPhone,
  orderId,
  finalVendorName,
  finalTotalInKobo,
  deliveryFeeInKobo,
  serviceFeeInKobo,
  discountAmountInKobo,
  vendorRevenueInKobo,
  platformCommissionInKobo,
  items,
  redirectUrl,
  finalWhatsapp,
  vendorId,
  location,
  notes,
  customerForWallet,
}: {
  paymentMethod: string
  customerEmail: string
  customerName: string
  customerPhone: string
  orderId: string
  finalVendorName: string
  finalTotalInKobo: number
  deliveryFeeInKobo: number
  serviceFeeInKobo: number
  discountAmountInKobo: number
  vendorRevenueInKobo: number
  platformCommissionInKobo: number
  items: { name: string; quantity: number; priceInKobo: number }[]
  redirectUrl: string
  finalWhatsapp?: string | null
  vendorId: unknown
  location: string
  notes?: string | null
  customerForWallet?: unknown
}) {
  if (paymentMethod === "wallet" && customerForWallet) {
    const { sendOrderReceiptEmail, sendVendorNewOrderEmail } =
      await import("@/lib/mail")
    const { sendVendorOrderNotification } = await import("@/lib/whatsapp")

    sendOrderReceiptEmail(
      customerEmail,
      customerName,
      orderId,
      finalVendorName,
      finalTotalInKobo,
      deliveryFeeInKobo,
      serviceFeeInKobo,
      items,
      redirectUrl,
      paymentMethod,
      discountAmountInKobo
    ).catch(console.error)

    if (finalWhatsapp) {
      sendVendorOrderNotification(
        finalWhatsapp,
        customerName,
        orderId,
        vendorRevenueInKobo
      ).catch(console.error)
    }

    sendVendorNewOrderEmail(
      String(vendorId),
      finalVendorName,
      orderId,
      customerName,
      customerPhone,
      location,
      items,
      deliveryFeeInKobo,
      serviceFeeInKobo,
      finalTotalInKobo,
      vendorRevenueInKobo,
      platformCommissionInKobo,
      notes || undefined
    ).catch(console.error)
  } else {
    const { sendOrderInitiatedEmail } = await import("@/lib/mail")
    sendOrderInitiatedEmail(
      customerEmail,
      customerName,
      orderId,
      finalVendorName,
      finalTotalInKobo,
      redirectUrl
    ).catch(console.error)
  }
}

export function validateCustomerCheckoutStatus(
  existingCustomer: unknown,
  customerEmail: string,
  session: { user?: { role?: string; email?: string | null } } | null
) {
  if (existingCustomer) {
    const isCustomerRole = session?.user?.role === "customer"
    const isAuthenticatedCustomer =
      isCustomerRole &&
      session.user?.email?.toLowerCase() === customerEmail.toLowerCase()

    const isOwnEmailDifferentRole =
      session?.user &&
      session.user.role !== "customer" &&
      session.user.email?.toLowerCase() === customerEmail.toLowerCase()

    if (!isAuthenticatedCustomer && !isOwnEmailDifferentRole) {
      const hasPassword = !!(existingCustomer as { password?: string }).password
      return {
        error: hasPassword
          ? "An account with this email exists. Please log in to continue."
          : "Please create a free BiteHub account to continue ordering.",
        requiresLogin: true,
        requiresSignup: !hasPassword,
        status: 401,
      }
    }
  }
  return null
}
