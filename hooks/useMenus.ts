import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import { MenuItem } from "@/types/vendor"

export function useMenus() {
  return useQuery<MenuItem[]>({
    queryKey: ["menus"],
    queryFn: async () => {
      const response = await apiClient.get("/menus")
      return response.data
    },
  })
}
