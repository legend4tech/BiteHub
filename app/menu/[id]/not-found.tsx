import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { EmptyState } from "@/components/shared/EmptyState"

export default function MenuNotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <EmptyState
            title="Menu Item Not Found"
            description="The menu item you're looking for doesn't exist, has been removed, or is currently unavailable."
            action={{ label: "View all menus", href: "/menus" }}
          />
        </div>
      </div>
      <Footer />
    </main>
  )
}
