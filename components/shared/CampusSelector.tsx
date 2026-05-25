"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, ChevronDown } from "lucide-react"
import { useCampus } from "@/components/providers/CampusProvider"
import {
  getSchoolName,
  getCampusName,
  getSchoolOptions,
  getCampusOptions,
} from "@/lib/config/campus"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function CampusSelector() {
  const { schoolId, campusId, setSchoolAndCampus, isLoaded } = useCampus()
  const [isOpen, setIsOpen] = useState(false)
  const [isSchoolSelectOpen, setIsSchoolSelectOpen] = useState(false)
  const [isCampusSelectOpen, setIsCampusSelectOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local state for the dropdown form
  const [localSchool, setLocalSchool] = useState(schoolId)
  const [localCampus, setLocalCampus] = useState(campusId)

  // Sync local state when global state loads
  useEffect(() => {
    setTimeout(() => {
      setLocalSchool(schoolId)
      setLocalCampus(campusId)
    }, 0)
  }, [schoolId, campusId])

  // Click outside to close — but NOT when a Radix Select portal is open
  // (Select renders outside the DOM tree so mousedown on it looks like "outside")
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isSchoolSelectOpen || isCampusSelectOpen) return
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, isSchoolSelectOpen, isCampusSelectOpen])

  if (!isLoaded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-32 animate-pulse rounded-xl bg-muted/50"
      />
    )
  }

  const handleApply = () => {
    setSchoolAndCampus(localSchool, localCampus)

    // Always push school/campus into the URL so every server page
    // re-fetches with the correct filter on navigation or refresh.
    // Pages that don't use these params simply ignore them.
    const params = new URLSearchParams(searchParams.toString())
    params.set("school", localSchool)
    params.set("campus", localCampus)
    router.push(`${pathname}?${params.toString()}`)

    setIsOpen(false)
  }

  const handleSchoolChange = (val: string) => {
    setLocalSchool(val)
    const campuses = getCampusOptions(val)
    if (campuses.length > 0) {
      setLocalCampus(campuses[0].value)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 gap-2 rounded-xl"
      >
        <MapPin className="size-4" />
        <span className="hidden text-sm font-medium sm:inline">
          <span className="mr-1 text-xs font-normal text-muted-foreground">
            Showing:
          </span>
          {getSchoolName(schoolId)}{" "}
          <span className="font-normal text-muted-foreground">
            ({getCampusName(schoolId, campusId)})
          </span>
        </span>
        <span className="text-sm font-medium sm:hidden">
          {getCampusName(schoolId, campusId)}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] animate-in rounded-2xl border border-border bg-card p-4 shadow-xl fade-in slide-in-from-top-2 sm:right-0 sm:left-auto">
          <div className="space-y-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <MapPin className="size-3.5" />
                Filter by your campus
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Only vendors and menus near you will show up.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                School
              </label>
              <Select
                value={localSchool}
                onValueChange={handleSchoolChange}
                onOpenChange={setIsSchoolSelectOpen}
              >
                <SelectTrigger className="h-10 w-full rounded-xl bg-background">
                  <SelectValue placeholder="Select school" />
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

            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Campus
              </label>
              <Select
                value={localCampus}
                onValueChange={setLocalCampus}
                onOpenChange={setIsCampusSelectOpen}
              >
                <SelectTrigger className="h-10 w-full rounded-xl bg-background">
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {getCampusOptions(localSchool).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleApply}
              className="h-10 w-full rounded-xl font-bold"
              variant="hero"
            >
              Apply Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
