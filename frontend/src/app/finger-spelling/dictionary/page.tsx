import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import ComingSoonPanel from "@/features/finger-spelling/components/ComingSoonPanel";

export default function FingerSpellingDictionaryPage() {
  return (
    <FsMobileShell title="Dictionary" subtitle="Letters">
      <ComingSoonPanel
        title="Letter dictionary"
        description="Searchable list of all finger-spelling letters. Separate from the word dictionary on the /words track."
      />
    </FsMobileShell>
  );
}
