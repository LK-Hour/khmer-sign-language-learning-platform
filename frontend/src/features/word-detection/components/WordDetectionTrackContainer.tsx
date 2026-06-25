"use client";

import { useEffect } from "react";
import { fetchWdTrackUnits } from "../api/curriculum";
import { useWordDetectionStore } from "../store";
import WordDetectionTrack from "./WordDetectionTrack";

/**
 * Loads the word-detection curriculum (currently mock data) and
 * hydrates the Zustand store, then renders the track UI.
 * When a real API is ready, swap fetchWdTrackUnits() for an async call.
 */
export default function WordDetectionTrackContainer() {
  const setUnits = useWordDetectionStore((s) => s.setUnits);
  const units = useWordDetectionStore((s) => s.units);

  useEffect(() => {
    const fresh = fetchWdTrackUnits();
    setUnits(fresh);
  }, [setUnits]);

  return <WordDetectionTrack units={units} />;
}
