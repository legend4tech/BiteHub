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

  useEffect(() => {
    const sp = searchParamsRef.current
    const urlSchool = sp.get("school")
    const urlCampus = sp.get("campus")

    if (urlSchool && urlCampus) {
      const validated = validateCampus(urlSchool, urlCampus)
      setSchoolId(validated.schoolId)
      setCampusId(validated.campusId)
      saveToLocalStorage(validated.schoolId, validated.campusId)
    } else {
      const stored = loadFromLocalStorage()
      const pref = stored ?? {
        schoolId: DEFAULT_SCHOOL_ID,
        campusId: DEFAULT_CAMPUS_ID,
      }

      setSchoolId(pref.schoolId)
      setCampusId(pref.campusId)

      const params = new URLSearchParams(sp.toString())
      params.set("school", pref.schoolId)
      params.set("campus", pref.campusId)
      routerRef.current.replace(`${pathnameRef.current}?${params.toString()}`)
    }

    setIsLoaded(true)
  }, []) // Empty deps intentional — refs capture mount-time values, preventing re-runs on navigation

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
