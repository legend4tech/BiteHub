import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import type { GlobalSettingsValues } from "@/lib/schemas"

export function useGlobalSettings(
  options?: Omit<
    UseQueryOptions<
      GlobalSettingsValues,
      Error,
      GlobalSettingsValues,
      string[]
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<GlobalSettingsValues, Error, GlobalSettingsValues, string[]>({
    queryKey: ["global-settings"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/settings/global")
      return res.data
    },
    ...options,
  })
}
