import Image from "next/image";
import { Stack } from "@mui/material";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import { KslRadii, KslShadows } from "@/theme/theme";

type SignImageCardProps = {
  src: string;
  alt: string;
};

export default function SignImageCard({ src, alt }: SignImageCardProps) {
  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
        boxShadow: KslShadows.drop,
        bgcolor: "#dce9e3",
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
