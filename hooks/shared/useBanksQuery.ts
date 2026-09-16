import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { Bank } from "@/types/shared"

export function useBanksQuery() {
  return useQuery<Bank[]>({
    queryKey: ["banks"],
    queryFn: async () => {
      const res = await axios.get("/api/banks")
      return res.data?.data || []
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
