"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { KslColors, KslFontSizes, KslRadii, KslShadows } from "@/theme/theme";
import { fontFamilies } from "@/theme/fonts";
import { useTranslation } from "@/i18n/useTranslation";
import type { ExerciseQuestionData, ExerciseAnswerResultData } from "../../types/exercise";
import {
  exerciseOptionStyleMap,
  type ExerciseOptionVisualState,
} from "./ExerciseOptionCard";
import ExerciseSignMedia from "./ExerciseSignMedia";

type Props = {
  question: ExerciseQuestionData;
  pairs: Record<string, number>;
  onSetPairs: (pairs: Record<string, number>) => void;
  reviewResult?: ExerciseAnswerResultData | null;
};

type DragMeta = {
  labelId: number;
  text: string;
  width: number;
  height: number;
};

/**
 * Matching board: letters (left) + 2-col image grid (right).
 * Drag position updates via DOM/rAF (no per-frame React re-renders).
 */
function ExerciseMatching({
  question,
  pairs,
  onSetPairs,
  reviewResult,
}: Props) {
  const { t } = useTranslation();
  const isReview = reviewResult != null;
  const [draggingLabelId, setDraggingLabelId] = useState<number | null>(null);

  const dragMetaRef = useRef<DragMeta | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const hoverDropIdRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pairsRef = useRef(pairs);
  pairsRef.current = pairs;

  const labelOptions = [...question.options].sort(
    (a, b) => a.order_index - b.order_index
  );
  const mediaOptions = [...question.options].sort((a, b) => {
    const len = Math.max(question.options.length, 1);
    const aKey = (a.id * 7 + 3) % len;
    const bKey = (b.id * 7 + 3) % len;
    return aKey - bKey;
  });

  const letterCount = labelOptions.length;
  const pairedLabelIds = new Set(Object.keys(pairs).map((id) => Number(id)));

  function getLabelForMedia(mediaOptId: number): number | null {
    const entry = Object.entries(pairs).find(([, v]) => v === mediaOptId);
    return entry ? Number(entry[0]) : null;
  }

  function pairLabelToMedia(labelId: number, mediaId: number) {
    const current = pairsRef.current;
    const next = { ...current };
    delete next[String(labelId)];
    for (const [key, value] of Object.entries(next)) {
      if (value === mediaId) delete next[key];
    }
    next[String(labelId)] = mediaId;
    onSetPairs(next);
  }

  function clearMediaPair(mediaOptId: number) {
    if (isReview) return;
    const next = { ...pairs };
    for (const [key, value] of Object.entries(next)) {
      if (value === mediaOptId) delete next[key];
    }
    onSetPairs(next);
  }

  function getPairedLabelText(labelOptId: number): string {
    const opt = labelOptions.find((o) => o.id === labelOptId);
    return opt?.option_text_kh ?? opt?.option_text_en ?? "";
  }

  const findDropTarget = useCallback((clientX: number, clientY: number): number | null => {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const el of stack) {
      if (!(el instanceof Element)) continue;
      const drop = el.closest("[data-matching-drop-id]");
      if (drop instanceof HTMLElement) {
        const id = Number(drop.dataset.matchingDropId);
        return Number.isFinite(id) ? id : null;
      }
    }
    return null;
  }, []);

  const clearHoverHighlight = useCallback(() => {
    document
      .querySelectorAll<HTMLElement>("[data-matching-drop-id][data-matching-hover='true']")
      .forEach((el) => {
        el.dataset.matchingHover = "false";
      });
    hoverDropIdRef.current = null;
  }, []);

  const setHoverHighlight = useCallback((id: number | null) => {
    if (hoverDropIdRef.current === id) return;
    clearHoverHighlight();
    hoverDropIdRef.current = id;
    if (id == null) return;
    const el = document.querySelector<HTMLElement>(
      `[data-matching-drop-id="${id}"]`
    );
    if (el) el.dataset.matchingHover = "true";
  }, [clearHoverHighlight]);

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      const current = dragMetaRef.current;
      if (!current) return;
      const target = findDropTarget(clientX, clientY);
      if (target != null) {
        pairLabelToMedia(current.labelId, target);
      }
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      dragMetaRef.current = null;
      pendingPointerRef.current = null;
      clearHoverHighlight();
      setDraggingLabelId(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [findDropTarget, clearHoverHighlight, onSetPairs]
  );

  useEffect(() => {
    if (draggingLabelId == null) return;

    function flushMove() {
      rafRef.current = null;
      const pointer = pendingPointerRef.current;
      const meta = dragMetaRef.current;
      const ghost = ghostRef.current;
      if (!pointer || !meta || !ghost) return;

      ghost.style.transform = `translate3d(${pointer.x - meta.width / 2}px, ${
        pointer.y - meta.height / 2
      }px, 0)`;
      setHoverHighlight(findDropTarget(pointer.x, pointer.y));
    }

    function onMove(e: PointerEvent) {
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(flushMove);
    }

    function onUp(e: PointerEvent) {
      endDrag(e.clientX, e.clientY);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [draggingLabelId, endDrag, findDropTarget, setHoverHighlight]);

  function startDrag(
    e: React.PointerEvent,
    opt: { id: number; option_text_kh: string | null; option_text_en: string | null }
  ) {
    if (isReview) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragMetaRef.current = {
      labelId: opt.id,
      text: opt.option_text_kh ?? opt.option_text_en ?? "",
      width: rect.width,
      height: rect.height,
    };
    pendingPointerRef.current = { x: e.clientX, y: e.clientY };
    setDraggingLabelId(opt.id);

    // Place ghost on next frame after mount
    requestAnimationFrame(() => {
      const ghost = ghostRef.current;
      const meta = dragMetaRef.current;
      if (!ghost || !meta) return;
      ghost.style.width = `${meta.width}px`;
      ghost.style.minHeight = `${meta.height}px`;
      ghost.style.transform = `translate3d(${e.clientX - meta.width / 2}px, ${
        e.clientY - meta.height / 2
      }px, 0)`;
    });
  }

  function getMediaState(mediaOptId: number): ExerciseOptionVisualState {
    if (!isReview) {
      return getLabelForMedia(mediaOptId) != null ? "selected" : "neutral";
    }
    const submittedLabel = Object.entries(reviewResult!.matching_pairs ?? {}).find(
      ([, v]) => v === mediaOptId
    )?.[0];
    if (!submittedLabel) return "neutral";
    return Number(submittedLabel) === mediaOptId ? "correct" : "incorrect";
  }

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      {!isReview && (
        <Typography
          sx={{
            mb: 1.5,
            fontSize: KslFontSizes.sm,
            fontWeight: 600,
            color: KslColors.textSecondary,
          }}
        >
          {t("FINGER_SPELLING.EXERCISE.MATCHING_HINT")}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(64px, 80px) minmax(0, 1fr) minmax(0, 1fr)",
            sm: "minmax(88px, 110px) minmax(0, 1fr) minmax(0, 1fr)",
          },
          gridTemplateRows: `repeat(${Math.max(letterCount, 1)}, minmax(56px, 1fr))`,
          gap: { xs: 1, sm: 1.25 },
          width: "100%",
          p: { xs: 1, sm: 1.5 },
          border: `2px solid ${KslColors.textPrimary}`,
          borderRadius: `${KslRadii.card}px`,
          bgcolor: KslColors.surface,
        }}
      >
        {labelOptions.map((opt, index) => {
          const isPaired = pairedLabelIds.has(opt.id);
          const isDragging = draggingLabelId === opt.id;
          const showLetter = isReview || (!isPaired && !isDragging);

          let state: ExerciseOptionVisualState = "neutral";
          if (isReview) {
            const paired = reviewResult!.matching_pairs?.[String(opt.id)];
            state =
              paired === undefined
                ? "neutral"
                : paired === opt.id
                  ? "correct"
                  : "incorrect";
          }
          const style = exerciseOptionStyleMap[state];

          return (
            <Box
              key={`letter-${opt.id}`}
              sx={{
                gridColumn: 1,
                gridRow: index + 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 0,
                pr: { xs: 0.5, sm: 1 },
                borderRight: `2px solid ${KslColors.textPrimary}`,
              }}
            >
              {showLetter ? (
                <Box
                  onPointerDown={
                    isReview ? undefined : (e) => startDrag(e, opt)
                  }
                  sx={{
                    width: "100%",
                    height: "100%",
                    maxHeight: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 0.75,
                    borderRadius: `${KslRadii.wordCard}px`,
                    border: `1.5px solid ${style.border}`,
                    bgcolor: style.bg,
                    color: style.color,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    cursor: isReview ? "default" : "grab",
                    userSelect: "none",
                    touchAction: "none",
                    "@media (hover: hover) and (pointer: fine)": !isReview
                      ? {
                          "&:hover": {
                            boxShadow: KslShadows.card,
                            borderColor: KslColors.secondary,
                            bgcolor: KslColors.secondaryLighter,
                          },
                        }
                      : undefined,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.khmer,
                      fontSize: { xs: KslFontSizes.md, sm: KslFontSizes.xl },
                      fontWeight: 700,
                      pointerEvents: "none",
                      lineHeight: 1,
                    }}
                  >
                    {opt.option_text_kh}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  sx={{
                    fontSize: KslFontSizes.lg,
                    fontWeight: 700,
                    color: KslColors.textSecondary,
                    opacity: 0.4,
                  }}
                >
                  ?
                </Typography>
              )}
            </Box>
          );
        })}

        {mediaOptions.map((opt, index) => {
          const state = getMediaState(opt.id);
          const style = exerciseOptionStyleMap[state];
          const pairedLabelId = isReview
            ? Number(
                Object.entries(reviewResult!.matching_pairs ?? {}).find(
                  ([, v]) => v === opt.id
                )?.[0] ?? NaN
              )
            : getLabelForMedia(opt.id);
          const hasPair = Number.isFinite(pairedLabelId);
          const isCorrectPair = hasPair && pairedLabelId === opt.id;
          const imageRow = Math.floor(index / 2);
          const startRow = imageRow * 2 + 1;
          const gridColumn = (index % 2) + 2;
          const correctLetter =
            opt.option_text_kh || opt.option_text_en || "";
          const yourPickLetter = hasPair
            ? getPairedLabelText(pairedLabelId as number)
            : "";

          return (
            <Box
              key={`media-${opt.id}`}
              data-matching-drop-id={opt.id}
              data-matching-hover="false"
              onClick={() => {
                if (!isReview && hasPair && draggingLabelId == null) {
                  clearMediaPair(opt.id);
                }
              }}
              sx={{
                position: "relative",
                gridColumn,
                gridRow: `${startRow} / span 2`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                p: 1,
                minHeight: 0,
                borderRadius: `${KslRadii.card}px`,
                border: `2px solid ${style.border}`,
                bgcolor: style.bg,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                cursor: !isReview && hasPair ? "pointer" : "default",
                transition:
                  "border-color 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease",
                "&[data-matching-hover='true']": {
                  borderColor: KslColors.secondary,
                  bgcolor: KslColors.secondaryLighter,
                  boxShadow: KslShadows.card,
                },
                "&:active":
                  !isReview && hasPair
                    ? { transform: "scale(0.98)" }
                    : undefined,
              }}
            >
              <ExerciseSignMedia
                url={opt.media_url}
                alt={opt.option_text_kh ?? "Sign"}
                size={120}
                reviewState={
                  state === "correct"
                    ? "correct"
                    : state === "incorrect"
                      ? "incorrect"
                      : "neutral"
                }
              />

              {!isReview && hasPair ? (
                <Typography
                  sx={{
                    fontFamily: fontFamilies.khmer,
                    fontSize: KslFontSizes.md,
                    fontWeight: 700,
                    color: style.color,
                    lineHeight: 1.2,
                    textAlign: "center",
                  }}
                >
                  {yourPickLetter}
                </Typography>
              ) : null}

              {isReview ? (
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.khmer,
                      fontSize: KslFontSizes.md,
                      fontWeight: 700,
                      color: KslColors.primary,
                      lineHeight: 1.2,
                    }}
                  >
                    {correctLetter}
                  </Typography>
                  {hasPair && !isCorrectPair ? (
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.khmer,
                        fontSize: KslFontSizes.sm,
                        fontWeight: 700,
                        color: KslColors.error,
                        lineHeight: 1.2,
                        textDecoration: "line-through",
                        mt: 0.25,
                      }}
                    >
                      {yourPickLetter}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>

      {draggingLabelId != null && dragMetaRef.current ? (
        <Box
          ref={ghostRef}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1400,
            pointerEvents: "none",
            willChange: "transform",
            px: 2,
            py: 1.5,
            borderRadius: `${KslRadii.card}px`,
            border: `2px solid ${KslColors.secondary}`,
            bgcolor: KslColors.secondaryLight,
            color: KslColors.secondary,
            boxShadow: KslShadows.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontFamily: fontFamilies.khmer,
              fontSize: KslFontSizes.xl,
              fontWeight: 700,
            }}
          >
            {dragMetaRef.current.text}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

export default memo(ExerciseMatching);
