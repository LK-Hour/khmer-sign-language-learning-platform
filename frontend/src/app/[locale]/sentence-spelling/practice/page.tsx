import { PageContainer } from "@/components/layout";
import { fetchNextSentence } from "@/features/sentence-spelling/api/curriculum";
import SentenceSpellingPracticeView from "@/features/sentence-spelling/components/SentenceSpellingPracticeView";

type PageProps = {
  searchParams: Promise<{ text?: string; source?: string; sentenceId?: string }>;
};

export default async function SentenceSpellingPracticePage({ searchParams }: PageProps) {
  const { text = "", source: sourceParam, sentenceId } = await searchParams;
  const source = sourceParam === "custom" ? "custom" : "sample";
  const parsedSentenceId = sentenceId ? Number(sentenceId) : undefined;
  const validSentenceId = Number.isFinite(parsedSentenceId) ? parsedSentenceId : undefined;

  // "Next sentence" only exists for the curated list; custom sentences have no order.
  const nextSentence = source === "sample" ? await fetchNextSentence(validSentenceId) : null;

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      {/* Keyed so moving to the next sentence (same route, new search params)
          remounts the view instead of carrying over the previous run's state. */}
      <SentenceSpellingPracticeView
        key={`${source}:${validSentenceId ?? ""}:${text}`}
        text={text}
        source={source}
        sentenceId={validSentenceId}
        nextSentence={
          nextSentence ? { id: nextSentence.id, textKh: nextSentence.textKh } : null
        }
      />
    </PageContainer>
  );
}
