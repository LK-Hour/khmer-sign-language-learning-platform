"use client";

import SearchIcon from "@mui/icons-material/Search";
import {
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";
import {
  KslColors,
  KslFontSizes,
  KslPalette,
  KslRadii,
} from "@/theme/theme";

import type {
  DictionarySortOrder,
  DictionaryTypeFilter,
} from "../types";

type DictionaryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sortOrder: DictionarySortOrder | "";
  onSortOrderChange: (value: DictionarySortOrder | "") => void;
  typeFilter: DictionaryTypeFilter;
  onTypeFilterChange: (value: DictionaryTypeFilter) => void;
  resultCount: number;
};

export default function DictionaryToolbar({
  search,
  onSearchChange,
  sortOrder,
  onSortOrderChange,
  typeFilter,
  onTypeFilterChange,
  resultCount,
}: DictionaryToolbarProps) {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={0}
      component={Stack}
      spacing={{ xs: 2, md: 2.5 }}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: `${KslRadii.card}px`,
        border: `1px solid ${KslColors.border}`,
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "flex-end" } }}
      >
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="label"
            htmlFor="dictionary-search"
            sx={{
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              color: KslColors.textPrimary,
            }}
          >
            {t("dictSearchLabel")}
          </Typography>
          <TextField
            id="dictionary-search"
            fullWidth
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("dictSearchPlaceholder")}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: KslColors.textSecondary, fontSize: 22 }}
                    />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: KslFontSizes.md,
                  borderRadius: `${KslRadii.button}px`,
                  bgcolor: KslPalette.primary.lighter,
                  "& fieldset": { borderColor: KslColors.border },
                },
              },
            }}
          />
        </Stack>

        <FormControl sx={{ minWidth: { xs: "100%", md: 160 } }}>
          <InputLabel id="dictionary-order-label">{t("dictOrderLabel")}</InputLabel>
          <Select
            labelId="dictionary-order-label"
            label={t("dictOrderLabel")}
            value={sortOrder}
            displayEmpty
            renderValue={(selected) => {
              if (selected === "az") return t("dictOrderAz");
              if (selected === "za") return t("dictOrderZa");
              return t("dictOrderDefault");
            }}
            onChange={(event) =>
              onSortOrderChange(event.target.value as DictionarySortOrder | "")
            }
            sx={{
              borderRadius: `${KslRadii.button}px`,
              bgcolor: "background.paper",
            }}
          >
            <MenuItem value="">{t("dictOrderDefault")}</MenuItem>
            <MenuItem value="az">{t("dictOrderAz")}</MenuItem>
            <MenuItem value="za">{t("dictOrderZa")}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <ToggleButtonGroup
          exclusive
          value={typeFilter}
          onChange={(_, value: DictionaryTypeFilter | null) => {
            if (value) onTypeFilterChange(value);
          }}
          aria-label={t("dictTypeFilterLabel")}
          sx={{
            flexWrap: "wrap",
            "& .MuiToggleButton-root": {
              px: 2.5,
              py: 0.75,
              fontWeight: 700,
              fontSize: KslFontSizes.sm,
              borderRadius: `${KslRadii.button}px !important`,
              borderColor: `${KslColors.border} !important`,
              color: KslColors.textSecondary,
              "&.Mui-selected": {
                bgcolor: KslColors.primary,
                color: "#fff",
                borderColor: `${KslColors.primary} !important`,
                "&:hover": { bgcolor: KslColors.primaryDark },
              },
            },
          }}
        >
          <ToggleButton value="all">{t("dictFilterAll")}</ToggleButton>
          <ToggleButton value="character">{t("dictFilterCharacters")}</ToggleButton>
          <ToggleButton value="word">{t("dictFilterWords")}</ToggleButton>
        </ToggleButtonGroup>

        <Typography
          sx={{
            fontSize: KslFontSizes.sm,
            fontWeight: 600,
            color: KslColors.textSecondary,
          }}
        >
          {t("dictResultCount", { count: resultCount })}
        </Typography>
      </Stack>
    </Paper>
  );
}
