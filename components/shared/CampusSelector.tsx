"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useCampus } from "@/components/providers/CampusProvider";
import { getSchoolName, getCampusName, getSchoolOptions, getCampusOptions } from "@/lib/config/campus";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";


export function CampusSelector() {
  const { schoolId, campusId, setSchoolAndCampus, isLoaded } = useCampus();
  const [isOpen, setIsOpen] = useState(false);
  const [isSchoolSelectOpen, setIsSchoolSelectOpen] = useState(false);
  const [isCampusSelectOpen, setIsCampusSelectOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for the dropdown form
  const [localSchool, setLocalSchool] = useState(schoolId);
  const [localCampus, setLocalCampus] = useState(campusId);

  // Sync local state when global state loads
  useEffect(() => {
    setLocalSchool(schoolId);
    setLocalCampus(campusId);
  }, [schoolId, campusId]);

  // Click outside to close — but NOT when a Radix Select portal is open
  // (Select renders outside the DOM tree so mousedown on it looks like "outside")
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isSchoolSelectOpen || isCampusSelectOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isSchoolSelectOpen, isCampusSelectOpen]);

  if (!isLoaded) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-32 rounded-xl animate-pulse bg-muted/50" />
    );
  }

  const handleApply = () => {
    setSchoolAndCampus(localSchool, localCampus);

    // Always push school/campus into the URL so every server page
    // re-fetches with the correct filter on navigation or refresh.
    // Pages that don't use these params simply ignore them.
    const params = new URLSearchParams(searchParams.toString());
    params.set("school", localSchool);
    params.set("campus", localCampus);
    router.push(`${pathname}?${params.toString()}`);

    setIsOpen(false);
  };

  const handleSchoolChange = (val: string) => {
    setLocalSchool(val);
    const campuses = getCampusOptions(val);
    if (campuses.length > 0) {
      setLocalCampus(campuses[0].value);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 rounded-xl border border-border/50 bg-background/50 backdrop-blur hover:bg-muted/50 transition-colors gap-2"
      >
        <MapPin className="size-4 text-primary" />
        <span className="hidden sm:inline font-medium text-sm">
          {getSchoolName(schoolId)} <span className="text-muted-foreground font-normal">({getCampusName(schoolId, campusId)})</span>
        </span>
        <span className="sm:hidden font-medium text-sm">
          {getCampusName(schoolId, campusId)}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-card border border-border rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Showing vendors & menus for:</p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                School
              </label>
              <Select value={localSchool} onValueChange={handleSchoolChange} onOpenChange={setIsSchoolSelectOpen}>
                <SelectTrigger className="w-full h-10 rounded-xl bg-background">
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Campus
              </label>
              <Select value={localCampus} onValueChange={setLocalCampus} onOpenChange={setIsCampusSelectOpen}>
                <SelectTrigger className="w-full h-10 rounded-xl bg-background">
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

            <Button onClick={handleApply} className="w-full rounded-xl h-10 font-bold" variant="hero">
              Apply Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

