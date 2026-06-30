"use client";

import { Stack } from "@mui/material";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import PlayButton from "@/components/ui/PlayButton";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type WdWordCardProps = {
  videoUrl: string;
};

export default function WdWordCard({ videoUrl }: WdWordCardProps) {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setHasStarted(false);
  }, [videoUrl]);

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
        boxShadow: KslShadows.drop,
        bgcolor: KslColors.primaryLight,
        "& video": {
          objectFit: "cover",
        },
        "& .react-player__preview": {
          backgroundSize: "cover !important",
        },
      }}
    >
      <ReactPlayer
        src={videoUrl}
        light={!hasStarted}
        playIcon={
          <Stack
            aria-hidden
            sx={{
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              bgcolor: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <PlayButton size={72} />
          </Stack>
        }
        playing={hasStarted}
        muted
        loop
        playsInline
        controls={false}
        width="100%"
        height="100%"
        {...(!hasStarted && {
          onClickPreview: () => setHasStarted(true),
        })}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          inset: 0,
        }}
      />
    </Stack>
  );
}
