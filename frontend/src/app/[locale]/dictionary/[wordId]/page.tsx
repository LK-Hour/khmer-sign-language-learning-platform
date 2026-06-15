import { notFound } from "next/navigation";
import { fetchDictionaryWord } from "@/features/dictionary/api/dictionary";
import { DictionaryWordDetail } from "@/features/dictionary/components";
import { FingerSpellingDictionaryLayout } from "@/features/finger-spelling/components";

type PageProps = {
  params: Promise<{ wordId: string }>;
};

export default async function DictionaryWordPage({ params }: PageProps) {
  const { wordId } = await params;
  const id = Number(wordId);
  if (Number.isNaN(id)) notFound();

  const word = await fetchDictionaryWord(id);
  if (!word) notFound();

  return (
    <FingerSpellingDictionaryLayout>
      <DictionaryWordDetail word={word} />
    </FingerSpellingDictionaryLayout>
  );
}
