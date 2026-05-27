import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import ComingSoonPanel from "@/features/finger-spelling/components/ComingSoonPanel";

export default function FingerSpellingPracticePage() {
  return (
    <FsMobileShell title="Practice" subtitle="Finger spelling">
      <ComingSoonPanel
        title="Chapter practice"
        description="Quiz and chapter exercises will live here. Wire to /api/finger_spelling/chapters/{id}/exercise when the backend is ready."
      />
    </FsMobileShell>
  );
}
