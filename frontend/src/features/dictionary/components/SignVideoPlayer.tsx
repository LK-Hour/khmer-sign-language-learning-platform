"use client";

import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import { KslColors } from "@/theme/theme";

import DictionaryPillRow from "./DictionaryPillRow";

const SPEEDS = ["0.5", "0.75", "1"] as const;
type Speed = (typeof SPEEDS)[number];

type SignVideoPlayerProps = {
  src: string;
  label: string;
};

/**
 * Looping, muted sign video with the controls that matter for learning
 * a sign: pause, replay from the start, and slow motion.
 */
export default function SignVideoPlayer({ src, label }: SignVideoPlayerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>("1");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = Number(speed);
  }, [speed]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  return (
    <Stack sx={{ position: "absolute", inset: 0, bgcolor: "#0d1b2f" }}>
      <video
        ref={videoRef}
        src={src}
        aria-label={label}
        autoPlay
        muted
        loop
        playsInline
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = Number(speed);
        }}
        onTimeUpdate={(event) => {
          const { currentTime, duration } = event.currentTarget;
          setProgress(duration ? currentTime / duration : 0);
        }}
        style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "pointer" }}
      />

      <AnimatePresence>
        {!playing ? (
          <motion.button
            key="paused"
            type="button"
            aria-label={t("DICTIONARY.DETAIL.PLAY")}
            onClick={togglePlay}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
              width: 72,
              height: 72,
              border: "none",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.92)",
              color: KslColors.primary,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <PlayArrowRoundedIcon sx={{ fontSize: 44 }} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <Stack
        direction="row"
        sx={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 0.75,
          borderRadius: "999px",
          bgcolor: "rgba(255, 255, 255, 0.94)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)",
        }}
      >
        <Tooltip title={playing ? t("DICTIONARY.DETAIL.PAUSE") : t("DICTIONARY.DETAIL.PLAY")}>
          <IconButton
            size="small"
            onClick={togglePlay}
            aria-label={playing ? t("DICTIONARY.DETAIL.PAUSE") : t("DICTIONARY.DETAIL.PLAY")}
            sx={{ color: KslColors.textPrimary }}
          >
            {playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t("DICTIONARY.DETAIL.REPLAY")}>
          <IconButton
            size="small"
            onClick={replay}
            aria-label={t("DICTIONARY.DETAIL.REPLAY")}
            sx={{ color: KslColors.textPrimary }}
          >
            <ReplayRoundedIcon />
          </IconButton>
        </Tooltip>

        <Stack
          aria-hidden
          sx={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            bgcolor: KslColors.border,
            overflow: "hidden",
          }}
        >
          <Stack
            sx={{
              height: "100%",
              width: `${progress * 100}%`,
              bgcolor: KslColors.primary,
              transition: "width 0.25s linear",
            }}
          />
        </Stack>

        <Stack>
          <DictionaryPillRow
            size="small"
            ariaLabel={t("DICTIONARY.DETAIL.SPEED_LABEL")}
            layoutId="dictionary-speed"
            selected={speed}
            onSelect={setSpeed}
            items={SPEEDS.map((value) => ({ value, label: `${value}×` }))}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
