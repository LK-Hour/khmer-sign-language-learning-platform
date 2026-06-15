import { fetchDictionaryWords } from "@/features/dictionary/api/dictionary";
import { DictionaryPageContent } from "@/features/dictionary/components";
import { FingerSpellingDictionaryLayout } from "@/features/finger-spelling/components";

export default async function DictionaryPage() {
  const { items } = await fetchDictionaryWords();

  return (
    <FingerSpellingDictionaryLayout>
      <DictionaryPageContent words={items} />
    </FingerSpellingDictionaryLayout>
  );
}
