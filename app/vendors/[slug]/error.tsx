"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FetchError } from "@/components/shared/FetchError";
import { Navbar } from "@/components/Navbar";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function VendorDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[VendorDetailError]", error);
  }, [error]);

  const router = useRouter();

  const isNetworkError =
    error.message?.includes("EAI_AGAIN") ||
    error.message?.includes("MongoNetworkError") ||
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("fetch failed") ||
    error.message?.includes("Failed to fetch vendor");

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <FetchError
          size="lg"
          title={isNetworkError ? "Couldn't load this vendor" : "Something went wrong"}
          message={
            isNetworkError
              ? "We couldn't reach the server to load this vendor's profile. Check your connection and try again."
              : "An error occurred while loading this vendor page."
          }
          reasons={
            isNetworkError
              ? [
                  "Your device has no internet connection",
                  "The database server is temporarily unreachable",
                  "A firewall or VPN may be blocking the connection",
                ]
              : undefined
          }
          onRetry={reset}
          onBack={() => router.push("/vendors")}
        />
      </div>
    </main>
  );
}
