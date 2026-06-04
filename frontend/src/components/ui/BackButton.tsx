"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import { useRouter } from "next/navigation";
import { kslColors } from "@/theme/theme";

type BackButtonProps = {
  href?: string;
  onClick?: () => void;
  "aria-label"?: string;
};

export default function BackButton({
  href,
  onClick,
  "aria-label": ariaLabel = "Go back",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      router.push(href);
      return;
    }
    router.back();
  };

  return (
    <IconButton
      onClick={handleClick}
      aria-label={ariaLabel}
      sx={{
        width: 41,
        height: 41,
        color: kslColors.secondary,
      }}
    >
      <ArrowBackIcon />
    </IconButton>
  );
}
