import { Stack } from "@mui/material";
import { notFound } from "next/navigation";
import StartExerciseLink from "@/components/common/StartExerciseLink";
import { fetchFsChapterExercise } from "@/features/finger-spelling/api/practice";
import { FingerSpellingShell } from "@/features/finger-spelling/components";
import { ROUTES } from "@/constants/routes";

type PageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ChapterExerciseIntroPage({ params }: PageProps) {
  const { chapterId } = await params;
  const id = Number(chapterId);
  if (Number.isNaN(id)) notFound();

  const exercise = await fetchFsChapterExercise(id);
  if (!exercise) notFound();

  return (
    <FingerSpellingShell
      title={exercise.title}
      subtitle={exercise.subtitle}
      headerVariant="exercise"
      hideBottomNav
      fullWidth
    >
      <Stack
        sx={{
          alignItems: "center",
          gap: 3,
          py: 6,
        }}
      >
        <StartExerciseLink href={ROUTES.fingerSpelling.exerciseQuiz(id)} />
      </Stack>
    </FingerSpellingShell>
  );
}
