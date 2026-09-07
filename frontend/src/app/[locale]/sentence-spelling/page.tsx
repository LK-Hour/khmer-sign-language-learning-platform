import { Grid, Stack } from "@mui/material";

import { PageContainer } from "@/components/layout";
import { ROUTES } from "@/constants/routes";
import SentenceModeTeaserCard from "@/features/sentence-spelling/components/SentenceModeTeaserCard";
import SentenceSpellingHeader from "@/features/sentence-spelling/components/SentenceSpellingHeader";
import { getTranslations } from "@/i18n/translations";
import { DEFAULT_LOCALE, isValidLocale } from "@/i18n/config";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SentenceSpellingPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = getTranslations(locale);

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <SentenceSpellingHeader />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SentenceModeTeaserCard
              href={`/${locale}${ROUTES.sentenceSpelling.sample}`}
              icon="solar:notebook-bold"
              eyebrow={t.SENTENCE_SPELLING.SAMPLE.EYEBROW}
              title={t.SENTENCE_SPELLING.SAMPLE.TITLE}
              description={t.SENTENCE_SPELLING.SAMPLE.DESCRIPTION}
              ctaLabel={t.SENTENCE_SPELLING.SAMPLE.EXPLORE}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SentenceModeTeaserCard
              href={`/${locale}${ROUTES.sentenceSpelling.custom}`}
              icon="solar:pen-new-square-bold"
              eyebrow={t.SENTENCE_SPELLING.CUSTOM.EYEBROW}
              title={t.SENTENCE_SPELLING.CUSTOM.TITLE}
              description={t.SENTENCE_SPELLING.CUSTOM.DESCRIPTION}
              ctaLabel={t.SENTENCE_SPELLING.CUSTOM.EXPLORE}
            />
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
}
