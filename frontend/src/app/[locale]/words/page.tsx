import { PageContainer } from "@/components/layout";
import WordDetectionTrackContainer from "@/features/word-detection/components/WordDetectionTrackContainer";

export default function WordDetectionPage() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <WordDetectionTrackContainer />
    </PageContainer>
  );
}
