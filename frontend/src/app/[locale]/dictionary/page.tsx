import { fetchDictionaryWords } from "@/features/dictionary/api/dictionary";
import {
  DictionaryLayout,
  DictionaryPageContent,
} from "@/features/dictionary/components";

export default async function DictionaryPage() {
  const { items } = await fetchDictionaryWords();

  return (
    <DictionaryLayout>
      <DictionaryPageContent words={items} />
    </DictionaryLayout>
  );
}
