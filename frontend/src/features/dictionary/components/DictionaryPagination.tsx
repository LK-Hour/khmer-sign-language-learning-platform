"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, Stack, Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslPalette, KslRadii } from "@/theme/theme";

type PaginationItem = number | "ellipsis";

const MAX_PAGES_WITHOUT_ELLIPSIS = 7;

function getVisiblePages(current: number, total: number): PaginationItem[] {
  if (total <= 0) return [];
  if (total <= MAX_PAGES_WITHOUT_ELLIPSIS) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total];
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

type DictionaryPaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export default function DictionaryPagination({
  page,
  pageCount,
  onPageChange,
}: DictionaryPaginationProps) {
  const { t } = useTranslation();
  const visiblePages = getVisiblePages(page, pageCount);

  if (pageCount <= 1) return null;

  const navButtonSx = {
    minWidth: 0,
    px: 1,
    color: KslColors.primary,
    textTransform: "none" as const,
    fontWeight: 600,
    fontSize: KslFontSizes.sm,
    "&:hover": { bgcolor: "transparent", color: KslColors.primaryDark },
    "&.Mui-disabled": { color: KslColors.disabled },
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={3}
      role="navigation"
      aria-label={t("dictPaginationLabel")}
      sx={{ py: 1 }}
    >
      <Button
        variant="text"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        startIcon={<ChevronLeftIcon sx={{ fontSize: 20 }} />}
        sx={navButtonSx}
      >
        {t("dictPaginationBack")}
      </Button>

      <Stack direction="row" alignItems="center" spacing={1}>
        {visiblePages.map((item, index) =>
          item === "ellipsis" ? (
            <Typography
              key={`ellipsis-${index}`}
              aria-hidden
              sx={{
                minWidth: 32,
                textAlign: "center",
                fontWeight: 600,
                fontSize: KslFontSizes.sm,
                color: KslColors.textSecondary,
                userSelect: "none",
              }}
            >
              …
            </Typography>
          ) : (
            <Button
              key={item}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={t("dictPageLabel", { page: item, pages: pageCount })}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                p: 0,
                borderRadius: `${KslRadii.button}px`,
                fontWeight: 700,
                fontSize: KslFontSizes.sm,
                lineHeight: 1,
                border: `1px solid ${KslColors.border}`,
                ...(item === page
                  ? {
                      bgcolor: KslColors.primary,
                      color: "#fff",
                      borderColor: KslColors.primary,
                      "&:hover": { bgcolor: KslColors.primaryDark },
                    }
                  : {
                      bgcolor: KslPalette.primary.lighter,
                      color: KslColors.primaryDark,
                      "&:hover": { bgcolor: KslPalette.primary.light },
                    }),
              }}
            >
              {item}
            </Button>
          ),
        )}
      </Stack>

      <Button
        variant="text"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        endIcon={<ChevronRightIcon sx={{ fontSize: 20 }} />}
        sx={navButtonSx}
      >
        {t("dictPaginationNext")}
      </Button>
    </Stack>
  );
}
