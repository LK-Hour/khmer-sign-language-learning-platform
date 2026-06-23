"use client";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Stack, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { submitLessonFeedback, type FeedbackMood, type FeedbackType } from "@/features/finger-spelling/api/feedback";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";

type LessonFeedbackWidgetProps = {
  type: FeedbackType;
  category: string;
  lessonId: number;
  characteristic: string;
  lessonLabel: string;
  resultReady: boolean;
};

type MoodOption = {
  value: FeedbackMood;
  label: string;
  emoji: string;
};

export default function LessonFeedbackWidget({
  type,
  category,
  lessonId,
  characteristic,
  lessonLabel,
  resultReady,
}: LessonFeedbackWidgetProps) {
  const { t } = useTranslation();
  const [hasShown, setHasShown] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedMood, setSelectedMood] = useState<FeedbackMood | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!resultReady || hasShown) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setHasShown(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasShown, resultReady]);

  const moodOptions = useMemo<MoodOption[]>(
    () => [
      {
        value: "very_bad",
        label: t("feedbackMoodVeryBad"),
        emoji: "😡",
      },
      {
        value: "bad",
        label: t("feedbackMoodBad"),
        emoji: "🙁",
      },
      {
        value: "okay",
        label: t("feedbackMoodOkay"),
        emoji: "😐",
      },
      {
        value: "good",
        label: t("feedbackMoodGood"),
        emoji: "🙂",
      },
      {
        value: "excellent",
        label: t("feedbackMoodExcellent"),
        emoji: "😍",
      },
    ],
    [t],
  );

  if (!hasShown) {
    return null;
  }

  const handleClose = () => {
    setCollapsed(true);
  };

  const handleSubmit = async () => {
    if (!selectedMood || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      await submitLessonFeedback({
        type,
        category,
        lesson_id: lessonId,
        characteristic,
        mood: selectedMood,
        comment,
      });
      setSubmitted(true);
      hideTimerRef.current = setTimeout(() => {
        setCollapsed(true);
      }, 1800);
    } catch {
      setError(t("feedbackError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack
      sx={{
        position: "fixed",
        left: { xs: 12, sm: 20 },
        bottom: { xs: 12, sm: 20 },
        zIndex: 1200,
        width: collapsed ? "auto" : { xs: "min(calc(100vw - 24px), 360px)", sm: 360 },
      }}
    >
      {collapsed ? (
        <Tooltip title={t("feedbackOpen")}>
          <Paper
            component="button"
            type="button"
            elevation={0}
            onClick={() => setCollapsed(false)}
            aria-label={t("feedbackOpen")}
            sx={{
              width: 52,
              height: 52,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              bgcolor: KslColors.surface,
              border: `1px solid ${KslColors.border}`,
              boxShadow: KslShadows.card,
              cursor: "pointer",
              color: KslColors.primary,
            }}
          >
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 24 }} />
          </Paper>
        </Tooltip>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: `${KslRadii.card}px`,
            bgcolor: KslColors.surface,
            border: `1px solid ${KslColors.border}`,
            boxShadow: KslShadows.card,
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Stack>
                <Typography sx={{ fontSize: KslFontSizes.lg, fontWeight: 700, color: KslColors.textPrimary }}>
                  {t("feedbackTitle")}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: KslFontSizes.sm, color: KslColors.textSecondary }}>
                  {t("feedbackPrompt")} {lessonLabel}
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={handleClose}
                aria-label={t("fsAriaCloseMenu")}
                sx={{ color: KslColors.textSecondary }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>

            {submitted ? (
              <Alert severity="success">{t("feedbackThanks")}</Alert>
            ) : (
              <>
                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                  {moodOptions.map(({ value, label, emoji }) => {
                    const active = selectedMood === value;
                    return (
                      <Tooltip key={value} title={label}>
                        <Stack
                          component="button"
                          type="button"
                          onClick={() => setSelectedMood(value)}
                          aria-label={label}
                          sx={{
                            width: 44,
                            height: 44,
                            minWidth: 44,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            border: `1px solid ${active ? KslColors.primary : KslColors.border}`,
                            bgcolor: active ? KslColors.primaryLighter : KslColors.surface,
                            color: active ? KslColors.primary : KslColors.textSecondary,
                            transition: "all 0.18s ease",
                            cursor: "pointer",
                          }}
                        >
                          <Stack spacing={0.5} sx={{ alignItems: "center" }}>
                            <Typography
                              aria-hidden="true"
                              sx={{
                                fontSize: 28,
                                lineHeight: 1,
                              }}
                            >
                              {emoji}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Tooltip>
                    );
                  })}
                </Stack>

                <TextField
                  label={t("feedbackCommentLabel")}
                  placeholder={t("feedbackCommentPlaceholder")}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  multiline
                  minRows={3}
                  slotProps={{
                    htmlInput: { maxLength: 500 },
                  }}
                />

                {error ? <Alert severity="warning">{error}</Alert> : null}

                <LoadingButton
                  variant="contained"
                  loading={submitting}
                  onClick={handleSubmit}
                  disabled={!selectedMood}
                  sx={{
                    minHeight: 44,
                    borderRadius: `${KslRadii.button}px`,
                    bgcolor: KslColors.primary,
                    "&:hover": { bgcolor: KslColors.primaryDark },
                  }}
                >
                  {t("feedbackSubmit")}
                </LoadingButton>
              </>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}