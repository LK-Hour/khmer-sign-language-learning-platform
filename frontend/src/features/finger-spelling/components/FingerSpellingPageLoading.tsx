import {
  TrackPageLoading,
  TrackSkeleton,
} from "@/features/shared/TrackPageSkeleton";

const UNIT_COUNT = 3;
const LESSON_ROW_SECOND_WIDTH = 68;

export function FingerSpellingTrackSkeleton({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  return (
    <TrackSkeleton
      embedded={embedded}
      unitCount={UNIT_COUNT}
      lessonRowSecondWidth={LESSON_ROW_SECOND_WIDTH}
    />
  );
}

/** Full-page overlay used by the route loader and client fetch gate. */
export default function FingerSpellingPageLoading() {
  return (
    <TrackPageLoading
      ariaLabel="Loading finger spelling"
      unitCount={UNIT_COUNT}
      lessonRowSecondWidth={LESSON_ROW_SECOND_WIDTH}
    />
  );
}
