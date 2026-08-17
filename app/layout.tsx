import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Inter, Geist_Mono } from "next/font/google"

import "./globals.css"

import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { ThemeProvider } from "@/components/theme-provider"
import { CampusProvider } from "@/components/providers/CampusProvider"
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider"
import { Suspense } from "react"
import { MaintenanceGuard } from "@/components/shared/MaintenanceGuard"
import { CookieBanner } from "@/components/CookieBanner"
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner"
import { TawkToChat } from "@/components/shared/TawkToChat"

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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bitehubapp.com"

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "BiteHub — Order Campus Food, Fast & Easy",
    template: "%s | BiteHub",
  },
  description:
    "Discover campus food vendors near you, browse their menus, and place your order in seconds — all from one app.",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BiteHub",
  },
  openGraph: {
    type: "website",
    siteName: "BiteHub",
    title: "BiteHub — Order Campus Food, Fast & Easy",
    description:
      "Discover campus food vendors near you, browse their menus, and place your order in seconds — all from one app.",
    url: APP_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BiteHub — Order food from your campus vendors, fast and easy.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BiteHub — Order Campus Food, Fast & Easy",
    description:
      "Discover campus food vendors near you, browse their menus, and place your order in seconds — all from one app.",
    images: ["/og-image.png"],
  },
}

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
        "font-sans"
      )}
    >
      <body suppressHydrationWarning>
        <SmoothScrollProvider>
          <QueryProvider>
            <ThemeProvider>
              <Suspense fallback={null}>
                <CampusProvider>
                  <MaintenanceGuard>
                    {children}
                    <CookieBanner />
                    <PWAInstallBanner />
                    <TawkToChat />
                    <Toaster
                      position="top-right"
                      richColors
                      closeButton
                      expand
                    />
                  </MaintenanceGuard>
                </CampusProvider>
              </Suspense>
            </ThemeProvider>
          </QueryProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
