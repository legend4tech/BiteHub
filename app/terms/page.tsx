import { Metadata } from "next"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { APP_NAME } from "@/lib/constants"
import { getPlatformFeePercentage } from "@/lib/fees"

export const metadata: Metadata = {
  title: `Terms of Use | ${APP_NAME}`,
  description: `Terms of Use for ${APP_NAME}`,
}

export default async function TermsOfUsePage() {
  const lastUpdated = "May 2026"
  const platformFeePercentage = await getPlatformFeePercentage()

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
              Terms of <span className="text-primary">Use</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                By accessing or using {APP_NAME} (&quot;the Platform&quot;), you
                agree to be bound by these Terms of Use. If you do not agree
                with any part of these terms, you may not use our services.
                These terms apply to all users, including students, customers,
                and independent food vendors.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                2. Description of Service
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {APP_NAME} acts solely as an intermediary online marketplace
                that connects campus students and customers with independent
                local food vendors. We provide the technology to facilitate
                ordering and notifications, but we do not prepare, package,
                handle, or deliver the food ourselves.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                3. User Accounts & Responsibilities
              </h2>
              <ul className="list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
                <li>
                  You must provide accurate and complete information when
                  creating an account or placing an order.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your account credentials.
                </li>
                <li>
                  You agree not to use the Platform for any fraudulent or
                  unlawful purposes, including placing fake orders.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                4. Vendor Independence & Liability
              </h2>
              <p className="mb-2 leading-relaxed text-muted-foreground">
                All food vendors listed on {APP_NAME} are independent entities
                and are not employees, agents, or representatives of {APP_NAME}.
                Therefore:
              </p>
              <ul className="list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
                <li>
                  <strong>Food Quality & Safety:</strong> The vendor is solely
                  responsible for the quality, safety, and hygiene of the food
                  provided. {APP_NAME} disclaims any liability for illness,
                  allergic reactions, or dissatisfaction arising from the food.
                </li>
                <li>
                  <strong>Delivery & Timeliness:</strong> Delivery times are
                  estimates. Vendors are responsible for fulfilling and
                  delivering the orders in a timely manner.
                </li>
                <li>
                  <strong>Disputes:</strong> Any disputes regarding food
                  quality, missing items, or refunds must be resolved directly
                  between the customer and the vendor.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                5. Payments, Fees, & Split Settlements
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                All financial transactions on {APP_NAME} are conducted securely
                through our payment gateway partner, Paystack.
              </p>
              <ul className="list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">
                <li>
                  <strong>Customer Service Fee:</strong> Orders are subject to a
                  processing service charge calculated at checkout. This fee
                  covers payment gateway costs and platform processing overhead.
                </li>
                <li>
                  <strong>Platform Commissions:</strong> A platform fee
                  percentage (currently {platformFeePercentage}%, unless
                  otherwise configured via administration settings) is charged
                  on the subtotal of every order. This commission is
                  transparently calculated and deducted prior to vendor
                  disbursement.
                </li>
                <li>
                  <strong>Automated Split Payouts:</strong> Vendor payouts are
                  executed automatically via Paystack Split Settlements.
                  Earnings (subtotal minus platform commission) are routed
                  directly to the vendor&apos;s registered bank account on a
                  standard T+1 business day cycle (Transaction day + 1 business
                  day, meaning earnings from a transaction are settled into the
                  bank account on the next business day).
                </li>
                <li>
                  <strong>Idempotency and Payment Safety:</strong> Transactions
                  are audited and locked using secure cryptographically verified
                  verification handlers to prevent double-charging or duplicate
                  fulfillment dispatches.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                6. Communications & WhatsApp
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                By providing your phone number and placing an order, you consent
                to receive automated order updates, notifications, and
                communications from {APP_NAME} via WhatsApp. Standard data rates
                may apply.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                7. Modifications to the Service
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                We reserve the right to modify or discontinue, temporarily or
                permanently, the Platform (or any part of it) with or without
                notice. We shall not be liable to you or any third party for any
                modification, suspension, or discontinuance of the service.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                8. Contact Information
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have any questions about these Terms of Use, please
                contact us at:
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
