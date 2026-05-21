import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track the live status of your BiteHub order. Get real-time updates from when it's confirmed to when it's ready.",
  openGraph: {
    title: "Track Your Order — BiteHub",
    description:
      "Track the live status of your BiteHub order. Get real-time updates from when it's confirmed to when it's ready.",
    url: "/order",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Track Order — BiteHub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Your Order — BiteHub",
    description: "Get real-time updates on your BiteHub order status.",
    images: ["/og-image.png"],
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
