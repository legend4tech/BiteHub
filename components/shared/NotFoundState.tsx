"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

interface NotFoundStateProps {
  title?: string
  description?: string
  returnLink?: string
  returnLabel?: string
}

export function NotFoundState({
  title = "Page not found",
  description = "Oops! We couldn't find the page you were looking for. It might have been moved or doesn't exist.",
  returnLink = "/",
  returnLabel = "Back to home",
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mx-auto w-full max-w-md"
      >
        <div className="relative mb-6 flex justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-[80px]" />
          <h1 className="relative z-10 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-8xl font-black text-transparent select-none md:text-9xl">
            404
          </h1>
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 font-heading text-2xl font-bold md:text-3xl"
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-8 max-w-sm text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            asChild
            variant="hero"
            size="lg"
            className="w-full rounded-xl shadow-lg shadow-primary/20 sm:w-auto"
          >
            <Link href={returnLink}>
              <ArrowLeft className="mr-2 size-4" />
              {returnLabel}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full rounded-xl sm:w-auto"
          >
            <Link href="/">
              <Home className="mr-2 size-4" />
              Browse Campus Food
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
