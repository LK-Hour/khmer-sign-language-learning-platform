"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import PrimaryActionButton from "@/components/ui/PrimaryActionButton";
import { useTranslation } from "@/i18n/useTranslation";
import {
  KslColors,
  KslFontSizes,
  KslRadii,
  KslShadows,
} from "@/theme/theme";
import LessonWebcamPanel from "./LessonWebcamPanel";
import SignImageCard from "./SignImageCard";
import WordCard from "./WordCard";

type LessonPracticeStepProps = {
  letter: string;
  imageUrl: string;
  description?: string | null;
  accuracy: number | null;
  cameraResetKey: number;
  onRetry: () => void;
  onContinue: () => void;
};

export default function LessonPracticeStep({
  letter,
  imageUrl,
  description,
  accuracy,
  cameraResetKey,
  onRetry,
  onContinue,
}: LessonPracticeStepProps) {
  const { t } = useTranslation();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        gap: { xs: 3, lg: 5 },
        alignItems: { xs: "center", lg: "flex-start" },
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <SignImageCard src={imageUrl} alt={`Sign for ${letter}`} />
        <WordCard letter={letter} />
      </Box>

      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 552,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {description && (
          <Typography
            variant="body1"
            sx={{
              fontSize: KslFontSizes.md,
              lineHeight: KslFontSizes.lg,
              color: KslColors.textSecondary,
              textAlign: { xs: "center", lg: "left" },
              width: "100%",
            }}
          >
            {description}
          </Typography>
        )}

        <LessonWebcamPanel accuracy={accuracy} resetKey={cameraResetKey} />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            width: "100%",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{
              bgcolor: "background.paper",
              color: KslColors.secondary,
              minHeight: 72,
              px: 2,
              borderRadius: `${KslRadii.button}px`,
              boxShadow: KslShadows.card,
              fontSize: KslFontSizes.lg,
              fontWeight: 700,
              flex: { sm: 1 },
              maxWidth: { sm: 418 },
              "&:hover": {
                bgcolor: "background.paper",
                boxShadow: KslShadows.button,
              },
            }}
          >
            {t("fsRetry")}
          </Button>
          <PrimaryActionButton label={t("fsContinue")} onClick={onContinue} />
        </Box>
      </Box>
    </Box>
  );
}
