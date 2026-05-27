import List from "@mui/material/List";
import { notFound } from "next/navigation";
import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import LessonListItem from "@/features/finger-spelling/components/LessonListItem";
import {
  fetchFsChapter,
  fetchFsLessons,
} from "@/features/finger-spelling/api/curriculum";
import { ROUTES } from "@/constants/routes";

type PageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ChapterLessonsPage({ params }: PageProps) {
  const { chapterId } = await params;
  const id = Number(chapterId);
  if (Number.isNaN(id)) notFound();

  const [chapter, lessons] = await Promise.all([
    fetchFsChapter(id),
    fetchFsLessons(id),
  ]);
  if (!chapter) notFound();

  return (
    <FsMobileShell
      title={chapter.title}
      subtitle={chapter.titleKh}
      showBack
      backHref={ROUTES.fingerSpelling.unit(chapter.unitId)}
    >
      <List disablePadding>
        {lessons.map((lesson, index) => (
          <LessonListItem key={lesson.id} lesson={lesson} index={index} />
        ))}
      </List>
    </FsMobileShell>
  );
}
