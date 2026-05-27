import Stack from "@mui/material/Stack";
import { notFound } from "next/navigation";
import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import ChapterCard from "@/features/finger-spelling/components/ChapterCard";
import {
  fetchFsChapters,
  fetchFsUnit,
} from "@/features/finger-spelling/api/curriculum";
import { ROUTES } from "@/constants/routes";

type PageProps = {
  params: Promise<{ unitId: string }>;
};

export default async function UnitChaptersPage({ params }: PageProps) {
  const { unitId } = await params;
  const id = Number(unitId);
  if (Number.isNaN(id)) notFound();

  const [unit, chapters] = await Promise.all([
    fetchFsUnit(id),
    fetchFsChapters(id),
  ]);
  if (!unit) notFound();

  return (
    <FsMobileShell
      title={unit.title}
      subtitle={unit.titleKh}
      showBack
      backHref={ROUTES.fingerSpelling.root}
    >
      <Stack spacing={2}>
        {chapters.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} />
        ))}
      </Stack>
    </FsMobileShell>
  );
}
