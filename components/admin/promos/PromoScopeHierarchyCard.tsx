"use client"

import { useQuery } from "@tanstack/react-query"
import { useAdminVendors } from "@/hooks/admin/useAdminVendors"
import {
  getSchoolOptions,
  getCampusOptions,
  getSchoolName,
} from "@/lib/config/campus"
import apiClient from "@/lib/axios"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Globe,
  School,
  MapPin,
  Store,
  UtensilsCrossed,
  Loader2,
} from "lucide-react"

interface PromoScopeHierarchyCardProps {
  targetSchool?: string | null
  targetCampus?: string | null
  targetVendorId?: string | null
  targetMenuItemId?: string | null
  onChange: (fields: {
    targetSchool?: string | null
    targetCampus?: string | null
    targetVendorId?: string | null
    targetMenuItemId?: string | null
  }) => void
}

interface MenuItemOption {
  id: string
  _id?: string
  name: string
  priceInKobo: number
}

export function PromoScopeHierarchyCard({
  targetSchool,
  targetCampus,
  targetVendorId,
  targetMenuItemId,
  onChange,
}: PromoScopeHierarchyCardProps) {
  const { data: vendors, isLoading: isVendorsLoading } = useAdminVendors()

  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery<
    MenuItemOption[]
  >({
    queryKey: ["admin-menus-by-vendor", targetVendorId],
    queryFn: async () => {
      if (!targetVendorId) return []
      const res = await apiClient.get<
        Array<{ id?: string; _id?: string; name: string; priceInKobo: number }>
      >(`/menus?vendorId=${targetVendorId}&limit=100`)
      return (res.data || []).map((m) => ({
        id: String(m.id || m._id),
        _id: String(m.id || m._id),
        name: m.name,
        priceInKobo: m.priceInKobo,
      }))
    },
    enabled: !!targetVendorId,
  })

  const schoolOptions = getSchoolOptions()
  const campusOptions = targetSchool ? getCampusOptions(targetSchool) : []

  // Filter vendors by school and/or campus if selected
  const filteredVendors = (vendors || []).filter((v) => {
    if (targetSchool && v.school !== targetSchool) return false
    if (targetCampus && v.campus !== targetCampus) return false
    return true
  })

  // Selected names for live summary
  const selectedVendor = (vendors || []).find((v) => v.id === targetVendorId)
  const selectedMeal = menuItems.find(
    (m) => m.id === targetMenuItemId || m._id === targetMenuItemId
  )

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-border/60 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Globe className="h-4 w-4 text-primary" />
            Targeting & Scope Hierarchy
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Restrict this discount to a specific institution, campus,
            restaurant, or individual meal.
          </p>
        </div>

        {/* Live Scope Badge */}
        <div>
          {targetMenuItemId && selectedMeal ? (
            <Badge
              variant="default"
              className="flex items-center gap-1.5 py-1 text-xs"
            >
              <UtensilsCrossed className="h-3 w-3" />
              Meal: {selectedMeal.name}
            </Badge>
          ) : targetVendorId && selectedVendor ? (
            <Badge
              variant="default"
              className="flex items-center gap-1.5 py-1 text-xs"
            >
              <Store className="h-3 w-3" />
              Restaurant: {selectedVendor.name} (All Meals)
            </Badge>
          ) : targetCampus ? (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 py-1 text-xs"
            >
              <MapPin className="h-3 w-3" />
              Campus: {targetCampus.toUpperCase()} (
              {getSchoolName(targetSchool || "")})
            </Badge>
          ) : targetSchool ? (
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 py-1 text-xs"
            >
              <School className="h-3 w-3" />
              School: {getSchoolName(targetSchool)} (All Campuses)
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 bg-muted/30 py-1 text-xs"
            >
              <Globe className="h-3 w-3 text-primary" />
              Platform-Wide (All Schools & Campuses)
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
        {/* Level 1: Target School */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <School className="h-3.5 w-3.5 text-muted-foreground" />
            Target School
          </Label>
          <Select
            value={targetSchool || "ALL"}
            onValueChange={(val) => {
              if (val === "ALL") {
                onChange({
                  targetSchool: null,
                  targetCampus: null,
                  targetVendorId: null,
                  targetMenuItemId: null,
                })
              } else {
                onChange({
                  targetSchool: val,
                  targetCampus: null,
                  targetVendorId: null,
                  targetMenuItemId: null,
                })
              }
            }}
          >
            <SelectTrigger className="h-10 w-full text-xs">
              <SelectValue placeholder="All Schools (Platform-Wide)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Schools (Platform-Wide)</SelectItem>
              {schoolOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 2: Target Campus */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Target Campus
          </Label>
          <Select
            disabled={!targetSchool || campusOptions.length === 0}
            value={targetCampus || "ALL"}
            onValueChange={(val) => {
              onChange({
                targetCampus: val === "ALL" ? null : val,
                targetVendorId: null,
                targetMenuItemId: null,
              })
            }}
          >
            <SelectTrigger className="h-10 w-full text-xs">
              <SelectValue
                placeholder={
                  targetSchool
                    ? "All Campuses in School"
                    : "Select School first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Campuses in School</SelectItem>
              {campusOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 3: Target Vendor */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Store className="h-3.5 w-3.5 text-muted-foreground" />
            Target Vendor / Restaurant
          </Label>
          <Select
            disabled={!targetCampus || isVendorsLoading}
            value={targetVendorId || "ALL"}
            onValueChange={(val) => {
              onChange({
                targetVendorId: val === "ALL" ? null : val,
                targetMenuItemId: null,
              })
            }}
          >
            <SelectTrigger className="h-10 w-full text-xs">
              <SelectValue
                placeholder={
                  !targetCampus
                    ? !targetSchool
                      ? "All Vendors (Platform-Wide)"
                      : "All Vendors in School"
                    : "All Vendors in Campus"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {!targetCampus
                  ? !targetSchool
                    ? "All Vendors (Platform-Wide)"
                    : "All Vendors in School"
                  : "All Vendors in Campus"}
              </SelectItem>
              {filteredVendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} ({v.campus?.toUpperCase() || v.school})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 4: Target Specific Meal */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
            Target Specific Meal Item
            {isLoadingMenu && (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
          </Label>
          <Select
            disabled={
              !targetVendorId || isLoadingMenu || menuItems.length === 0
            }
            value={targetMenuItemId || "ALL"}
            onValueChange={(val) => {
              onChange({
                targetMenuItemId: val === "ALL" ? null : val,
              })
            }}
          >
            <SelectTrigger className="h-10 w-full text-xs">
              <SelectValue
                placeholder={
                  targetVendorId
                    ? isLoadingMenu
                      ? "Loading menu items..."
                      : menuItems.length === 0
                        ? "No meals available for vendor"
                        : "All Meals from Vendor"
                    : "Select a Vendor first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Meals from Vendor</SelectItem>
              {menuItems.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} (₦{Math.round(m.priceInKobo / 100).toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Optional: If selected, the discount applies strictly to this meal
            item in the cart.
          </p>
        </div>
      </div>
    </div>
  )
}
