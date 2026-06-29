"use client";

import SearchIcon from "@mui/icons-material/Search";
import {
  FormControl,
  Grid,
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
  KslRadii,
} from "@/theme/theme";

import type {
  DictionarySortOrder,
  DictionaryTypeFilter,
} from "../types";

type DictionaryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sortOrder: DictionarySortOrder;
  onSortOrderChange: (value: DictionarySortOrder) => void;
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
  const { t, locale } = useTranslation();

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
      <Grid container spacing={2}>
        <Grid size={{ xs:12, md: 8}}>
        <TextField
            id="dictionary-search"
            fullWidth
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("DICTIONARY.LIST.SEARCH_PLACEHOLDER")}
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
                  "& fieldset": { borderColor: KslColors.border },
                },
              },
            }}
          />
        </Grid>
        <Grid size={{ xs:12, md:4}}>
        <FormControl sx={{ width: "100%" }}>
          <InputLabel id="dictionary-order-label">{t("DICTIONARY.LIST.ORDER_LABEL")}</InputLabel>
          <Select
            labelId="dictionary-order-label"
            label={t("DICTIONARY.LIST.ORDER_LABEL")}
            value={sortOrder}
            onChange={(event) =>
              onSortOrderChange(event.target.value as DictionarySortOrder)
            }
            sx={{
              borderRadius: `${KslRadii.button}px`,
              bgcolor: "background.paper",
            }}
          >
            <MenuItem value="default">{t("DICTIONARY.LIST.ORDER_DEFAULT")}</MenuItem>
            <MenuItem value="az">{t("DICTIONARY.LIST.ORDER_AZ")}</MenuItem>
            <MenuItem value="za">{t("DICTIONARY.LIST.ORDER_ZA")}</MenuItem>
          </Select>
        </FormControl>
        </Grid>
      </Grid>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "flex-end" } }}
      >
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="label"
            htmlFor="dictionary-search"
            sx={{
              fontSize: KslFontSizes.sm,
              fontWeight: 700,
              color: KslColors.textPrimary,
            }}
          >
            {t("DICTIONARY.LIST.SEARCH_LABEL")}
          </Typography>
          
        </Stack>

        
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
          aria-label={t("DICTIONARY.LIST.TYPE_FILTER_LABEL")}
          sx={{
            flexWrap: "wrap",
            gap: 1,
            "& .MuiToggleButtonGroup-grouped": {
              border: `1px solid ${KslColors.border} !important`,
              margin: 0,
              "&:not(:first-of-type)": {
                marginLeft: 0,
                borderLeft: `1px solid ${KslColors.border} !important`,
              },
            },
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
          <ToggleButton value="all">{t("DICTIONARY.LIST.FILTER_ALL")}</ToggleButton>
          <ToggleButton value="character">{t("DICTIONARY.LIST.FILTER_CHARACTERS")}</ToggleButton>
          <ToggleButton value="word">{t("DICTIONARY.LIST.FILTER_WORDS")}</ToggleButton>
        </ToggleButtonGroup>

        <Typography
          sx={{
            fontSize: KslFontSizes.sm,
            fontWeight: 600,
            color: KslColors.textSecondary,
          }}
        >
          {locale === "kh"
            ? `${t("PHRASES.RESULTS")} ${resultCount}`
            : `${resultCount} ${t("PHRASES.RESULTS")}`}
        </Typography>
      </Stack>
    </Paper>
  );
}
