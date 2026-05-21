import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Have a question, feedback, or need support? Reach out to the BiteHub team — we're here to help.",
  openGraph: {
    title: "Contact Us — BiteHub",
    description:
      "Have a question, feedback, or need support? Reach out to the BiteHub team — we're here to help.",
    url: "/contact",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Contact BiteHub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us — BiteHub",
    description: "Have a question or need support? Reach out to the BiteHub team.",
    images: ["/og-image.png"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
