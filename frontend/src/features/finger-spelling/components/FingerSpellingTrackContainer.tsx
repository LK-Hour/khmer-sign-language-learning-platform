"use client";

import { useEffect } from "react";
import { fetchFsTrackUnits } from "../api/curriculum";
import {
  useFingerSpellingStore,
  type FsTrackUnit,
} from "../store";
import { useAuthStore } from "@/store/auth.store";
import FingerSpellingTrack from "./FingerSpellingTrack";

type FingerSpellingTrackContainerProps = {
  units: FsTrackUnit[];
};

/** Hydrates curriculum from the server into Zustand, then renders the track UI. */
export default function FingerSpellingTrackContainer({
  units,
}: FingerSpellingTrackContainerProps) {
  const setUnits = useFingerSpellingStore((state) => state.setUnits);
  const storedUnits = useFingerSpellingStore((state) => state.units);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user && !user.is_guest) return;

    setUnits(units);
  }, [hasHydrated, units, setUnits, user]);

  useEffect(() => {
    if (!hasHydrated || !user || user.is_guest) return;

    let ignore = false;

    async function loadUserTrack() {
      try {
        const freshUnits = await fetchFsTrackUnits();
        if (!ignore) setUnits(freshUnits);
      } catch {
        // Keep the server-rendered fallback if the user-specific refresh fails.
      }
    }

    void loadUserTrack();

    return () => {
      ignore = true;
    };
  }, [hasHydrated, setUnits, user]);

  const displayUnits = storedUnits.length > 0 ? storedUnits : units;

  return <FingerSpellingTrack units={displayUnits} />;
}
