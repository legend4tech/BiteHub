"use client";

import { useEffect } from "react";
import { FetchError } from "@/components/shared/FetchError";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Last-resort boundary — only fires if an error escapes all SectionErrorBoundaries
// (e.g. an error in the layout itself or a completely unexpected crash).
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <FetchError
        size="lg"
        title="Something went wrong"
        message="An unexpected error occurred. Please try reloading the page."
        onRetry={reset}
        onBack="/"
      />
    </div>
  );
}
