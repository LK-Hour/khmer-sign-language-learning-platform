"use client";

import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import type { ExerciseSessionData } from "../../types/exercise";
import ExerciseMultipleChoice from "./ExerciseMultipleChoice";
import ExerciseTrueFalse from "./ExerciseTrueFalse";
import ExerciseMultipleAnswer from "./ExerciseMultipleAnswer";
import ExerciseMatching from "./ExerciseMatching";

type Props = {
  session: ExerciseSessionData;
  unitId: number;
  unitTitle: string;
  onBackToList: () => void;
};

export default function ExerciseScoreSummary({ session, unitTitle, onBackToList }: Props) {
  const { locale } = useTranslation();
  const pct = Math.round((session.score / Math.max(session.max_score, 1)) * 100);
  const passed = pct >= 60;

  const resultByExercise = Object.fromEntries(
    session.per_question_results.map((r) => [r.exercise_id, r])
  );

  return (
    <Box>
      {/* Score banner */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        sx={{
          borderRadius: `${KslRadii.card}px`,
          background: passed
            ? "linear-gradient(135deg, #1f9f6f 0%, #147b55 100%)"
            : "linear-gradient(135deg, #f3b83f 0%, #d69b2a 100%)",
          color: "#fff",
          p: { xs: 3, md: 4 },
          mb: 4,
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            fontFamily: fontFamilies.display,
            fontWeight: 900,
            fontSize: { xs: 56, md: 80 },
            lineHeight: 1,
          }}
        >
          {pct}%
        </Typography>
        <Typography sx={{ fontSize: KslFontSizes.lg, mt: 0.5, opacity: 0.9 }}>
          {session.score} / {session.max_score} correct
        </Typography>
        <Typography sx={{ fontSize: KslFontSizes.md, mt: 1, fontWeight: 700 }}>
          {passed ? "Great work! 🎉" : "Keep practicing 💪"}
        </Typography>
        <Typography sx={{ fontSize: KslFontSizes.sm, mt: 0.5, opacity: 0.85 }}>
          {unitTitle}
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 5 }}>
        <Button
          variant="outlined"
          startIcon={<Icon icon="solar:arrow-left-linear" />}
          onClick={onBackToList}
          sx={{ borderColor: KslColors.border, color: KslColors.textPrimary, flex: 1 }}
        >
          Back to Exercise List
        </Button>
      </Stack>

      {/* Review */}
      <Typography
        sx={{
          fontFamily: fontFamilies.display,
          fontWeight: 700,
          fontSize: KslFontSizes.xl,
          color: KslColors.textPrimary,
          mb: 3,
        }}
      >
        Answer Review
      </Typography>

      <Stack spacing={0} divider={<Divider sx={{ borderStyle: "dashed", my: 4 }} />}>
        {session.questions.map((q, index) => {
          const result = resultByExercise[q.exercise_id];
          return (
            <Box key={q.exercise_id}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: result?.is_correct ? KslColors.primaryLight : "#fff0ef",
                    color: result?.is_correct ? KslColors.primary : KslColors.error,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: KslFontSizes.sm,
                    flexShrink: 0,
                  }}
                >
                  {result?.is_correct ? (
                    <Icon icon="mdi:check-bold" />
                  ) : (
                    <Icon icon="mdi:close-thick" />
                  )}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: KslFontSizes.md, color: KslColors.textPrimary }}>
                    {locale === "kh" ? q.question_kh : q.question_en}
                  </Typography>
                  <Typography sx={{ fontSize: KslFontSizes.xs, color: KslColors.textSecondary }}>
                    Q{index + 1} · {q.exercise_type.replace("_", " ")}
                  </Typography>
                </Box>
              </Box>

              {q.exercise_type === "multiple_choice" && (
                <ExerciseMultipleChoice question={q} selected={null} onSelect={() => {}} reviewResult={result} />
              )}
              {q.exercise_type === "true_false" && (
                <ExerciseTrueFalse question={q} selected={null} onSelect={() => {}} reviewResult={result} />
              )}
              {q.exercise_type === "multiple_answer" && (
                <ExerciseMultipleAnswer question={q} selected={[]} onToggle={() => {}} reviewResult={result} />
              )}
              {q.exercise_type === "matching" && (
                <ExerciseMatching
                  question={q}
                  pairs={result?.matching_pairs ?? {}}
                  onSetPairs={() => {}}
                  reviewResult={result}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
