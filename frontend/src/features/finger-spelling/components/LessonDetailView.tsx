import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { FsLessonDetail } from "../types";

type LessonDetailViewProps = {
  lesson: FsLessonDetail;
  chapterId: number;
  nextLessonId?: number;
};

export default function LessonDetailView({
  lesson,
  chapterId,
  nextLessonId,
}: LessonDetailViewProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Card sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            bgcolor: "grey.50",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 280,
            p: 2,
          }}
        >
          <Image
            src={lesson.imageUrl}
            alt={`Hand sign for ${lesson.letter}`}
            width={240}
            height={240}
            priority
            style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
          />
        </Box>
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="h2" component="p" fontWeight={700}>
            {lesson.letter}
          </Typography>
          {lesson.romanization && (
            <Typography variant="h6" color="primary.main" sx={{ mt: 0.5 }}>
              {lesson.romanization}
            </Typography>
          )}
          {lesson.letterNameKh && (
            <Typography variant="body1" sx={{ mt: 1 }}>
              {lesson.letterNameKh}
            </Typography>
          )}
          {lesson.letterNameEn && (
            <Typography variant="body2" color="text.secondary">
              {lesson.letterNameEn}
            </Typography>
          )}
        </CardContent>
      </Card>

      {lesson.description && (
        <Typography variant="body2" color="text.secondary">
          {lesson.descriptionKh ?? lesson.description}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
        {nextLessonId && (
          <Button
            component={Link}
            href={ROUTES.fingerSpelling.lesson(nextLessonId)}
            variant="contained"
            size="large"
            fullWidth
          >
            Next letter
          </Button>
        )}
        <Button
          component={Link}
          href={ROUTES.fingerSpelling.chapter(chapterId)}
          variant="outlined"
          size="large"
          fullWidth
        >
          Back to lessons
        </Button>
      </Box>
    </Box>
  );
}
