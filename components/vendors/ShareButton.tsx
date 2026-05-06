"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/vendors/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Copy profile link"
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ring-2 ${
        copied
          ? "border-green-500 bg-green-50 text-green-600 ring-green-400/40 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30"
          : "border-primary/50 bg-background text-primary ring-primary/30 hover:bg-primary/5 hover:ring-primary/50"
      }`}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Link copied!
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          Share profile
        </>
      )}
    </button>
  );
}
