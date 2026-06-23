import { PageContainer } from "@/components/layout";
import { FingerSpellingTrackContainer } from "@/features/finger-spelling/components";

export default function FingerSpellingHomePage() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <FingerSpellingTrackContainer />
    </PageContainer>
  );
}
