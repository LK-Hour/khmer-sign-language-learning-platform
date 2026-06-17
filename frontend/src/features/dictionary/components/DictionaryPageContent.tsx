"use client";

import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import GestureIcon from "@mui/icons-material/Gesture";
import {
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import {
  KslColors,
  KslFontSizes,
  KslLineHeights,
  KslPalette,
  KslRadii,
} from "@/theme/theme";

import type {
  DictionarySortOrder,
  DictionaryTypeFilter,
  DictionaryWord,
} from "../types";
import DictionaryEntryCard from "./DictionaryEntryCard";
import DictionaryToolbar from "./DictionaryToolbar";

type DictionaryPageContentProps = {
  words: DictionaryWord[];
};

function countByType(words: DictionaryWord[], type: DictionaryTypeFilter) {
  if (type === "all") return words.length;
  return words.filter((word) => (word.entryType ?? "character") === type).length;
}

export default function DictionaryPageContent({
  words,
}: DictionaryPageContentProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<DictionarySortOrder | "">("");
  const [typeFilter, setTypeFilter] = useState<DictionaryTypeFilter>("all");

  const characterCount = useMemo(
    () => countByType(words, "character"),
    [words]
  );
  const wordCount = useMemo(() => countByType(words, "word"), [words]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    let items = words.filter((word) => {
      if (typeFilter !== "all" && (word.entryType ?? "character") !== typeFilter) {
        return false;
      }

      if (!query) return true;

      return (
        word.textEn.toLowerCase().includes(query) ||
        word.textKh.includes(query) ||
        word.description?.toLowerCase().includes(query)
      );
    });

    if (sortOrder === "az" || sortOrder === "za") {
      items = [...items].sort((a, b) => {
        const cmp = a.textEn.localeCompare(b.textEn, undefined, {
          sensitivity: "base",
        });
        return sortOrder === "az" ? cmp : -cmp;
      });
    }

    return items;
  }, [search, sortOrder, typeFilter, words]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            component={Stack}
            direction="row"
            spacing={2}
            sx={{
              p: 2,
              height: "100%",
              alignItems: "center",
              borderRadius: `${KslRadii.card}px`,
              border: `1px solid ${KslPalette.primary.light}`,
              bgcolor: KslPalette.primary.lighter,
            }}
          >
            <Stack
              sx={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: `${KslRadii.button}px`,
                bgcolor: KslPalette.primary.light,
                color: KslColors.primaryDark,
              }}
            >
              <GestureIcon />
            </Stack>
            <Stack spacing={0.25}>
              <Typography
                sx={{
                  fontSize: KslFontSizes["2xl"],
                  fontWeight: 700,
                  lineHeight: 1,
                  color: KslColors.textPrimary,
                }}
              >
                {characterCount}
              </Typography>
              <Typography
                sx={{
                  fontSize: KslFontSizes.sm,
                  color: KslColors.textSecondary,
                }}
              >
                {t("dictStatCharacters")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            component={Stack}
            direction="row"
            spacing={2}
            sx={{
              p: 2,
              height: "100%",
              alignItems: "center",
              borderRadius: `${KslRadii.card}px`,
              border: `1px solid ${KslPalette.secondary.light}`,
              bgcolor: KslPalette.secondary.lighter,
            }}
          >
            <Stack
              sx={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: `${KslRadii.button}px`,
                bgcolor: KslPalette.secondary.light,
                color: KslColors.secondaryDark,
              }}
            >
              <AutoStoriesIcon />
            </Stack>
            <Stack spacing={0.25}>
              <Typography
                sx={{
                  fontSize: KslFontSizes["2xl"],
                  fontWeight: 700,
                  lineHeight: 1,
                  color: KslColors.textPrimary,
                }}
              >
                {wordCount}
              </Typography>
              <Typography
                sx={{
                  fontSize: KslFontSizes.sm,
                  color: KslColors.textSecondary,
                }}
              >
                {t("dictStatWords")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <DictionaryToolbar
        search={search}
        onSearchChange={setSearch}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <Paper
          elevation={0}
          component={Stack}
          spacing={1}
          sx={{
            alignItems: "center",
            py: 6,
            px: 3,
            textAlign: "center",
            borderRadius: `${KslRadii.card}px`,
            border: `1px dashed ${KslColors.border}`,
            bgcolor: KslPalette.primary.lighter,
          }}
        >
          <Typography
            sx={{
              fontSize: KslFontSizes.lg,
              fontWeight: 700,
              color: KslColors.textPrimary,
            }}
          >
            {t("dictNoResultsTitle")}
          </Typography>
          <Typography
            sx={{
              maxWidth: 420,
              fontSize: KslFontSizes.sm,
              lineHeight: KslLineHeights.sm,
              color: KslColors.textSecondary,
            }}
          >
            {t("dictNoResultsHint")}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((word) => (
            <Grid key={word.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <DictionaryEntryCard word={word} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
