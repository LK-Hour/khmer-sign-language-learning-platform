import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import ComingSoonPanel from "@/features/finger-spelling/components/ComingSoonPanel";

export default function FingerSpellingProfilePage() {
  return (
    <FsMobileShell title="Profile">
      <ComingSoonPanel
        title="Your progress"
        description="Stats and account settings will connect to auth once Sprint 1 auth UI is shared."
      />
    </FsMobileShell>
  );
}
