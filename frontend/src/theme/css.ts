import type { CSSObject } from "@mui/material/styles";

type BgBlurOptions = {
  color?: string;
  blur?: number;
  opacity?: number;
  imgUrl?: string;
};

export function bgBlur({
  color = "#000000",
  blur = 6,
  opacity = 0.8,
  imgUrl,
}: BgBlurOptions = {}): CSSObject {
  const base: CSSObject = {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backgroundColor: color,
  };

  if (!imgUrl) {
    return base;
  }

  return {
    ...base,
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      zIndex: -1,
      opacity,
      backgroundImage: `url(${imgUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
  };
}
