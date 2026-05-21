import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Login",
  description:
    "Sign in to your BiteHub vendor dashboard to manage your menu, track orders, and grow your campus food business.",
  robots: { index: false, follow: false },
};

export default function VendorLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
