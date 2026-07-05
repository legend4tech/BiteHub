import axios from "axios"
import https from "https"

const httpsAgent = new https.Agent({ family: 4 })

export async function sendVendorOrderNotification(
  vendorPhone: string,
  customerName: string,
  orderId: string,
  totalAmount: number
) {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneNumberId) {
      console.warn(
        "WhatsApp credentials not configured in environment variables."
      )
      return
    }

    // Clean phone number (remove non-digits)
    let cleanPhone = vendorPhone.replace(/\D/g, "")

    // Fallback: If it's a local number starting with 0, default to 234
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.slice(1)
    }

    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: "new_order_alert",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "text",
                parameter_name: "order_id",
                text: orderId || "N/A",
              },
            ],
          },
          {
            type: "body",
            parameters: [
              {
                type: "text",
                parameter_name: "order_id",
                text: orderId || "N/A",
              },
              {
                type: "text",
                parameter_name: "customer_name",
                text: customerName || "Customer",
              },
              {
                type: "text",
                parameter_name: "total_amount",
                text: `NGN ${(totalAmount || 0).toLocaleString()}`,
              },
            ],
          },
        ],
      },
    }

    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        httpsAgent,
      }
    )

    const data = response.data

    console.log(
      `WhatsApp notification sent to ${cleanPhone} for order ${orderId}`
    )
    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to send WhatsApp notification:",
        error.response?.data || error.message
      )
    } else {
      console.error(
        "Failed to send WhatsApp notification:",
        error instanceof Error ? error.message : error
      )
    }
    // We don't rethrow to avoid blocking the main order placement flow
  }
}

/**
 * Sends a free-form text message via WhatsApp.
 * This can only be used if the user has messaged the business within the last 24 hours.
 */
export async function sendWhatsappText(toPhone: string, text: string) {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneNumberId) {
      console.warn(
        "WhatsApp credentials not configured in environment variables."
      )
      return
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    }

    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        httpsAgent,
      }
    )

    console.log(`WhatsApp text sent to ${toPhone}`)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to send WhatsApp text:",
        error.response?.data || error.message
      )
    } else {
      console.error(
        "Failed to send WhatsApp text:",
        error instanceof Error ? error.message : error
      )
    }
  }
}
