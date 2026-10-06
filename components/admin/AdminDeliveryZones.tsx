"use client"
import { useState } from "react"
import { useAdminDeliveryZones } from "@/hooks/admin/useAdminDeliveryZones"
import type { Landmark } from "@/types/admin"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getSchoolOptions,
  getCampusOptions,
  getSchoolName,
  getCampusName,
} from "@/lib/config/campus"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Plus, Trash2, Edit2 } from "lucide-react"
import { formatPrice } from "@/lib/format"
export function AdminDeliveryZones() {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(
    null
  )
  // Modal states
  const [isLandmarkOpen, setIsLandmarkOpen] = useState(false)
  const [isSubLandmarkOpen, setIsSubLandmarkOpen] = useState(false)
  // Form states
  const [formData, setFormData] = useState({
    school: "",
    campus: "",
    name: "",
    defaultDeliveryFeeInKobo: "",
    isActive: true,
  })
  const [subFormData, setSubFormData] = useState({
    name: "",
    defaultDeliveryFeeInKobo: "",
    isActive: true,
  })
  const {
    data: landmarks = [],
    isPending: isLoading,
    saveLandmarkMutation,
    deleteLandmarkMutation,
    saveSubLandmarkMutation,
    deleteSubLandmarkMutation,
  } = useAdminDeliveryZones()
  const handleOpenLandmark = (landmark?: Landmark) => {
    if (landmark) {
      setSelectedLandmark(landmark)
      setFormData({
        school: landmark.school,
        campus: landmark.campus,
        name: landmark.name,
        defaultDeliveryFeeInKobo: String(landmark.defaultDeliveryFeeInKobo),
        isActive: landmark.isActive,
      })
    } else {
      setSelectedLandmark(null)
      setFormData({
        school: "coou", // default or previous
        campus: "uli",
        name: "",
        defaultDeliveryFeeInKobo: "",
        isActive: true,
      })
    }
    setIsLandmarkOpen(true)
  }
  const handleOpenSubLandmark = (landmark: Landmark) => {
    setSelectedLandmark(landmark)
    setSubFormData({ name: "", defaultDeliveryFeeInKobo: "", isActive: true })
    setIsSubLandmarkOpen(true)
  }
  const handleSaveLandmark = (e: React.FormEvent) => {
    e.preventDefault()
    saveLandmarkMutation.mutate(
      {
        id: selectedLandmark?.id,
        data: {
          ...formData,
          defaultDeliveryFeeInKobo: Number(formData.defaultDeliveryFeeInKobo),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            selectedLandmark ? "Landmark updated" : "Landmark created"
          )
          setIsLandmarkOpen(false)
        },
        onError: () => toast.error("Failed to save landmark"),
      }
    )
  }
  const handleSaveSubLandmark = (e: React.FormEvent) => {
    e.preventDefault()
    saveSubLandmarkMutation.mutate(
      {
        ...subFormData,
        landmarkId: selectedLandmark?.id as string,
        defaultDeliveryFeeInKobo: subFormData.defaultDeliveryFeeInKobo
          ? Number(subFormData.defaultDeliveryFeeInKobo)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Sub-Landmark created")
          setIsSubLandmarkOpen(false)
        },
        onError: () => toast.error("Failed to save sub-landmark"),
      }
    )
  }
  if (isLoading) {
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delivery Zones</h2>
          <p className="text-muted-foreground">
            Manage campuses, landmarks, and delivery fees.
          </p>
        </div>
        <Button onClick={() => handleOpenLandmark()} className="gap-2">
          <Plus className="size-4" /> Add Landmark
        </Button>
      </div>
      <div className="grid gap-6">
        {landmarks.length === 0 ? (
          <EmptyState
            title="No Landmarks"
            description="Add your first campus landmark to get started."
            action={{
              label: "Add Landmark",
              onClick: () => handleOpenLandmark(),
            }}
            className="rounded-xl border border-dashed py-12"
          />
        ) : (
          landmarks.map((lm) => (
            <div key={lm.id} className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{lm.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getSchoolName(lm.school)} -{" "}
                      {getCampusName(lm.school, lm.campus)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Default Fee</p>
                    <span className="text-sm font-medium">
                      {formatPrice(lm.defaultDeliveryFeeInKobo)}
                    </span>
                  </div>
                  <div className="ml-4 flex gap-2 border-l pl-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLandmark(lm)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <ConfirmDialog
                      title="Delete Landmark"
                      description={`Are you sure you want to delete ${lm.name}?`}
                      isDestructive
                      onConfirm={() => deleteLandmarkMutation.mutate(lm.id)}
                      trigger={
                        <Button variant="destructive" size="sm">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
              {/* Sub-Landmarks */}
              <div className="pl-14">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Sub-Landmarks
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenSubLandmark(lm)}
                    className="h-8 gap-1 text-xs"
                  >
                    <Plus className="size-3" /> Add Sub-Landmark
                  </Button>
                </div>
                {lm.subLandmarks.length > 0 ? (
                  <div className="space-y-2">
                    {lm.subLandmarks.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-lg bg-accent/30 p-3 text-sm"
                      >
                        <span>{sub.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {sub.defaultDeliveryFeeInKobo !== undefined
                              ? formatPrice(sub.defaultDeliveryFeeInKobo)
                              : `Inherits (${formatPrice(lm.defaultDeliveryFeeInKobo)})`}
                          </span>
                          <ConfirmDialog
                            title="Delete Sub-Landmark"
                            description={`Are you sure you want to delete ${sub.name}?`}
                            isDestructive
                            onConfirm={() =>
                              deleteSubLandmarkMutation.mutate(sub.id)
                            }
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-2 text-xs text-muted-foreground italic">
                    No sub-landmarks defined.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Landmark Dialog */}
      <Dialog open={isLandmarkOpen} onOpenChange={setIsLandmarkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedLandmark ? "Edit Landmark" : "Add Landmark"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLandmark} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School</Label>
                <Select
                  value={formData.school}
                  onValueChange={(val) =>
                    setFormData({ ...formData, school: val, campus: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSchoolOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campus</Label>
                <Select
                  value={formData.campus}
                  onValueChange={(val) =>
                    setFormData({ ...formData, campus: val })
                  }
                  disabled={!formData.school}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCampusOptions(formData.school).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Main Landmark Name</Label>
              <Input
                placeholder="e.g. Aso Rock"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Default Delivery Fee (₦)</Label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={formData.defaultDeliveryFeeInKobo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultDeliveryFeeInKobo: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, isActive: c })
                }
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saveLandmarkMutation.isPending}>
                {saveLandmarkMutation.isPending ? "Saving..." : "Save Landmark"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Sub-Landmark Dialog */}
      <Dialog open={isSubLandmarkOpen} onOpenChange={setIsSubLandmarkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Sub-Landmark under {selectedLandmark?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubLandmark} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Sub-Landmark Name</Label>
              <Input
                placeholder="e.g. SUG Side"
                value={subFormData.name}
                onChange={(e) =>
                  setSubFormData({ ...subFormData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Delivery Fee (₦) - Optional</Label>
              <Input
                type="number"
                placeholder="Leave blank to inherit"
                value={subFormData.defaultDeliveryFeeInKobo}
                onChange={(e) =>
                  setSubFormData({
                    ...subFormData,
                    defaultDeliveryFeeInKobo: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                If left blank, it will inherit the main landmark fee (
                {formatPrice(selectedLandmark?.defaultDeliveryFeeInKobo || 0)}).
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={subFormData.isActive}
                onCheckedChange={(c) =>
                  setSubFormData({ ...subFormData, isActive: c })
                }
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={saveSubLandmarkMutation.isPending}
              >
                {saveSubLandmarkMutation.isPending
                  ? "Saving..."
                  : "Save Sub-Landmark"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
