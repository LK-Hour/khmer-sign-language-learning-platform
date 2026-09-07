import { PageContainer } from "@/components/layout";
import WordDetectionExerciseListContainer from "@/features/word-detection/components/exercise/WordDetectionExerciseListContainer";

export default function WordDetectionExercisesPage() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <WordDetectionExerciseListContainer />
    </PageContainer>
  );
}
