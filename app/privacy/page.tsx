import { Metadata } from "next"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { APP_NAME, CAMPUS_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description: `Privacy Policy for ${APP_NAME}`,
}

export default function PrivacyPolicyPage() {
  const lastUpdated = "May 2026"

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-background pt-28 pb-20 text-foreground">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-64 -mr-64 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 left-0 -mb-48 -ml-48 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <div className="mb-12">
            <h1 className="mb-4 font-heading text-4xl font-black tracking-tight uppercase sm:text-5xl">
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                1. Introduction
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                Welcome to {APP_NAME}. We respect your privacy and are committed
                to protecting your personal data. This Privacy Policy explains
                how we collect, use, and safeguard your information when you
                visit our website, use our services, or interact with our
                vendors across {CAMPUS_NAME} and other locations.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                2. Information We Collect
              </h2>
              <p className="mb-2 leading-relaxed text-muted-foreground">
                We may collect the following types of information:
              </p>
              <ul className="list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
                <li>
                  <strong>Personal Identification Data:</strong> Name, email
                  address, phone number, and account credentials.
                </li>
                <li>
                  <strong>Order Data:</strong> Details about the food you order,
                  delivery locations, and vendor preferences.
                </li>
                <li>
                  <strong>Communication Data:</strong> Messages sent between you
                  and vendors, including WhatsApp notifications.
                </li>
                <li>
                  <strong>Device Information:</strong> Basic analytics such as
                  IP addresses, browser types, and usage data to improve our
                  services.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
                <li>To process and deliver your food orders accurately.</li>
                <li>
                  To communicate with you regarding your orders (e.g., WhatsApp
                  notifications).
                </li>
                <li>
                  To provide customer support and respond to your inquiries.
                </li>
                <li>
                  To maintain, secure, and improve our platform functionality.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                4. WhatsApp Integration
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                We use the Meta WhatsApp Business API to send order updates and
                automated notifications. By providing your phone number and
                interacting with our services, you consent to receiving messages
                via WhatsApp. We do not use your phone number for unsolicited
                marketing messages without your explicit permission. All
                WhatsApp&apos;s communications are secured by WhatsApp&apos;s
                standard encryption.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                5. Data Sharing and Third Parties
              </h2>
              <p className="mb-2 leading-relaxed text-muted-foreground">
                We do not sell your personal data. We only share data with:
              </p>
              <ul className="list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
                <li>
                  <strong>Vendors:</strong> We share your name, phone number,
                  and delivery details with the specific vendor you order from.
                </li>
                <li>
                  <strong>Service Providers:</strong> We use trusted third
                  parties to host our platform, send emails, process images
                  (e.g., Cloudinary), and send notifications (e.g.,
                  Meta/WhatsApp).
                </li>
                <li>
                  <strong>Legal Requirements:</strong> If required by law or to
                  protect our legal rights.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                6. Data Security
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                We implement robust security measures to protect your personal
                information from unauthorized access, alteration, or disclosure.
                However, no internet transmission is entirely secure, and we
                cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                7. Your Rights
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                You have the right to request access to the personal data we
                hold about you, request corrections, or ask for deletion of your
                account and associated data. Please contact us to exercise these
                rights.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                8. Contact Us
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have any questions or concerns about this Privacy Policy,
                please contact us at:
                <br />
                <strong>Email:</strong> contact@bitehubapp.com
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
