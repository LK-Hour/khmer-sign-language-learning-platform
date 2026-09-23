import { Stack } from "@mui/material";

import { PageContainer } from "@/components/layout";
import SentenceModeTeaserSection from "@/features/sentence-spelling/components/SentenceModeTeaserSection";
import SentenceRecentProgressCard from "@/features/sentence-spelling/components/SentenceRecentProgressCard";
import SentenceSpellingHeader from "@/features/sentence-spelling/components/SentenceSpellingHeader";

export default function SentenceSpellingPage() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <SentenceSpellingHeader />

        <SentenceRecentProgressCard />

        <SentenceModeTeaserSection />
      </Stack>
    </PageContainer>
  );
}
