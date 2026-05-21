import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Geist_Mono } from "next/font/google"

import "./globals.css"

import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { CampusProvider } from "@/components/providers/CampusProvider";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "BiteHub",
  description: "Order food from your campus vendors, fast and easy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BiteHub",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        inter.variable,
        bricolage.variable,
        fontMono.variable,
        "font-sans",
      )}
    >
      <body suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <Suspense fallback={null}>
              <CampusProvider>
                {children}
                <Toaster position="top-right" richColors closeButton expand />
              </CampusProvider>
            </Suspense>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
