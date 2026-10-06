"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import UnfoldLessRoundedIcon from "@mui/icons-material/UnfoldLessRounded";
import {
  Badge,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslPalette, KslRadii } from "@/theme/theme";

import type { TrackStatusFilter } from "./useTrackFilters";

const STATUS_OPTIONS: { value: TrackStatusFilter; labelKey: Parameters<ReturnType<typeof useTranslation>["t"]>[0] }[] = [
  { value: "all", labelKey: "TRACK_FILTER.STATUS_ALL" },
  { value: "not_started", labelKey: "TRACK_FILTER.STATUS_NOT_STARTED" },
  { value: "in_progress", labelKey: "TRACK_FILTER.STATUS_IN_PROGRESS" },
  { value: "completed", labelKey: "TRACK_FILTER.STATUS_COMPLETED" },
  { value: "locked", labelKey: "TRACK_FILTER.STATUS_LOCKED" },
];

type TrackToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  unitOptions: { id: number; label: string }[];
  unitIds: number[];
  onUnitIdsChange: (ids: number[]) => void;
  status: TrackStatusFilter;
  onStatusChange: (status: TrackStatusFilter) => void;
  activeFilterCount: number;
  canCollapse: boolean;
  onCollapseAll: () => void;
};

const SECTION_LABEL_SX = {
  fontSize: KslFontSizes.xs,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: KslColors.textSecondary,
} as const;

/** Collapse-all + search field with an inline filter popover for track pages. */
export default function TrackToolbar({
  query,
  onQueryChange,
  placeholder,
  unitOptions,
  unitIds,
  onUnitIdsChange,
  status,
  onStatusChange,
  activeFilterCount,
  canCollapse,
  onCollapseAll,
}: TrackToolbarProps) {
  const { t } = useTranslation();
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

  const toggleUnit = (id: number) =>
    onUnitIdsChange(unitIds.includes(id) ? unitIds.filter((value) => value !== id) : [...unitIds, id]);

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, width: { xs: "100%", md: "auto" } }}>
      <Tooltip title={t("TRACK_FILTER.COLLAPSE_ALL")}>
        {/* span keeps the tooltip working while the button is disabled */}
        <span>
          <IconButton
            onClick={onCollapseAll}
            disabled={!canCollapse}
            aria-label={t("TRACK_FILTER.COLLAPSE_ALL")}
            sx={{
              width: 44,
              height: 44,
              borderRadius: `${KslRadii.button - 4}px`,
              border: `1px solid ${KslColors.border}`,
              color: KslColors.primaryDark,
              transition: "background-color 0.2s, border-color 0.2s",
              "&:hover": { bgcolor: KslPalette.primary.lighter, borderColor: KslColors.primary },
              "&.Mui-disabled": { color: KslColors.disabled, opacity: 0.5 },
            }}
          >
            <UnfoldLessRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>

      <TextField
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        size="small"
        sx={{ flex: 1, width: { md: 360, lg: 400 } }}
        slotProps={{
          htmlInput: { "aria-label": t("TRACK_FILTER.SEARCH_LABEL"), type: "search" },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: KslColors.textSecondary }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end" sx={{ gap: 0.25 }}>
                {query ? (
                  <IconButton
                    size="small"
                    aria-label={t("TRACK_FILTER.SEARCH_CLEAR")}
                    onClick={() => onQueryChange("")}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                <Tooltip title={t("TRACK_FILTER.FILTER")}>
                  <IconButton
                    size="small"
                    aria-label={t("TRACK_FILTER.FILTER")}
                    aria-haspopup="dialog"
                    aria-expanded={Boolean(filterAnchor)}
                    onClick={(event) => setFilterAnchor(event.currentTarget)}
                    sx={{
                      color: activeFilterCount > 0 ? KslColors.primary : KslColors.textSecondary,
                      bgcolor: activeFilterCount > 0 ? KslPalette.primary.lighter : "transparent",
                    }}
                  >
                    <Badge
                      badgeContent={activeFilterCount}
                      color="primary"
                      sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16 } }}
                    >
                      <TuneRoundedIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
            sx: {
              height: 44,
              borderRadius: `${KslRadii.button - 4}px`,
              bgcolor: "background.paper",
              "& fieldset": { borderColor: KslColors.border },
              // Hide the browser's own clear button; we render our own.
              "& input::-webkit-search-cancel-button": { display: "none" },
            },
          },
        }}
      />

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 320,
              maxWidth: "calc(100vw - 32px)",
              borderRadius: `${KslRadii.card}px`,
              border: `1px solid ${KslColors.border}`,
              boxShadow: "0 16px 40px rgba(20, 40, 76, 0.16)",
            },
          },
        }}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography sx={SECTION_LABEL_SX}>{t("TRACK_FILTER.FILTER_STATUS")}</Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
              {STATUS_OPTIONS.map((option) => {
                const selected = status === option.value;
                return (
                  <Chip
                    key={option.value}
                    label={t(option.labelKey)}
                    onClick={() => onStatusChange(option.value)}
                    variant={selected ? "filled" : "outlined"}
                    aria-pressed={selected}
                    sx={{
                      fontWeight: 700,
                      fontSize: KslFontSizes.xs,
                      borderColor: selected ? KslColors.primary : KslColors.border,
                      bgcolor: selected ? KslPalette.primary.light : "transparent",
                      color: selected ? KslColors.primaryDark : KslColors.textSecondary,
                      "&:hover": { bgcolor: KslPalette.primary.lighter },
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={0.5}>
            <Typography sx={SECTION_LABEL_SX}>{t("TRACK_FILTER.FILTER_UNIT")}</Typography>
            <Stack sx={{ maxHeight: 260, overflowY: "auto" }}>
              {unitOptions.map((option) => (
                <FormControlLabel
                  key={option.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={unitIds.includes(option.id)}
                      onChange={() => toggleUnit(option.id)}
                    />
                  }
                  label={option.label}
                  sx={{
                    mx: 0,
                    borderRadius: "8px",
                    "&:hover": { bgcolor: KslPalette.primary.lighter },
                    "& .MuiFormControlLabel-label": {
                      fontSize: KslFontSizes.sm,
                      fontWeight: 600,
                      color: KslColors.textPrimary,
                    },
                  }}
                />
              ))}
            </Stack>
          </Stack>

          <Stack direction="row" sx={{ justifyContent: "space-between", pt: 0.5 }}>
            <Button
              size="small"
              disabled={activeFilterCount === 0}
              onClick={() => {
                onUnitIdsChange([]);
                onStatusChange("all");
              }}
              sx={{ color: KslColors.textSecondary }}
            >
              {t("TRACK_FILTER.CLEAR")}
            </Button>
            <Button size="small" variant="contained" disableElevation onClick={() => setFilterAnchor(null)}>
              {t("TRACK_FILTER.DONE")}
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </Stack>
  );
}
