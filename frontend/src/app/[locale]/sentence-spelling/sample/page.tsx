import { PageContainer } from "@/components/layout";
import { fetchSentences } from "@/features/sentence-spelling/api/curriculum";
import SentenceSampleList from "@/features/sentence-spelling/components/SentenceSampleList";

export default async function SentenceSamplePage() {
  const sentences = await fetchSentences();

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <SentenceSampleList sentences={sentences} />
    </PageContainer>
  );
}
