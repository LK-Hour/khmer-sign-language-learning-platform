import { createTrackLoaders } from "@/features/shared/TrackPageSkeleton";

const { TrackLoadingSkeleton, TrackLoadingPage } = createTrackLoaders({
  ariaLabel: "Loading word detection",
  unitCount: 4,
  lessonRowSecondWidth: 140,
});

export const WordDetectionTrackSkeleton = TrackLoadingSkeleton;
export default TrackLoadingPage;
