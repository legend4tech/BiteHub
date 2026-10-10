import { BroadcastForm } from "@/components/admin/broadcasts/BroadcastForm"
import { Megaphone } from "lucide-react"

export default function BroadcastPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div className="flex items-center gap-3 border-b border-border/50 pb-6">
        <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
          <Megaphone className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Send newsletters, updates, and promotions to your users directly to
            their inbox.
          </p>
        </div>
      </div>

      <BroadcastForm />
    </div>
  )
}
