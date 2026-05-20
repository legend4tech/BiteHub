export interface CampusConfig {
  id: string;
  name: string;
}

export interface SchoolConfig {
  id: string;
  name: string;
  campuses: CampusConfig[];
}

// ─── Central Configuration ────────────────────────────────────────────────────
// Add future schools and campuses here to scale the platform.

export const SCHOOL_CAMPUS_CONFIG: Record<string, SchoolConfig> = {
  coou: {
    id: "coou",
    name: "COOU",
    campuses: [
      { id: "uli", name: "Uli Campus" },
      { id: "igbariam", name: "Igbariam Campus" },
    ],
  },
  // Example for future scale:
  // unizik: {
  //   id: "unizik",
  //   name: "UNIZIK",
  //   campuses: [
  //     { id: "awka", name: "Awka Campus" },
  //     { id: "nnewi", name: "Nnewi Campus" },
  //   ],
  // },
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SCHOOL_ID = "coou";
export const DEFAULT_CAMPUS_ID = "uli";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getSchoolOptions() {
  return Object.values(SCHOOL_CAMPUS_CONFIG).map((school) => ({
    value: school.id,
    label: school.name,
  }));
}

export function getCampusOptions(schoolId: string) {
  const school = SCHOOL_CAMPUS_CONFIG[schoolId];
  if (!school) return [];
  return school.campuses.map((campus) => ({
    value: campus.id,
    label: campus.name,
  }));
}

export function getSchoolName(schoolId: string): string {
  return SCHOOL_CAMPUS_CONFIG[schoolId]?.name || schoolId;
}

export function getCampusName(schoolId: string, campusId: string): string {
  const school = SCHOOL_CAMPUS_CONFIG[schoolId];
  if (!school) return campusId;
  const campus = school.campuses.find((c) => c.id === campusId);
  return campus?.name || campusId;
}
