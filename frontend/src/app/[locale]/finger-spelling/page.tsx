import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { fetchFsUnits } from "@/features/finger-spelling/api/curriculum";
import {
  FingerSpellingHomeShell,
  UnitCard,
} from "@/features/finger-spelling/components";

export default async function FingerSpellingHomePage() {
  let units;

  try {
    units = await fetchFsUnits();
  } catch {
    return (
      <FingerSpellingHomeShell>
        <Alert severity="error" sx={{ maxWidth: 1120, mx: "auto" }}>
          Could not load units from the backend. Make sure the API is running at{" "}
          {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}.
        </Alert>
      </FingerSpellingHomeShell>
    );
  }

  return (
    <FingerSpellingHomeShell>
      <Stack spacing={0} sx={{ maxWidth: 1120, mx: "auto" }}>
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </Stack>
    </FingerSpellingHomeShell>
  );
}
