import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AllProducts } from "@/components/landing/AllProducts";
import { FeaturedVendors } from "@/components/landing/FeaturedVendors";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { VendorCTA } from "@/components/landing/VendorCTA";
import { Footer } from "@/components/Footer";

import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "CampusBites — Campus food, delivered fast",
  description:
    "Discover the best campus vendors at COOU Uli, browse menus and order food in seconds — all from one app.",
  openGraph: {
    title: "CampusBites — Campus food, delivered fast",
    description: "Order from your favorite campus kitchens in seconds.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <AllProducts />
      <FeaturedVendors />
      <HowItWorks />
      <VendorCTA />
      <Footer />
    </main>
  );
}
