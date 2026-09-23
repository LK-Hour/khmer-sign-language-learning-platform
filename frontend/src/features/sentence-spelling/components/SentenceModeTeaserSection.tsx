"use client";

import { Grid } from "@mui/material";

import { ROUTES } from "@/constants/routes";
import { getTranslations } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";

import SentenceModeTeaserCard from "./SentenceModeTeaserCard";

export default function SentenceModeTeaserSection() {
  const { locale } = useTranslation();
  const t = getTranslations(locale);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <SentenceModeTeaserCard
          href={`/${locale}${ROUTES.sentenceSpelling.sample}`}
          icon="solar:notebook-bold"
          tag={t.SENTENCE_SPELLING.SAMPLE.TAG}
          eyebrow={t.SENTENCE_SPELLING.SAMPLE.EYEBROW}
          title={t.SENTENCE_SPELLING.SAMPLE.TITLE}
          description={t.SENTENCE_SPELLING.SAMPLE.DESCRIPTION}
          features={t.SENTENCE_SPELLING.SAMPLE.FEATURES}
          ctaLabel={t.SENTENCE_SPELLING.SAMPLE.EXPLORE}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SentenceModeTeaserCard
          href={`/${locale}${ROUTES.sentenceSpelling.custom}`}
          icon="solar:pen-new-square-bold"
          tag={t.SENTENCE_SPELLING.CUSTOM.TAG}
          eyebrow={t.SENTENCE_SPELLING.CUSTOM.EYEBROW}
          title={t.SENTENCE_SPELLING.CUSTOM.TITLE}
          description={t.SENTENCE_SPELLING.CUSTOM.DESCRIPTION}
          features={t.SENTENCE_SPELLING.CUSTOM.FEATURES}
          ctaLabel={t.SENTENCE_SPELLING.CUSTOM.EXPLORE}
        />
      </Grid>
    </Grid>
  );
}
