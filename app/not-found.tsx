import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { NotFoundState } from "@/components/shared/NotFoundState"

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-center justify-center py-20">
        <NotFoundState />
      </div>
      <Footer />
    </main>
  )
}
