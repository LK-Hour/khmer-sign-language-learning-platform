import { Alert } from "@mui/material";
import { PageContainer } from "@/components/layout";
import {
  fetchFsChapters,
  fetchFsLessons,
  fetchFsUnits,
} from "@/features/finger-spelling/api/curriculum";
import FingerSpellingTrack from "@/features/finger-spelling/components/FingerSpellingTrack";
import type { FsTrackUnit } from "@/features/finger-spelling/store";

export default async function FingerSpellingHomePage() {
  let units: FsTrackUnit[];

  try {
    const baseUnits = (await fetchFsUnits()).sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    units = await Promise.all(
      baseUnits.map(async (unit) => {
        const chapters = (await fetchFsChapters(unit.id)).sort(
          (a, b) => a.orderIndex - b.orderIndex
        );
        const chaptersWithLessons = await Promise.all(
          chapters.map(async (chapter) => {
            const lessons = (await fetchFsLessons(chapter.id)).sort(
              (a, b) => a.orderIndex - b.orderIndex
            );

            return {
              ...chapter,
              lessons,
            };
          })
        );

        return {
          ...unit,
          chapters: chaptersWithLessons,
        };
      })
    );
  } catch {
    return (
      <PageContainer>
        <Alert severity="error" sx={{ mx: "auto" }}>
        
          {process.env.NEXT_PUBLIC_API_URL}.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <FingerSpellingTrack units={units} />
    </PageContainer>
  );
}
