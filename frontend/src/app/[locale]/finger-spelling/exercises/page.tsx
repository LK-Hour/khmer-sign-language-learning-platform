import { PageContainer } from "@/components/layout";
import FingerSpellingExerciseListContainer from "@/features/finger-spelling/components/exercise/FingerSpellingExerciseListContainer";

export default function FingerSpellingExercisesPage() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <FingerSpellingExerciseListContainer />
    </PageContainer>
  );
}
