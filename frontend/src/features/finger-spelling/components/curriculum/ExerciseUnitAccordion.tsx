"use client";

import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import ExpandToggle from "@/components/ui/ExpandToggle";
import type { FsExercise, FsUnit } from "@/features/finger-spelling/types";
import {
  formatUnitBadge,
  toKhmerNumeral,
} from "@/features/finger-spelling/utils/chapter";
import { useLocalizedPair } from "@/i18n/useLocalizedPair";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslRadii } from "@/theme/theme";
import ExerciseChapterRow from "./ExerciseChapterRow";

type ExerciseUnitAccordionProps = {
  unit: FsUnit;
  exercises: FsExercise[];
  defaultExpanded?: boolean;
};

export default function ExerciseUnitAccordion({
  unit,
  exercises,
  defaultExpanded = false,
}: ExerciseUnitAccordionProps) {
  const locked = unit.isLocked === true;
  const { t, locale } = useTranslation();
  const { primary, secondary } = useLocalizedPair(unit.title, unit.titleKh);
  const unitBadge = formatUnitBadge(unit.orderIndex, locale, t("fsUnit"));
  const [expanded, setExpanded] = useState(defaultExpanded && !locked);

  const sortedExercises = [...exercises].sort(
    (a, b) => a.chapterOrderIndex - b.chapterOrderIndex
  );

  const metaLine = locked
    ? `${t("fsUnitLockedUntil")} ${
        locale === "kh"
          ? toKhmerNumeral(unit.orderIndex - 1).padStart(2, "០")
          : String(unit.orderIndex - 1).padStart(2, "0")
      }`
    : t("fsUnitChapterExercises").replace(
        "{count}",
        String(sortedExercises.length)
      );

  return (
    <Box
      sx={{
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: "background.paper",
        overflow: "hidden",
        opacity: locked ? 0.6 : 1,
        mb: 1.5,
      }}
    >
      <Box
        component="button"
        type="button"
        disabled={locked}
        onClick={() => !locked && setExpanded((prev) => !prev)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.5, md: 2 },
          width: "100%",
          p: { xs: 1.5, md: 2 },
          border: "none",
          bgcolor: expanded && !locked ? KslColors.primaryLight : "transparent",
          cursor: locked ? "not-allowed" : "pointer",
          textAlign: "left",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: KslColors.primary,
            }}
          >
            {unitBadge}
          </Typography>
          <Typography
            sx={{
              mt: 0.25,
              fontSize: { xs: KslFontSizes.md, md: KslFontSizes.lg },
              fontWeight: 700,
              color: KslColors.secondary,
              lineHeight: 1.25,
            }}
          >
            {primary}
          </Typography>
          {secondary && (
            <Typography
              sx={{
                mt: 0.5,
                fontSize: KslFontSizes.sm,
                color: KslColors.textSecondary,
              }}
            >
              {secondary}
            </Typography>
          )}
          <Typography
            sx={{
              mt: 0.5,
              fontSize: KslFontSizes.sm,
              color: KslColors.textSecondary,
            }}
          >
            {metaLine}
          </Typography>
        </Box>
        <ExpandToggle
          expanded={expanded}
          disabled={locked}
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${primary}`}
        />
      </Box>

      <Collapse in={expanded && !locked} unmountOnExit>
        <Box
          sx={{
            px: { xs: 1.5, md: 2 },
            pb: { xs: 1.5, md: 2 },
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {sortedExercises.map((exercise) => (
            <ExerciseChapterRow key={exercise.id} exercise={exercise} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
