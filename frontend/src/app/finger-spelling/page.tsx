import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import UnitCard from "@/features/finger-spelling/components/UnitCard";
import { fetchFsUnits } from "@/features/finger-spelling/api/curriculum";

export default async function FingerSpellingHomePage() {
  const units = await fetchFsUnits();

  return (
    <FsMobileShell title="Learn" subtitle="Finger spelling">
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose a unit to start learning Khmer letters with hand signs.
      </Typography>
      <Stack spacing={2}>
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </Stack>
    </FsMobileShell>
  );
}
