"use client";

import { useEffect } from "react";
import {
  useFingerSpellingStore,
  type FsTrackUnit,
} from "../store";
import FingerSpellingTrackView from "../components/FingerSpellingTrackView";

type FingerSpellingTrackProps = {
  units: FsTrackUnit[];
};

/** Hydrates curriculum from the server into Zustand, then renders the track UI. */
export default function FingerSpellingTrack({ units }: FingerSpellingTrackProps) {
  const setUnits = useFingerSpellingStore((state) => state.setUnits);
  const storedUnits = useFingerSpellingStore((state) => state.units);

  useEffect(() => {
    setUnits(units);
  }, [units, setUnits]);

  const displayUnits = storedUnits.length > 0 ? storedUnits : units;

  return <FingerSpellingTrackView units={displayUnits} />;
}
