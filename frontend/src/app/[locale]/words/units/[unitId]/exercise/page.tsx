import { PageContainer } from "@/components/layout";
import WordDetectionExerciseAttemptContainer from "@/features/word-detection/components/exercise/WordDetectionExerciseAttemptContainer";

type Props = {
  params: Promise<{ unitId: string }>;
};

export default async function WordDetectionExerciseAttemptPage({ params }: Props) {
  const { unitId } = await params;
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <WordDetectionExerciseAttemptContainer unitId={Number(unitId)} />
    </PageContainer>
  );
}
