import { fetchFsUnits } from "@/features/finger-spelling/api/curriculum";
import { fetchFsExercises } from "@/features/finger-spelling/api/practice";
import {
  ExercisePageContent,
  FingerSpellingExerciseShell,
} from "@/features/finger-spelling/components";

export default async function FingerSpellingExercisePage() {
  const [units, exercises] = await Promise.all([
    fetchFsUnits(),
    fetchFsExercises(),
  ]);

  return (
    <FingerSpellingExerciseShell>
      <ExercisePageContent units={units} exercises={exercises} />
    </FingerSpellingExerciseShell>
  );
}
