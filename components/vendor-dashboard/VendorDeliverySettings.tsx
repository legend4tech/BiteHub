"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin, Save, Undo, AlertCircle } from "lucide-react"
import { Landmark, SubLandmark } from "@/components/admin/AdminDeliveryZones"
import { FetchError } from "@/components/shared/FetchError"
import { Skeleton } from "@/components/ui/skeleton"

interface DeliverySettingsResponse {
  landmarks: Landmark[]
  overrides: {
    landmarks: { landmarkId: string; fee: number }[]
    subLandmarks: { subLandmarkId: string; fee: number }[]
  }
}

export function VendorDeliverySettings() {
  const queryClient = useQueryClient()

  const [localLandmarkOverrides, setLocalLandmarkOverrides] = useState<
    Record<string, number | "">
  >({})
  const [localSubLandmarkOverrides, setLocalSubLandmarkOverrides] = useState<
    Record<string, number | "">
  >({})

  const { data, isPending, isError, refetch } =
    useQuery<DeliverySettingsResponse>({
      queryKey: ["vendor-delivery-settings"],
      queryFn: async () => {
        const res = await apiClient.get("/vendor/delivery-settings")
        const d = res.data

        // Initialize local state with saved overrides
        const initialLm: Record<string, number> = {}
        d.overrides.landmarks.forEach(
          (o: { landmarkId: string; fee: number }) =>
            (initialLm[o.landmarkId] = o.fee)
        )
        setLocalLandmarkOverrides(initialLm)

        const initialSub: Record<string, number> = {}
        d.overrides.subLandmarks.forEach(
          (o: { subLandmarkId: string; fee: number }) =>
            (initialSub[o.subLandmarkId] = o.fee)
        )
        setLocalSubLandmarkOverrides(initialSub)

        return d
      },
      refetchOnWindowFocus: false,
    })

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Clean up empty strings before sending
      const landmarkOverrides = Object.entries(localLandmarkOverrides)
        .filter(([_, v]) => v !== "")
        .map(([landmarkId, fee]) => ({ landmarkId, fee }))

      const subLandmarkOverrides = Object.entries(localSubLandmarkOverrides)
        .filter(([_, v]) => v !== "")
        .map(([subLandmarkId, fee]) => ({ subLandmarkId, fee }))

      return apiClient.put("/vendor/delivery-settings", {
        landmarkOverrides,
        subLandmarkOverrides,
      })
    },
    onSuccess: () => {
      toast.success("Delivery settings saved successfully")
      queryClient.invalidateQueries({ queryKey: ["vendor-delivery-settings"] })
    },
    onError: () => toast.error("Failed to save delivery settings"),
  })

  const handleSave = () => {
    saveMutation.mutate()
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <FetchError
          title="Couldn't load delivery settings"
          onRetry={() => refetch()}
          size="md"
        />
      </div>
    )
  }

  const landmarks = data?.landmarks || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Delivery Pricing
          </h2>
          <p className="text-muted-foreground">
            Override the default platform delivery fees for your campus.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {landmarks.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <h3 className="text-lg font-medium">No Landmarks Found</h3>
            <p className="text-muted-foreground">
              The platform admin has not set up any landmarks for your campus
              yet.
            </p>
          </div>
        ) : (
          landmarks.map((lm) => {
            const hasOverride =
              localLandmarkOverrides[lm.id] !== undefined &&
              localLandmarkOverrides[lm.id] !== ""

            return (
              <div
                key={lm.id}
                className={`overflow-hidden rounded-xl border bg-card transition-all ${hasOverride ? "border-primary/30 shadow-sm ring-1 ring-primary/20" : "shadow-sm"}`}
              >
                <div
                  className={`flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center ${lm.subLandmarks.length > 0 ? "border-b border-border/50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-xl p-3 transition-colors ${hasOverride ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-primary/10 text-primary"}`}
                    >
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{lm.name}</h3>
                        {hasOverride && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                            Custom Price
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Platform Default:{" "}
                        <span className="font-medium text-foreground">
                          ₦{lm.defaultDeliveryFee}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="relative w-32">
                      <span
                        className={`absolute top-1/2 left-3 -translate-y-1/2 text-sm ${hasOverride ? "font-bold text-primary" : "text-muted-foreground"}`}
                      >
                        ₦
                      </span>
                      <Input
                        type="number"
                        placeholder={`${lm.defaultDeliveryFee}`}
                        value={localLandmarkOverrides[lm.id] ?? ""}
                        onChange={(e) =>
                          setLocalLandmarkOverrides({
                            ...localLandmarkOverrides,
                            [lm.id]: e.target.value
                              ? Number(e.target.value)
                              : "",
                          })
                        }
                        className={`pl-7 transition-colors ${hasOverride ? "border-primary bg-primary/5 font-bold text-primary ring-primary/20" : ""}`}
                      />
                    </div>
                    {hasOverride ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          const newOverrides = { ...localLandmarkOverrides }
                          delete newOverrides[lm.id]
                          setLocalLandmarkOverrides(newOverrides)
                        }}
                      >
                        <Undo className="size-4" />
                      </Button>
                    ) : (
                      <div className="w-9" /> /* Spacer to keep alignment */
                    )}
                  </div>
                </div>

                {lm.subLandmarks.length > 0 && (
                  <div className="bg-muted/10 p-5">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      Sub-Locations
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        {lm.subLandmarks.length}
                      </span>
                    </h4>
                    <div className="grid gap-2">
                      {lm.subLandmarks.map((sub) => {
                        const hasSubOverride =
                          localSubLandmarkOverrides[sub.id] !== undefined &&
                          localSubLandmarkOverrides[sub.id] !== ""
                        const parentEffectiveFee = hasOverride
                          ? localLandmarkOverrides[lm.id]
                          : lm.defaultDeliveryFee
                        const subDefaultFee =
                          sub.defaultDeliveryFee || parentEffectiveFee

                        return (
                          <div
                            key={sub.id}
                            className={`flex items-center justify-between rounded-lg p-3 transition-colors ${hasSubOverride ? "border border-primary/20 bg-primary/5" : "border border-border/50 bg-card hover:bg-accent/50"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${hasSubOverride ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" : "bg-muted-foreground/30"}`}
                              />
                              <div>
                                <span
                                  className={`text-sm font-medium ${hasSubOverride ? "text-primary" : "text-foreground"}`}
                                >
                                  {sub.name}
                                </span>
                                <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                                  Default: ₦{subDefaultFee}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative w-28">
                                <span
                                  className={`absolute top-1/2 left-2.5 -translate-y-1/2 text-xs ${hasSubOverride ? "font-bold text-primary" : "text-muted-foreground"}`}
                                >
                                  ₦
                                </span>
                                <Input
                                  type="number"
                                  className={`h-8 pl-6 text-xs transition-colors ${hasSubOverride ? "border-primary bg-background font-bold text-primary ring-primary/20" : "bg-background"}`}
                                  placeholder={`${subDefaultFee}`}
                                  value={
                                    localSubLandmarkOverrides[sub.id] ?? ""
                                  }
                                  onChange={(e) =>
                                    setLocalSubLandmarkOverrides({
                                      ...localSubLandmarkOverrides,
                                      [sub.id]: e.target.value
                                        ? Number(e.target.value)
                                        : "",
                                    })
                                  }
                                />
                              </div>
                              {hasSubOverride ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => {
                                    const newOverrides = {
                                      ...localSubLandmarkOverrides,
                                    }
                                    delete newOverrides[sub.id]
                                    setLocalSubLandmarkOverrides(newOverrides)
                                  }}
                                >
                                  <Undo className="size-3" />
                                </Button>
                              ) : (
                                <div className="w-8" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
