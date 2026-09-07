import { PageContainer } from "@/components/layout";
import SentenceSampleList from "@/features/sentence-spelling/components/SentenceSampleList";

export default function SentenceSamplePage() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <SentenceSampleList />
    </PageContainer>
  );
}
