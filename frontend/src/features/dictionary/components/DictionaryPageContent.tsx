"use client";

import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import GestureIcon from "@mui/icons-material/Gesture";
import { CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { fetchAllDictionaryWords } from "@/features/dictionary/api/dictionary";
import {
  countDictionaryEntryTypes,
  filterDictionaryWords,
  paginateDictionaryWords,
  sortDictionaryWords,
} from "@/features/dictionary/utils/dictionaryList";
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
import { DICTIONARY_PAGE_SIZE } from "../types";
import DictionaryEntryCard from "./DictionaryEntryCard";
import DictionaryPagination from "./DictionaryPagination";
import DictionaryToolbar from "./DictionaryToolbar";

export default function DictionaryPageContent() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [sortOrder, setSortOrder] = useState<DictionarySortOrder>("default");
  const [typeFilter, setTypeFilter] = useState<DictionaryTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [allWords, setAllWords] = useState<DictionaryWord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWords() {
      setError(null);

      try {
        const items = await fetchAllDictionaryWords();
        if (!cancelled) {
          setAllWords(items);
        }
      } catch {
        if (!cancelled) {
          setAllWords([]);
          setError(t("DICTIONARY.LIST.LOAD_ERROR"));
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    void loadWords();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const { characterCount, wordCount } = useMemo(
    () => countDictionaryEntryTypes(allWords),
    [allWords],
  );

  const filteredWords = useMemo(
    () =>
      sortDictionaryWords(
        filterDictionaryWords(allWords, {
          search: searchInput,
          entryType: typeFilter,
        }),
        sortOrder,
      ),
    [allWords, searchInput, sortOrder, typeFilter],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredWords.length / DICTIONARY_PAGE_SIZE),
  );
  const safePage = Math.min(page, pageCount);

  const visibleWords = useMemo(
    () => paginateDictionaryWords(filteredWords, safePage),
    [filteredWords, safePage],
  );

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
                {t("DICTIONARY.LIST.STAT_CHARACTERS")}
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
                {t("DICTIONARY.LIST.STAT_WORDS")}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <DictionaryToolbar
        search={searchInput}
        onSearchChange={(value) => {
          setSearchInput(value);
          setPage(1);
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(value) => {
          setSortOrder(value);
          setPage(1);
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(value) => {
          setTypeFilter(value);
          setPage(1);
        }}
        resultCount={filteredWords.length}
      />

      {initialLoading ? (
        <Stack sx={{ alignItems: "center", py: 6 }}>
          <CircularProgress aria-label={t("DICTIONARY.LIST.LOADING")} />
        </Stack>
      ) : error ? (
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
            {error}
          </Typography>
        </Paper>
      ) : filteredWords.length === 0 ? (
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
            {t("DICTIONARY.LIST.NO_RESULTS_TITLE")}
          </Typography>
          <Typography
            sx={{
              maxWidth: 420,
              fontSize: KslFontSizes.sm,
              lineHeight: KslLineHeights.sm,
              color: KslColors.textSecondary,
            }}
          >
            {t("DICTIONARY.LIST.NO_RESULTS_HINT")}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {visibleWords.map((word) => (
              <Grid key={word?.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <DictionaryEntryCard word={word} />
              </Grid>
            ))}
          </Grid>

          <Stack sx={{ alignItems: "center" }}>
            <DictionaryPagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </Stack>
        </>
      )}
    </Stack>
  );
}
