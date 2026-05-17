import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Parse params from the webhook verification request
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Check if a token and mode were sent
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      // Respond with 200 OK and challenge token from the request
      return new NextResponse(challenge, { status: 200 });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is an event from a WhatsApp API
    if (body.object === "whatsapp_business_account") {
      // Loop through all entries
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Handle incoming messages
          if (value && value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              console.log(`Received incoming message from ${message.from}:`, JSON.stringify(message, null, 2));
              // TODO: Add any custom logic here, like automated replies or database updates
            }
          }

          // Handle message status updates (sent, delivered, read, failed)
          if (value && value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              console.log(`Message ${status.id} status updated to: ${status.status}`);
              // TODO: Update your database to reflect the delivery status of the message
            }
          }
        }
      }

      // Return a '200 OK' response to all requests
      // This is crucial! WhatsApp will retry if you don't respond with 200
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Error processing webhook payload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
