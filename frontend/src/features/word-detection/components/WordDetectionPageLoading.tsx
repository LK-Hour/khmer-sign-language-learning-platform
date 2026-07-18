import {
  TrackPageLoading,
  TrackSkeleton,
} from "@/features/shared/TrackPageSkeleton";

const UNIT_COUNT = 4;
const LESSON_ROW_SECOND_WIDTH = 140;

export function WordDetectionTrackSkeleton({
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

export default function WordDetectionPageLoading() {
  return (
    <TrackPageLoading
      ariaLabel="Loading word detection"
      unitCount={UNIT_COUNT}
      lessonRowSecondWidth={LESSON_ROW_SECOND_WIDTH}
    />
  );
}
