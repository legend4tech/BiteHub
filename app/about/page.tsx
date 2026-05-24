"use client"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { APP_NAME } from "@/lib/constants"
import { Store, GraduationCap, Rocket, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-background pt-28 pb-20 text-foreground">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-64 -mr-64 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-1/2 left-0 -mb-48 -ml-48 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl space-y-32 px-6">
          {/* Hero Section */}
          <section className="pt-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 font-heading text-4xl font-black tracking-tight uppercase sm:text-6xl lg:text-7xl"
            >
              We Are <span className="text-primary">{APP_NAME}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Order food, drinks, and snacks from vendors on your campus without
              the stress. {APP_NAME} keeps everything in one place.
            </motion.p>
          </section>

          {/* What We Do */}
          <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
                What We <span className="text-primary">Do</span>
              </h2>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  {APP_NAME} is a campus ordering platform. Students find what
                  they want, place their order, and pick it up when it&apos;s
                  ready.
                </p>
                <p>
                  Vendors get a proper system to manage incoming orders, update
                  their menu, and keep track of everything no pen, no paper, no
                  confusion.
                </p>
                <p>
                  That&apos;s it. We&apos;re not trying to reinvent anything. We
                  just think ordering food on campus should actually work.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-border shadow-2xl lg:h-[500px]"
            >
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <Image
                src="/about-hero.png"
                alt="Students ordering food on campus"
                fill
                priority
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </motion.div>
          </section>

          {/* How It Works */}
          <section className="space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
                How It <span className="text-primary">Works</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Two sides, one platform.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Students Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />
                <GraduationCap className="mb-6 h-12 w-12 text-primary transition-transform group-hover:-translate-y-1 group-hover:scale-110" />
                <h3 className="mb-4 font-heading text-2xl font-bold">
                  For Students
                </h3>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      1
                    </span>
                    <span className="pt-0.5">
                      Pick your campus and see what vendors are available.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      2
                    </span>
                    <span className="pt-0.5">
                      Find what you want and place your order.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      3
                    </span>
                    <span className="pt-0.5">
                      Walk up and grab it when it&apos;s ready.
                    </span>
                  </li>
                </ul>
              </motion.div>

              {/* Vendors Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />
                <Store className="mb-6 h-12 w-12 text-primary transition-transform group-hover:-translate-y-1 group-hover:scale-110" />
                <h3 className="mb-4 font-heading text-2xl font-bold">
                  For Vendors
                </h3>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      1
                    </span>
                    <span className="pt-0.5">
                      Set up your store in minutes.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      2
                    </span>
                    <span className="pt-0.5">
                      Manage your menu and track every order in one place.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      3
                    </span>
                    <span className="pt-0.5">Less chaos, more sales.</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </section>

          {/* Impact */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-card/40 px-6 py-16 text-center sm:px-12 sm:py-24"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
              <Rocket className="h-[400px] w-[400px]" />
            </div>
            <div className="relative z-10 mx-auto max-w-3xl space-y-6">
              <h2 className="font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
                Where We&apos;re <span className="text-primary">Headed</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                More schools, more vendors, more options, that&apos;s where
                we&apos;re headed. The goal is simple: make campus ordering less
                stressful for everyone involved.
              </p>
            </div>
          </motion.section>

          {/* Call to Action */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pb-10 text-center"
          >
            <h2 className="mb-8 font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
              What are you <span className="text-primary">eating today?</span>
            </h2>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/menus"
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 font-bold text-white transition-all hover:-translate-y-1 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 sm:w-auto"
              >
                Browse Menus
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/#vendors"
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-transparent px-8 font-bold text-foreground transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/5 sm:w-auto"
              >
                Join as a Vendor
              </Link>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </>
  )
}
