import { PageContainer } from "@/components/layout";
import FingerSpellingExerciseAttemptContainer from "@/features/finger-spelling/components/exercise/FingerSpellingExerciseAttemptContainer";

type Props = {
  params: Promise<{ unitId: string }>;
};

export default async function FingerSpellingExerciseAttemptPage({ params }: Props) {
  const { unitId } = await params;
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <FingerSpellingExerciseAttemptContainer unitId={Number(unitId)} />
    </PageContainer>
  );
}
