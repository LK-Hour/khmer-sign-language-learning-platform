"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import LockBadge from "@/components/ui/LockBadge";
import PlayButton from "@/components/ui/PlayButton";
import { kslColors, kslFontSizes, kslRadii, kslShadows } from "@/theme/theme";

type CurriculumCardProps = {
  href?: string;
  badgeLabel: string;
  title: string;
  subtitle?: string;
  progressText?: string;
  progressPercent?: number;
  locked?: boolean;
  onClick?: () => void;
};

export default function CurriculumCard({
  href,
  badgeLabel,
  title,
  subtitle,
  progressText,
  progressPercent = 0,
  locked = false,
  onClick,
}: CurriculumCardProps) {
  const content = (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: { xs: 120, md: 140 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Badge label={badgeLabel} />
          <Typography
            variant="h5"
            sx={{
              mt: 1.5,
              fontFamily: "var(--font-inter), sans-serif",
              fontWeight: 400,
              fontSize: kslFontSizes.lg,
              color: kslColors.secondary,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              sx={{
                mt: 0.5,
                fontSize: { xs: kslFontSizes.md, md: kslFontSizes.lg },
                color: kslColors.secondary,
              }}
            >
              {subtitle}
            </Typography>
          )}
          {progressText && (
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                fontSize: kslFontSizes.sm,
                color: kslColors.textSecondary,
              }}
            >
              {progressText}
            </Typography>
          )}
        </Box>
        {locked ? <LockBadge /> : <PlayButton />}
      </Box>
      {!locked && progressPercent > 0 && (
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{ mt: 1.5, width: "100%" }}
        />
      )}
    </Box>
  );

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      sx={{
        borderRadius: `${kslRadii.card}px`,
        boxShadow: kslShadows.card,
        opacity: locked ? 0.75 : 1,
        mb: 2,
      }}
    >
      {href && !locked ? (
        <CardActionArea component={Link} href={href} onClick={onClick}>
          {content}
        </CardActionArea>
      ) : (
        <Box onClick={onClick} sx={{ cursor: locked ? "not-allowed" : "default" }}>
          {content}
        </Box>
      )}
    </Card>
  );
}
