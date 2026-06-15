import { Alert } from "@mui/material";
import { PageContainer } from "@/components/layout";
import { fetchFsTrackUnits } from "@/features/finger-spelling/api/curriculum";
import { FingerSpellingTrackContainer } from "@/features/finger-spelling/components";
import type { FsTrackUnit } from "@/features/finger-spelling/store";

export default async function FingerSpellingHomePage() {
  let units: FsTrackUnit[];

  try {
    units = await fetchFsTrackUnits();
  } catch {
    return (
      <PageContainer>
        <Alert severity="error" sx={{ mx: "auto" }}>
        
          {process.env.NEXT_PUBLIC_API_URL}.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <FingerSpellingTrackContainer units={units} />
    </PageContainer>
  );
}
