import { PageContainer } from "@/components/layout";
import SentenceSpellingPracticeView from "@/features/sentence-spelling/components/SentenceSpellingPracticeView";

type PageProps = {
  searchParams: Promise<{ text?: string; source?: string }>;
};

export default async function SentenceSpellingPracticePage({ searchParams }: PageProps) {
  const { text = "", source } = await searchParams;

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <SentenceSpellingPracticeView
        text={text}
        source={source === "custom" ? "custom" : "sample"}
      />
    </PageContainer>
  );
}
