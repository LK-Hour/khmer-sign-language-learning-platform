import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import ComingSoonPanel from "@/features/finger-spelling/components/ComingSoonPanel";

export default function FingerSpellingPracticePage() {
  return (
    <FsMobileShell title="Practice" subtitle="Finger spelling">
      <ComingSoonPanel
        title="Chapter exercises"
        description="Multiple choice, free-form, and image-select questions unlock after you complete every lesson in a chapter. Wire to GET /api/finger_spelling/exercise/chapters/{chapterId}."
      />
    </FsMobileShell>
  );
}
