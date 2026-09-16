"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  DEFAULT_SCHOOL_ID,
  DEFAULT_CAMPUS_ID,
  SCHOOL_CAMPUS_CONFIG,
} from "@/lib/config/campus"
import { SS_ACCEPTED_CROSS_CAMPUS } from "@/lib/constants"
import { useCustomerProfile } from "@/hooks/customer/useCustomerProfile"

interface CampusContextType {
  schoolId: string
  campusId: string
  setSchoolAndCampus: (schoolId: string, campusId: string) => void
  isLoaded: boolean
}

const CampusContext = createContext<CampusContextType | undefined>(undefined)

const LS_KEY = "bitehub_campus_preference"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateCampus(
  schoolId: string,
  campusId: string
): { schoolId: string; campusId: string } {
  const school = SCHOOL_CAMPUS_CONFIG[schoolId]
  if (!school)
    return { schoolId: DEFAULT_SCHOOL_ID, campusId: DEFAULT_CAMPUS_ID }
  const validCampus = school.campuses.find((c) => c.id === campusId)
  return {
    schoolId,
    campusId: validCampus ? campusId : school.campuses[0].id,
  }
}

function loadFromLocalStorage(): { schoolId: string; campusId: string } | null {
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (!parsed.schoolId) return null
    return validateCampus(parsed.schoolId, parsed.campusId ?? "")
  } catch {
    return null
  }
}

function saveToLocalStorage(schoolId: string, campusId: string) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ schoolId, campusId }))
    // Also save to cookie so server components can read it without URL params
    document.cookie = `bitehub_campus_preference=${JSON.stringify({ schoolId, campusId })}; path=/; max-age=31536000`
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [schoolId, setSchoolId] = useState<string>(DEFAULT_SCHOOL_ID)
  const [campusId, setCampusId] = useState<string>(DEFAULT_CAMPUS_ID)
  const [isLoaded, setIsLoaded] = useState(false)

  // Capture initial values via refs so the effect runs once on mount
  // without eslint-disable, and without re-running on every navigation.
  const routerRef = useRef(router)
  const pathnameRef = useRef(pathname)
  const searchParamsRef = useRef(searchParams)

  const { data: profile, isCustomer } = useCustomerProfile()

  useEffect(() => {
    // We want to evaluate the source of truth carefully.
    const sp = searchParamsRef.current
    const urlSchool = sp.get("school")
    const urlCampus = sp.get("campus")
    const stored = loadFromLocalStorage()

    // If customer profile is loaded, it is the ultimate baseline.
    if (isCustomer && profile?.school && profile?.campus) {
      // If there is a URL param and it differs from profile, we let it be
      // (CampusSelector modal will ask them to confirm temporary view).
      // BUT if the URL param exactly matches what was in local storage BEFORE they logged in,
      // it's likely just a stale leftover from their guest session. We should overwrite it.
      // Actually, a simpler rock-solid rule: When profile loads, always sync it if it differs from current state,
      // unless we ALREADY accepted a temporary view (which is handled by CampusSelector).
      // Since CampusProvider initializes, let's just initialize to URL if present, otherwise Profile, otherwise Local Storage.
      // Wait, if we initialize to URL, they get the modal. That's fine!
      // But let's make sure we don't infinitely re-set it.

      // Let's check if the URL params match the stale local storage from when they were a guest.
      const isStaleUrlFromGuest =
        urlSchool &&
        stored &&
        urlSchool === stored.schoolId &&
        urlCampus === stored.campusId &&
        (urlSchool !== profile.school || urlCampus !== profile.campus)

      if (
        isStaleUrlFromGuest &&
        !sessionStorage.getItem(SS_ACCEPTED_CROSS_CAMPUS)
      ) {
        // Force their profile, ignoring the stale URL
        const validated = validateCampus(profile.school, profile.campus)
        setSchoolId(validated.schoolId)
        setCampusId(validated.campusId)
        saveToLocalStorage(validated.schoolId, validated.campusId)
      } else if (urlSchool && urlCampus) {
        const validated = validateCampus(urlSchool, urlCampus)
        setSchoolId(validated.schoolId)
        setCampusId(validated.campusId)
        saveToLocalStorage(validated.schoolId, validated.campusId)
      } else {
        const validated = validateCampus(profile.school, profile.campus)
        setSchoolId(validated.schoolId)
        setCampusId(validated.campusId)
        saveToLocalStorage(validated.schoolId, validated.campusId)
      }
    }
    // Not logged in or profile not loaded yet
    else {
      if (urlSchool && urlCampus) {
        const validated = validateCampus(urlSchool, urlCampus)
        setSchoolId(validated.schoolId)
        setCampusId(validated.campusId)
        saveToLocalStorage(validated.schoolId, validated.campusId)
      } else {
        const pref = stored ?? {
          schoolId: DEFAULT_SCHOOL_ID,
          campusId: DEFAULT_CAMPUS_ID,
        }
        setSchoolId(pref.schoolId)
        setCampusId(pref.campusId)
      }
    }

    setIsLoaded(true)
  }, [profile, isCustomer]) // Re-run if profile loads/changes

  const setSchoolAndCampus = (newSchoolId: string, newCampusId: string) => {
    const validated = validateCampus(newSchoolId, newCampusId)
    setSchoolId(validated.schoolId)
    setCampusId(validated.campusId)
    saveToLocalStorage(validated.schoolId, validated.campusId)
  }

  return (
    <CampusContext.Provider
      value={{ schoolId, campusId, setSchoolAndCampus, isLoaded }}
    >
      {children}
    </CampusContext.Provider>
  )
}

export function useCampus() {
  const context = useContext(CampusContext)
  if (context === undefined) {
    throw new Error("useCampus must be used within a CampusProvider")
  }
  return context
}
