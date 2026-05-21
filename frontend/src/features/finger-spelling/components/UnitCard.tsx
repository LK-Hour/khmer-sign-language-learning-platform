import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { FsUnit } from "../types";

type UnitCardProps = {
  unit: FsUnit;
};

export default function UnitCard({ unit }: UnitCardProps) {
  const progress =
    unit.totalLessonCount > 0
      ? Math.round((unit.completedLessonCount / unit.totalLessonCount) * 100)
      : 0;

  return (
    <Card>
      <CardActionArea
        component={Link}
        href={ROUTES.fingerSpelling.unit(unit.id)}
      >
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {unit.orderIndex}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {unit.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {unit.titleKh}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {unit.completedLessonCount}/{unit.totalLessonCount} lessons
            </Typography>
          </Box>
          <ChevronRightIcon color="action" />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
