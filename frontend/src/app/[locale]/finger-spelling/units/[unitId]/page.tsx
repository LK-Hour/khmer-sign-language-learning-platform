import { notFound } from "next/navigation";
import {
  fetchFsChapters,
  fetchFsUnit,
} from "@/features/finger-spelling/api/curriculum";
import {
  ChapterList,
  FingerSpellingShell,
} from "@/features/finger-spelling/components";

type PageProps = {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ chapter?: string }>;
};

export default async function UnitChaptersPage({
  params,
  searchParams,
}: PageProps) {
  const { unitId } = await params;
  const { chapter: chapterParam } = await searchParams;
  const id = Number(unitId);
  if (Number.isNaN(id)) notFound();

  const expandedChapterId = chapterParam ? Number(chapterParam) : undefined;

  const [unit, chapters] = await Promise.all([
    fetchFsUnit(id),
    fetchFsChapters(id),
  ]);
  if (!unit) notFound();

  return (
    <FingerSpellingShell
      title={unit.title}
      titleKh={unit.titleKh}
      contextUnitIndex={unit.orderIndex}
      contextTitle={unit.title}
      contextTitleKh={unit.titleKh}
    >
      <ChapterList
        chapters={chapters}
        defaultExpandedFirst={expandedChapterId == null}
        expandedChapterId={
          expandedChapterId != null && !Number.isNaN(expandedChapterId)
            ? expandedChapterId
            : undefined
        }
      />
    </FingerSpellingShell>
  );
}
