import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@/components/layout";

const ERROR_404_IMAGE = "/assets/error-404.svg";

type NotFoundViewProps = {
  title: string;
  message: string;
  goHomeLabel: string;
  homeHref: string;
};

export default function NotFoundView({
  title,
  message,
  goHomeLabel,
  homeHref,
}: NotFoundViewProps) {
  return (
    <PageContainer
      sx={{
        minHeight: { xs: "calc(100dvh - 85px)", sm: "70dvh", md: "75dvh" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 2, sm: 4, md: 6 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Stack
        spacing={{ xs: 2, sm: 2.5, md: 3 }}
        sx={{
          width: "100%",
          maxWidth: { xs: 320, sm: 400, md: 480, lg: 520 },
          mx: "auto",
          textAlign: "center",
          alignItems: "center",
        }}
      >
        <Box
          component="img"
          src={ERROR_404_IMAGE}
          alt=""
          sx={{
            display: "block",
            width: "100%",
            maxWidth: { xs: 220, sm: 300, md: 360, lg: 420 },
            height: "auto",
            aspectRatio: "1 / 1",
            objectFit: "contain",
          }}
        />
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" },
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{
            width: "100%",
            maxWidth: 420,
            px: { xs: 0.5, sm: 0 },
            fontSize: { xs: "0.9375rem", sm: "1rem" },
            lineHeight: 1.6,
            wordBreak: "break-word",
          }}
        >
          {message}
        </Typography>
        <Button
          variant="contained"
          href={homeHref}
          sx={{
            mt: { xs: 0.5, sm: 1 },
            minWidth: { xs: "100%", sm: 160 },
            maxWidth: { xs: "100%", sm: 280 },
            py: { xs: 1.25, sm: 1 },
            fontSize: { xs: "0.9375rem", sm: "1rem" },
          }}
        >
          {goHomeLabel}
        </Button>
      </Stack>
    </PageContainer>
  );
}
