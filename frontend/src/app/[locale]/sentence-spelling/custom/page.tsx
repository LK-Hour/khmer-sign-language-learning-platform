import { PageContainer } from "@/components/layout";
import SentenceCustomForm from "@/features/sentence-spelling/components/SentenceCustomForm";

export default function SentenceCustomPage() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <SentenceCustomForm />
    </PageContainer>
  );
}
