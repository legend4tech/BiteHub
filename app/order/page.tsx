"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag } from "lucide-react";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/order/${orderId.trim()}`);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-4">
              <ShoppingBag className="size-6" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Track your order</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your Order ID to check its status
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="e.g. CB-MTY-123456"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="pl-11 rounded-xl h-12"
                required
              />
            </div>
            
            <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl font-bold">
              Track Order
            </Button>
          </form>
        </div>
      </div>

      <Footer />
    </main>
  );
}
