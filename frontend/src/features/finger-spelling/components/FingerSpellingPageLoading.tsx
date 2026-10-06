import { createTrackLoaders } from "@/features/shared/TrackPageSkeleton";

const { TrackLoadingSkeleton, TrackLoadingPage } = createTrackLoaders({
  ariaLabel: "Loading finger spelling",
  unitCount: 3,
  lessonRowSecondWidth: 68,
});

export const FingerSpellingTrackSkeleton = TrackLoadingSkeleton;
export default TrackLoadingPage;
