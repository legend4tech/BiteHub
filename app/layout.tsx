import { Bricolage_Grotesque, Inter, Geist_Mono } from "next/font/google"

import "./globals.css"

import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { CampusProvider } from "@/components/providers/CampusProvider";

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
            <CampusProvider>
              {children}
              <Toaster position="top-right" richColors closeButton expand />
            </CampusProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
