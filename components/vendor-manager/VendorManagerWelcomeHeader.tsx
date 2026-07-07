"use client"

import { useSession } from "next-auth/react"

export function VendorManagerWelcomeHeader() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Vendor Manager"

  return (
    <div className="mb-8">
      <h1 className="font-heading text-3xl font-bold">
        Welcome back, <span className="text-primary">{userName}</span>!
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Here is what is happening across your managed vendors today.
      </p>
    </div>
  )
}
