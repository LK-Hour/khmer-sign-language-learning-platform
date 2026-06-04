import { fetchDictionaryWords } from "@/features/dictionary/api/dictionary";
import { DictionaryPageContent } from "@/features/dictionary/components";
import { FingerSpellingDictionaryShell } from "@/features/finger-spelling/components";

export default async function DictionaryPage() {
  const { items } = await fetchDictionaryWords();

  return (
    <FingerSpellingDictionaryShell>
      <DictionaryPageContent words={items} />
    </FingerSpellingDictionaryShell>
  );
}
