"use client";

import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useTranslation } from "@/i18n/useTranslation";
import { kslColors, kslFontSizes, kslRadii, kslShadows } from "@/theme/theme";

type DictionarySearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
};

export default function DictionarySearchBar({
  value,
  onChange,
  onFilterClick,
}: DictionarySearchBarProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mb: 2,
      }}
    >
      <TextField
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("fsDictionarySearchPlaceholder")}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: kslColors.textSecondary, fontSize: 22 }} />
              </InputAdornment>
            ),
            sx: {
              fontSize: kslFontSizes.md,
              bgcolor: "background.paper",
              borderRadius: `${kslRadii.card}px`,
              boxShadow: kslShadows.card,
              "& fieldset": { borderColor: kslColors.border },
            },
          },
        }}
      />
      <IconButton
        aria-label={t("fsDictionaryFilter")}
        onClick={onFilterClick}
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          bgcolor: "background.paper",
          border: `1px solid ${kslColors.border}`,
          borderRadius: `${kslRadii.card}px`,
          boxShadow: kslShadows.card,
          color: kslColors.secondary,
        }}
      >
        <TuneIcon />
      </IconButton>
    </Box>
  );
}
