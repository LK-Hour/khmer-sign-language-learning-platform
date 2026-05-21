import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { FsLesson } from "../types";

type LessonListItemProps = {
  lesson: FsLesson;
  index: number;
};

function StatusIcon({ lesson }: { lesson: FsLesson }) {
  if (lesson.isLocked) return <LockOutlinedIcon color="disabled" />;
  if (lesson.progressStatus === "COMPLETED") {
    return <CheckCircleIcon color="success" />;
  }
  if (lesson.progressStatus === "IN_PROGRESS") {
    return <PlayCircleOutlineIcon color="primary" />;
  }
  return null;
}

export default function LessonListItem({ lesson, index }: LessonListItemProps) {
  const sx = {
    borderRadius: 2,
    mb: 1,
    bgcolor: "background.paper",
    border: 1,
    borderColor: "divider",
    opacity: lesson.isLocked ? 0.6 : 1,
  };

  const inner = (
      <Avatar
        variant="rounded"
        sx={{ width: 48, height: 48, mr: 2, bgcolor: "grey.100" }}
      >
        <Image
          src={lesson.imageUrl}
          alt={`Sign for ${lesson.letter}`}
          width={40}
          height={40}
          style={{ objectFit: "contain" }}
        />
      </Avatar>
      <ListItemText
        primary={
          <Typography variant="subtitle1" fontWeight={600}>
            {index + 1}. {lesson.letter}
            {lesson.romanization && (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                ({lesson.romanization})
              </Typography>
            )}
          </Typography>
        }
        secondary={lesson.letterNameKh ?? lesson.letterNameEn}
      />
      <Box sx={{ ml: 1 }}>
        <StatusIcon lesson={lesson} />
      </Box>
  );

  if (lesson.isLocked) {
    return (
      <ListItemButton disabled sx={sx}>
        {inner}
      </ListItemButton>
    );
  }

  return (
    <ListItemButton
      component={Link}
      href={ROUTES.fingerSpelling.lesson(lesson.id)}
      sx={sx}
    >
      {inner}
    </ListItemButton>
  );
}
