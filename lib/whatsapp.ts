import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({ family: 4 });

import { APP_LOGO_URL } from "@/lib/constants";

export async function sendVendorOrderNotification(
  vendorPhone: string,
  vendorName: string,
  customerName: string,
  orderId: string,
  trackingLink: string
) {
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      console.warn("WhatsApp credentials not configured in environment variables.");
      return;
    }

    // Clean phone number (remove non-digits)
    let cleanPhone = vendorPhone.replace(/\D/g, "");
    
    // Fallback: If it's a local number starting with 0, default to 234
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.slice(1);
    }

    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: "vendor_new_order_alert",
        language: { code: "en_US" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: APP_LOGO_URL,
                },
              },
            ],
          },
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "vendor_name", text: vendorName || "Vendor" },
              { type: "text", parameter_name: "customer_name", text: customerName || "Customer" },
              { type: "text", parameter_name: "order_id", text: orderId },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", parameter_name: "order_id", text: orderId },
            ],
          },
        ],
      },
    };

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
    );

    const data = response.data;

    console.log(`WhatsApp notification sent to ${cleanPhone} for order ${orderId}`);
    return data;
  } catch (error: any) {
    console.error(
      "Failed to send WhatsApp notification:",
      error.response?.data || error.message || error
    );
    // We don't rethrow to avoid blocking the main order placement flow
  }
}
