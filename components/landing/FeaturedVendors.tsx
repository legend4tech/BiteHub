import { getFeaturedVendors } from "@/lib/services/vendorService"
import { DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID } from "@/lib/config/campus"
import { FeaturedVendorsClient } from "./FeaturedVendorsClient"

interface FeaturedVendorsProps {
  school?: string
  campus?: string
}

import type { Vendor } from "@/lib/types"

export async function FeaturedVendors({
  school = DEFAULT_SCHOOL_ID,
  campus = DEFAULT_CAMPUS_ID,
}: FeaturedVendorsProps) {
  const fetchedVendors = await getFeaturedVendors({ school, campus, limit: 4 })
  const validVendors = fetchedVendors.filter((v) => v !== null) as Vendor[]

  return (
    <FeaturedVendorsClient
      fetchedVendors={validVendors}
      school={school}
      campus={campus}
    />
  )
}
