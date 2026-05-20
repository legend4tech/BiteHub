"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMPUS_NAME } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(3, "Message is required"),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema as any),
    defaultValues: { name: "", email: "", subject: "", message: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: ContactValues) => {
    setLoading(true);
    try {
      await axios.post("/api/contact", values);
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you shortly.");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to send message. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background text-foreground pt-28 pb-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -ml-48 -mb-48" />
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-heading text-4xl sm:text-5xl font-black tracking-tight mb-4 uppercase"
            >
              Get in <span className="text-primary">Touch</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              Have a question, feedback, or need support? We're here to help you.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6 lg:col-span-1"
            >
              <div className="p-6 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl space-y-6">
                <h2 className="font-heading text-xl font-bold mb-4">Contact Information</h2>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Email Us</p>
                    <p className="text-sm text-muted-foreground">contact@bitehubapp.com</p>
                    <p className="text-xs text-muted-foreground">We reply within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Call Us</p>
                    <p className="text-sm text-muted-foreground">+234 800 CAMPUS</p>
                    <p className="text-xs text-muted-foreground">Mon-Fri from 8am to 5pm</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Location</p>
                    <p className="text-sm text-muted-foreground">{CAMPUS_NAME}</p>
                    <p className="text-xs text-muted-foreground">Anambra, Nigeria</p>
                  </div>
                </div>
              </div>

              {/* Quick Support Card */}
              <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 to-orange-600/5 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-2">Fastest Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Are you a vendor looking to join or having issues with an order? Reach out directly via WhatsApp for faster resolution.
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
              <div className="p-8 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full grid place-items-center mx-auto">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold">Message Sent!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Thank you for reaching out. We have received your message and will get back to you within 24 hours.
                    </p>
                    <Button
                      variant="outline"
                      className="rounded-xl mt-4"
                      onClick={() => {
                        setSubmitted(false);
                        form.reset();
                      }}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                              className="bg-background/50 border-white/10 focus:border-primary rounded-xl h-12"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                              className="bg-background/50 border-white/10 focus:border-primary rounded-xl h-12"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                            className="bg-background/50 border-white/10 focus:border-primary rounded-xl h-12"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                            className="bg-background/50 border-white/10 focus:border-primary rounded-xl resize-y min-h-[160px]"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="hero"
                      disabled={loading}
                      className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <><Loader2 className="size-4 animate-spin" /> Sending…</>
                        : <><Send className="size-4" /> Send Message</>}
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
  );
}
