"use client"

import { motion } from "framer-motion"
import { Mail, ServerCog } from "lucide-react"

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-secondary/30 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex max-w-2xl flex-col items-center rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12"
      >
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.02, 0.98, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
        >
          <ServerCog className="h-12 w-12 text-primary-foreground" />
        </motion.div>

        <h1 className="mb-4 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          We&apos;ll be right back.
        </h1>

        <p className="mb-10 max-w-md text-lg leading-relaxed text-muted-foreground">
          BiteHub is currently undergoing scheduled maintenance to improve your
          experience. Our team is working hard behind the scenes!
        </p>

        <a
          href="mailto:contact@bitehubapp.com"
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
        >
          <Mail className="h-5 w-5" />
          <span>Contact Us</span>
        </a>
      </motion.div>
    </main>
  )
}
