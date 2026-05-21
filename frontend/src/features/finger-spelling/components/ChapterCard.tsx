import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { FsChapter } from "../types";

type ChapterCardProps = {
  chapter: FsChapter;
};

export default function ChapterCard({ chapter }: ChapterCardProps) {
  const progress =
    chapter.lessonCount > 0
      ? Math.round((chapter.completedLessonCount / chapter.lessonCount) * 100)
      : 0;

  return (
    <Card>
      <CardActionArea
        component={Link}
        href={ROUTES.fingerSpelling.chapter(chapter.id)}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {chapter.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {chapter.titleKh}
              </Typography>
              {chapter.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {chapter.description}
                </Typography>
              )}
            </Box>
            <ChevronRightIcon color="action" />
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 2, height: 6, borderRadius: 3 }}
          />
          <Box
            sx={{
              mt: 1.5,
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {chapter.completedLessonCount}/{chapter.lessonCount} lessons
            </Typography>
            {chapter.isQuizUnlocked ? (
              <Chip
                size="small"
                icon={<QuizOutlinedIcon />}
                label="Quiz ready"
                color="primary"
                variant="outlined"
              />
            ) : (
              <Chip
                size="small"
                icon={<LockOutlinedIcon />}
                label="Quiz locked"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
