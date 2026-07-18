import Image from "next/image";
import { Stack } from "@mui/material";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import { KslColors, KslRadii } from "@/theme/theme";

type SignImageCardProps = {
  src: string;
  alt: string;
  highlight?: boolean;
};

export default function FingerSpellingSignImageCard({ src, alt, highlight }: SignImageCardProps) {
  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
        bgcolor: KslColors.primaryLighter,
      }}
    >
      <Image
        src={resolveApiAssetUrl(src) ?? src}
        alt={alt}
        fill
        sizes="(max-width: 900px) 100vw, 33vw"
        style={{ objectFit: "cover" }}
        priority
      />
    </Stack>
  );
}
