import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Gift, Coins, Trophy, Clock } from "lucide-react"

export default async function CustomerRewardsPage() {
  const session = await auth()
  if (!session?.user?.email || session.user.role !== "customer") {
    redirect("/customer/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Rewards & Coins</h1>
        <p className="text-muted-foreground">
          Earn BiteHub Coins on every order and redeem them for free meals.
        </p>
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
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
            <Gift className="size-5 text-primary" /> How to Earn
          </h3>

          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  1
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Order Food
                </p>
                <p className="text-xs text-muted-foreground">
                  Get 1% cashback in BHC on every order you place.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  2
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Refer Friends
                </p>
                <p className="text-xs text-muted-foreground">
                  Earn 500 BHC when your friend places their first order.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  3
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Leave Reviews
                </p>
                <p className="text-xs text-muted-foreground">
                  Get 50 BHC for leaving a helpful review with a photo.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Reward History */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-bold">Reward History</h2>

        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <Clock className="size-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No rewards history yet. Start ordering to earn coins!
          </p>
        </div>
      </div>
    </div>
  )
}
