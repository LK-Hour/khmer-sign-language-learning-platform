import { notFound, redirect } from "next/navigation";
import { fetchFsChapter } from "@/features/finger-spelling/api/curriculum";
import { ROUTES } from "@/constants/routes";

type PageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ChapterLessonsPage({ params }: PageProps) {
  const { chapterId } = await params;
  const id = Number(chapterId);
  if (Number.isNaN(id)) notFound();

  const chapter = await fetchFsChapter(id);
  if (!chapter) notFound();

  redirect(ROUTES.fingerSpelling.unitChapter(chapter.unitId, chapter.id));
}
