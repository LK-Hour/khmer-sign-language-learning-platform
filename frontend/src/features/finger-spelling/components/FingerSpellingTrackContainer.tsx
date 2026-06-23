"use client";

import { useEffect, useState } from "react";
import { fetchFsTrackUnits } from "../api/curriculum";
import {
  useFingerSpellingStore,
  type FsTrackUnit,
} from "../store";
import { useAuthStore } from "@/store/auth.store";
import { FingerSpellingTrackSkeleton } from "@/app/[locale]/finger-spelling/loading";
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
  const [trackReady, setTrackReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !user) return;

    if (user?.is_guest) {
      setUnits(units);
      setTrackReady(true);
      return;
    }

    let ignore = false;
    setTrackReady(false);

    async function loadUserTrack() {
      try {
        const freshUnits = await fetchFsTrackUnits();
        if (!ignore) {
          setUnits(freshUnits);
          setTrackReady(true);
        }
      } catch {
        if (!ignore) {
          setUnits(units);
          setTrackReady(true);
        }
      }
    }

    void loadUserTrack();

    return () => {
      ignore = true;
    };
  }, [hasHydrated, units, setUnits, user]);

  if (!trackReady) {
    return <FingerSpellingTrackSkeleton embedded />;
  }

  const displayUnits = storedUnits.length > 0 ? storedUnits : units;

  return <FingerSpellingTrack units={displayUnits} />;
}
