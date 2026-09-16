import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Gift, Coins, Trophy, Clock, Sparkles } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default async function CustomerRewardsPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col items-start gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Loyalty Program
        </div>
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-foreground">
            Rewards & Coins
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Earn BiteHub Coins on every order and redeem them for free meals.
            Your loyalty always pays off.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Balance Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-primary/10 to-background p-8 shadow-sm md:col-span-2">
          <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-10">
            <Trophy className="size-32 text-primary" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Coins className="size-6" />
                </div>
                <p className="font-semibold text-foreground">Available Coins</p>
              </div>
              <h2 className="flex items-baseline gap-2 text-5xl font-black tracking-tight">
                0{" "}
                <span className="text-xl font-bold text-muted-foreground">
                  BHC
                </span>
              </h2>
            </div>

            <div className="mt-8">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                1 BHC = ₦1. Earn coins on every successful order!
              </p>
              <div className="flex gap-4">
                <div className="flex-1 rounded-xl border border-border bg-background/80 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Lifetime Earned
                  </p>
                  <p className="text-lg font-bold">0</p>
                </div>
                <div className="flex-1 rounded-xl border border-border bg-background/80 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Lifetime Spent
                  </p>
                  <p className="text-lg font-bold">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to earn */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gift className="size-5" />
            </div>
            <h3 className="font-heading text-xl font-bold">How to Earn</h3>
          </div>

          <ul className="space-y-3">
            <li className="group flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-border hover:bg-muted/50 hover:shadow-sm">
              <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm shadow-primary/30">
                  1
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  Order Food
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Get 1% cashback in BHC on every order you place.
                </p>
              </div>
            </li>

            <li className="group flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-border hover:bg-muted/50 hover:shadow-sm">
              <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm shadow-primary/30">
                  2
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  Refer Friends
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Earn 500 BHC when your friend places their first order.
                </p>
              </div>
            </li>

            <li className="group flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-border hover:bg-muted/50 hover:shadow-sm">
              <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm shadow-primary/30">
                  3
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  Leave Reviews
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Get 50 BHC for leaving a helpful review with a photo.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Reward History */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold">Reward History</h2>

        <EmptyState
          title="No history yet"
          description="Start ordering your favorite meals to earn coins. Your reward history will appear here."
          className="rounded-3xl border border-border bg-card shadow-sm"
        />
      </div>
    </div>
  )
}
