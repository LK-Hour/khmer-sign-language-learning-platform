"use client";

import Stack from "@mui/material/Stack";
import type { FsChapter } from "../../types";
import ChapterAccordion from "./ChapterAccordion";

type ChapterListProps = {
  chapters: FsChapter[];
  defaultExpandedFirst?: boolean;
  expandedChapterId?: number;
};

export default function ChapterList({
  chapters,
  defaultExpandedFirst = false,
  expandedChapterId,
}: ChapterListProps) {
  return (
    <Stack spacing={1.5} sx={{ maxWidth: 1120, mx: "auto" }}>
      {chapters.map((chapter, index) => (
        <ChapterAccordion
          key={chapter.id}
          chapter={chapter}
          defaultExpanded={
            expandedChapterId != null
              ? chapter.id === expandedChapterId
              : defaultExpandedFirst && index === 0
          }
        />
      ))}
    </Stack>
  );
}
