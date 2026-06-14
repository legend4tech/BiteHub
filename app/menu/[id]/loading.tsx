import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { PageSkeleton } from "@/components/shared/PageSkeleton"

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1 px-6 py-10 pb-32">
        <div className="mx-auto max-w-4xl">
          <PageSkeleton variant="menu-item-detail" />
        </div>
      </div>
      <Footer />
    </main>
  )
}
