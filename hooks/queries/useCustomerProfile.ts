/**
 * useCustomerProfile.ts
 *
 * React Query hook for fetching the authenticated customer's profile.
 * Uses /api/auth/session (already fetched by NextAuth on every page) to
 * determine auth status — no SessionProvider required, works on any page.
 * Guests never hit /api/customer/me.
 *
 * Used by: OrderForm (pre-fill checkout), Settings page client components.
 */

import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"

export interface CustomerProfile {
  name: string
  email: string
  phone: string
  preferredLandmark?: string
  preferredSubLandmark?: string
  preferredLocation?: string
  preferredExactLocation?: string
}

interface NextAuthSession {
  user?: {
    email?: string
    role?: string
  }
}

export function useCustomerProfile() {
  // Step 1: Read the session from the NextAuth session endpoint.
  // This is a lightweight cached GET — NextAuth already fetches it on page
  // load, so this costs nothing extra. No SessionProvider needed.
  const { data: session } = useQuery<NextAuthSession>({
    queryKey: ["auth-session"],
    queryFn: () => fetch("/api/auth/session").then((r) => r.json()),
    staleTime: 60 * 1000, // 1 minute — session changes are infrequent
  })

  const isCustomer = session?.user?.role === "customer"

  // Step 2: Only fetch the profile when confirmed to be a logged-in customer.
  // enabled: false means React Query never makes the request — no 401, no loop.
  const profileQuery = useQuery<CustomerProfile>({
    queryKey: ["customer-profile"],
    queryFn: () => apiClient.get("/customer/me").then((res) => res.data),
    enabled: isCustomer,
    staleTime: 5 * 60 * 1000, // 5 minutes — profile rarely changes mid-session
  })

  return { ...profileQuery, isCustomer }
}
