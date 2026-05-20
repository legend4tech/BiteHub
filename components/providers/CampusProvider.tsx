"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_SCHOOL_ID, DEFAULT_CAMPUS_ID, SCHOOL_CAMPUS_CONFIG } from "@/lib/config/campus";

interface CampusContextType {
  schoolId: string;
  campusId: string;
  setSchoolAndCampus: (schoolId: string, campusId: string) => void;
  isLoaded: boolean;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

const LS_KEY = "bitehub_campus_preference";

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [schoolId, setSchoolId] = useState<string>(DEFAULT_SCHOOL_ID);
  const [campusId, setCampusId] = useState<string>(DEFAULT_CAMPUS_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.schoolId && SCHOOL_CAMPUS_CONFIG[parsed.schoolId]) {
          setSchoolId(parsed.schoolId);
          // Check if campus is valid for this school
          const isValidCampus = SCHOOL_CAMPUS_CONFIG[parsed.schoolId].campuses.some(
            (c) => c.id === parsed.campusId
          );
          if (isValidCampus) {
            setCampusId(parsed.campusId);
          } else {
            setCampusId(SCHOOL_CAMPUS_CONFIG[parsed.schoolId].campuses[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse campus preference", e);
    }
    setIsLoaded(true);
  }, []);

  const setSchoolAndCampus = (newSchoolId: string, newCampusId: string) => {
    if (!SCHOOL_CAMPUS_CONFIG[newSchoolId]) return;
    
    // Ensure campus is valid for the selected school
    const isValidCampus = SCHOOL_CAMPUS_CONFIG[newSchoolId].campuses.some(
      (c) => c.id === newCampusId
    );
    
    const finalCampusId = isValidCampus 
      ? newCampusId 
      : SCHOOL_CAMPUS_CONFIG[newSchoolId].campuses[0].id;

    setSchoolId(newSchoolId);
    setCampusId(finalCampusId);
    
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ schoolId: newSchoolId, campusId: finalCampusId })
    );
  };

  return (
    <CampusContext.Provider
      value={{
        schoolId,
        campusId,
        setSchoolAndCampus,
        isLoaded,
      }}
    >
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
