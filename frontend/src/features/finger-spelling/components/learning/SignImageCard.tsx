import Box from "@mui/material/Box";
import Image from "next/image";
import { resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
import { KslRadii, KslShadows } from "@/theme/theme";

type SignImageCardProps = {
  src: string;
  alt: string;
};

export default function SignImageCard({ src, alt }: SignImageCardProps) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 640,
        aspectRatio: "16 / 9",
        borderRadius: `${KslRadii.signImage}px`,
        overflow: "hidden",
        boxShadow: KslShadows.drop,
        mx: "auto",
      }}
    >
      <Image
        src={resolveApiAssetUrl(src) ?? src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        style={{ objectFit: "cover" }}
        priority
      />
    </Box>
  );
}
