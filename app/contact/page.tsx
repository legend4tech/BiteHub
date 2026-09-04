"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getCampusName,
  DEFAULT_SCHOOL_ID,
  DEFAULT_CAMPUS_ID,
} from "@/lib/config/campus"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { motion } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { toast } from "sonner"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useContactSubmit } from "@/hooks/shared/usePublicMutations"
import { CONTACT_EMAIL } from "@/lib/constants"

import { contactSchema, type ContactValues } from "@/lib/schemas"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<ContactValues>({
    resolver: zodResolver(
      contactSchema as never
    ) as unknown as Resolver<ContactValues>,
    defaultValues: { name: "", email: "", subject: "", message: "" },
    mode: "onTouched",
  })

  const contactSubmitMutation = useContactSubmit()

  const onSubmit = (values: ContactValues) => {
    setLoading(true)
    contactSubmitMutation.mutate(values, {
      onSuccess: () => {
        setSubmitted(true)
        toast.success("Message sent! We'll get back to you shortly.")
      },
      onError: (error: unknown) => {
        // Simple heuristic: if error has a response.data.message, show it
        const err = error as { response?: { data?: { message?: string } } }
        const msg =
          err.response?.data?.message ||
          "Failed to send message. Please try again."
        toast.error(msg)
      },
      onSettled: () => {
        setLoading(false)
      },
    })
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background pt-28 pb-20 text-foreground">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-64 -mr-64 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 left-0 -mb-48 -ml-48 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 font-heading text-4xl font-black tracking-tight uppercase sm:text-5xl"
            >
              Get in <span className="text-primary">Touch</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-muted-foreground"
            >
              Have a question, feedback, or need support? We&apos;re here to
              help you.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6 lg:col-span-1"
            >
              <div className="space-y-6 rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-xl">
                <h2 className="mb-4 font-heading text-xl font-bold">
                  Contact Information
                </h2>

                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Email Us</p>
                    <p className="text-sm text-muted-foreground">
                      {CONTACT_EMAIL}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We reply within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Call Us</p>
                    <p className="text-sm text-muted-foreground">
                      +234 800 CAMPUS
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mon-Fri from 8am to 5pm
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {getCampusName(DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Anambra, Nigeria
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Support Card */}
              <div className="to-primary/80/5 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 p-6 backdrop-blur-xl">
                <h3 className="mb-2 text-lg font-bold">Fastest Support</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Are you a vendor looking to join or having issues with an
                  order? Reach out directly via WhatsApp for faster resolution.
                </p>
                <Button variant="hero" className="w-full rounded-xl">
                  Message on WhatsApp
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="rounded-3xl border border-white/10 bg-card/40 p-8 backdrop-blur-xl">
                {submitted ? (
                  <div className="space-y-4 py-12 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold">
                      Message Sent!
                    </h2>
                    <p className="mx-auto max-w-md text-muted-foreground">
                      Thank you for reaching out. We have received your message
                      and will get back to you within 24 hours.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 rounded-xl"
                      onClick={() => {
                        setSubmitted(false)
                        form.reset()
                      }}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Name */}
                      <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                            <Input
                              {...field}
                              id={field.name}
                              placeholder="John Doe"
                              aria-invalid={fieldState.invalid}
                              className="h-12 rounded-xl border-white/10 bg-background/50 focus:border-primary"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />

                      {/* Email */}
                      <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                            <Input
                              {...field}
                              id={field.name}
                              type="email"
                              placeholder="john@example.com"
                              aria-invalid={fieldState.invalid}
                              className="h-12 rounded-xl border-white/10 bg-background/50 focus:border-primary"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>

                    {/* Subject */}
                    <Controller
                      name="subject"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Subject</FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            placeholder="How can we help?"
                            aria-invalid={fieldState.invalid}
                            className="h-12 rounded-xl border-white/10 bg-background/50 focus:border-primary"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {/* Message */}
                    <Controller
                      name="message"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Message</FieldLabel>
                          <Textarea
                            {...field}
                            id={field.name}
                            placeholder="Type your message here..."
                            aria-invalid={fieldState.invalid}
                            rows={8}
                            className="min-h-[160px] resize-y rounded-xl border-white/10 bg-background/50 focus:border-primary"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="hero"
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Sending…
                        </>
                      ) : (
                        <>
                          <Send className="size-4" /> Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
