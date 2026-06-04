"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { FsExercise, FsUnit } from "../types";
import ExerciseUnitAccordion from "./curriculum/ExerciseUnitAccordion";

type ExercisePageContentProps = {
  units: FsUnit[];
  exercises: FsExercise[];
};

export default function ExercisePageContent({
  units,
  exercises,
}: ExercisePageContentProps) {
  const { t } = useTranslation();

  const exercisesByUnitId = useMemo(() => {
    const map = new Map<number, FsExercise[]>();
    for (const exercise of exercises) {
      const list = map.get(exercise.unitId) ?? [];
      list.push(exercise);
      map.set(exercise.unitId, list);
    }
    return map;
  }, [exercises]);

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.orderIndex - b.orderIndex),
    [units]
  );

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("fsExerciseHint")}
      </Typography>
      <Stack spacing={0} sx={{ maxWidth: 1120, mx: "auto" }}>
        {sortedUnits.map((unit, index) => (
          <ExerciseUnitAccordion
            key={unit.id}
            unit={unit}
            exercises={exercisesByUnitId.get(unit.id) ?? []}
            defaultExpanded={index === 0}
          />
        ))}
      </Stack>
    </>
  );
}
