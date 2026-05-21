"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  DEFAULT_SCHOOL_ID,
  DEFAULT_CAMPUS_ID,
  SCHOOL_CAMPUS_CONFIG,
} from "@/lib/config/campus";

interface CampusContextType {
  schoolId: string;
  campusId: string;
  setSchoolAndCampus: (schoolId: string, campusId: string) => void;
  isLoaded: boolean;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

const LS_KEY = "bitehub_campus_preference";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateCampus(schoolId: string, campusId: string): { schoolId: string; campusId: string } {
  const school = SCHOOL_CAMPUS_CONFIG[schoolId];
  if (!school) return { schoolId: DEFAULT_SCHOOL_ID, campusId: DEFAULT_CAMPUS_ID };
  const validCampus = school.campuses.find((c) => c.id === campusId);
  return {
    schoolId,
    campusId: validCampus ? campusId : school.campuses[0].id,
  };
}

function loadFromLocalStorage(): { schoolId: string; campusId: string } | null {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed.schoolId) return null;
    return validateCampus(parsed.schoolId, parsed.campusId ?? "");
  } catch {
    return null;
  }
}

function saveToLocalStorage(schoolId: string, campusId: string) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ schoolId, campusId }));
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [schoolId, setSchoolId] = useState<string>(DEFAULT_SCHOOL_ID);
  const [campusId, setCampusId] = useState<string>(DEFAULT_CAMPUS_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // ── Priority order: URL params → localStorage → hardcoded defaults ──────
    const urlSchool = searchParams.get("school");
    const urlCampus = searchParams.get("campus");

    if (urlSchool && urlCampus) {
      // URL is authoritative — validate, apply, and persist to localStorage
      const validated = validateCampus(urlSchool, urlCampus);
      setSchoolId(validated.schoolId);
      setCampusId(validated.campusId);
      saveToLocalStorage(validated.schoolId, validated.campusId);
    } else {
      // No URL params — check localStorage and push to URL so server syncs
      const stored = loadFromLocalStorage();
      const pref = stored ?? { schoolId: DEFAULT_SCHOOL_ID, campusId: DEFAULT_CAMPUS_ID };

      setSchoolId(pref.schoolId);
      setCampusId(pref.campusId);

      // Sync URL so the server component re-renders with the correct campus.
      // Use replace (not push) to avoid polluting browser history.
      const params = new URLSearchParams(searchParams.toString());
      params.set("school", pref.schoolId);
      params.set("campus", pref.campusId);
      router.replace(`${pathname}?${params.toString()}`);
    }

    setIsLoaded(true);
    // Only run on mount — searchParams reference is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSchoolAndCampus = (newSchoolId: string, newCampusId: string) => {
    const validated = validateCampus(newSchoolId, newCampusId);
    setSchoolId(validated.schoolId);
    setCampusId(validated.campusId);
    saveToLocalStorage(validated.schoolId, validated.campusId);
  };

  return (
    <CampusContext.Provider value={{ schoolId, campusId, setSchoolAndCampus, isLoaded }}>
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (context === undefined) {
    throw new Error("useCampus must be used within a CampusProvider");
  }
  return context;
}
