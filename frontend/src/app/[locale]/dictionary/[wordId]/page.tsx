import { notFound } from "next/navigation";
import { fetchDictionaryWord } from "@/features/dictionary/api/dictionary";
import {
  DictionaryLayout,
  DictionaryWordDetail,
} from "@/features/dictionary/components";

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
    <DictionaryLayout showHero={false}>
      <DictionaryWordDetail word={word} />
    </DictionaryLayout>
  );
}
