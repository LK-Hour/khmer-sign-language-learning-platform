"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MAIN_HEADER_HEIGHT } from "@/components/layout/header-nav/MainHeaderSkeleton";
import { useTranslation } from "@/i18n/useTranslation";
import { KslColors, KslFontSizes, KslPalette, KslRadii } from "@/theme/theme";

import type {
  DictionaryEntryType,
  DictionarySection,
  DictionaryWord,
} from "../types";
import { getDictionaryCategoryLabel } from "../utils/categoryLabel";
import {
  filterByEntryType,
  groupDictionaryWords,
  matchesDictionarySearch,
  sectionAnchorId,
} from "../utils/dictionaryList";
import CharacterTile from "./CharacterTile";
import DictionaryPillRow from "./DictionaryPillRow";
import { fadeUp, staggerGrid } from "./dictionaryMotion";
import WordCard from "./WordCard";

const WORDS_BATCH = 24;
const ALL_CATEGORIES = "all";
/** Search field (56px) plus its sticky strip's vertical padding. */
const SEARCH_BAR_HEIGHT = 72;
/** The jump bar sticks under the site header and the sticky search bar. */
const JUMP_BAR_TOP = MAIN_HEADER_HEIGHT + SEARCH_BAR_HEIGHT;
/** Where a unit section should land below both sticky bars. */
const JUMP_BAR_OFFSET = JUMP_BAR_TOP + 64;

type DictionaryBrowserProps = {
  words: DictionaryWord[];
  loadFailed: boolean;
  initialQuery: string;
  initialTab: DictionaryEntryType;
  initialCategory: string;
};

/**
 * Tracks which unit section the reader is looking at.
 *
 * Normally that is the last section whose top has passed under the sticky
 * bars. Sections at the very end of the page can never scroll that high, so
 * as the page nears its bottom the probe line slides down the viewport,
 * which lets the final sections become active too.
 */
function useActiveSection(anchorIds: string[]) {
  const [active, setActive] = useState<string | null>(anchorIds[0] ?? null);
  // While a jump-bar click is smooth-scrolling, keep the clicked section.
  const lockedRef = useRef<string | null>(null);
  const key = anchorIds.join("|");

  useEffect(() => {
    if (anchorIds.length === 0) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (lockedRef.current) return;

      const viewport = window.innerHeight;
      const remaining =
        document.documentElement.scrollHeight - (window.scrollY + viewport);
      const nearBottom = Math.max(0, 1 - remaining / viewport);
      const probe = JUMP_BAR_OFFSET + (viewport - JUMP_BAR_OFFSET) * nearBottom;

      let current = anchorIds[0];
      for (const id of anchorIds) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= probe + 1) current = id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // anchorIds is captured through `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const jumpTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    lockedRef.current = id;
    setActive(id);

    const release = () => {
      window.removeEventListener("scrollend", release);
      // Ignore stale timers from an earlier click.
      if (lockedRef.current === id) lockedRef.current = null;
    };
    window.addEventListener("scrollend", release);
    // Fallback for browsers without `scrollend`, or when no scroll happens.
    window.setTimeout(release, 1200);

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return { active, jumpTo };
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "baseline",
        justifyContent: "space-between",
        pb: 1.5,
        mb: 2,
        borderBottom: `1px solid ${KslColors.border}`,
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: KslFontSizes.lg,
          fontWeight: 700,
          color: KslColors.textPrimary,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: KslFontSizes.sm,
          fontWeight: 700,
          color: KslColors.textSecondary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </Typography>
    </Stack>
  );
}

function CharacterSections({
  sections,
  showJumpBar,
}: {
  sections: DictionarySection[];
  showJumpBar: boolean;
}) {
  const { t } = useTranslation();
  const anchorIds = useMemo(
    () => sections.map((section) => sectionAnchorId(section.category)),
    [sections],
  );
  const { active, jumpTo } = useActiveSection(showJumpBar ? anchorIds : []);

  return (
    <Stack spacing={5}>
      {showJumpBar ? (
        <Box
          sx={{
            position: "sticky",
            top: JUMP_BAR_TOP,
            zIndex: 2,
            mx: { xs: -2, md: 0 },
            px: { xs: 2, md: 0 },
            py: 1.5,
            bgcolor: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${KslColors.border}`,
          }}
        >
          <DictionaryPillRow
            ariaLabel={t("DICTIONARY.LIST.JUMP_LABEL")}
            layoutId="dictionary-jump"
            selected={active}
            items={sections.map((section) => ({
              value: sectionAnchorId(section.category),
              label: getDictionaryCategoryLabel(section.category, t),
            }))}
            onSelect={jumpTo}
          />
        </Box>
      ) : null}

      {sections.map((section) => (
        <Box
          key={section.category}
          component="section"
          id={sectionAnchorId(section.category)}
          sx={{ scrollMarginTop: `${JUMP_BAR_OFFSET}px` }}
        >
          <SectionHeading
            label={getDictionaryCategoryLabel(section.category, t)}
            count={section.words.length}
          />
          <motion.div
            variants={staggerGrid(0.014)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            style={{ display: "grid", gap: 10 }}
            className="dictionary-character-grid"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {section.words.map((word) => (
                <CharacterTile key={word.id} word={word} />
              ))}
            </AnimatePresence>
          </motion.div>
        </Box>
      ))}
    </Stack>
  );
}

function WordGrid({
  words,
  sections,
  category,
  onCategoryChange,
  limit,
  onShowMore,
}: {
  words: DictionaryWord[];
  sections: DictionarySection[];
  category: string;
  onCategoryChange: (value: string) => void;
  limit: number;
  onShowMore: () => void;
}) {
  const { t } = useTranslation();
  const visible = words.slice(0, limit);

  return (
    <Stack spacing={3}>
      <DictionaryPillRow
        ariaLabel={t("DICTIONARY.LIST.CATEGORY_LABEL")}
        layoutId="dictionary-category"
        selected={category}
        onSelect={onCategoryChange}
        items={[
          {
            value: ALL_CATEGORIES,
            label: t("DICTIONARY.LIST.FILTER_ALL"),
            count: sections.reduce(
              (sum, section) => sum + section.words.length,
              0,
            ),
          },
          ...sections.map((section) => ({
            value: section.category,
            label: getDictionaryCategoryLabel(section.category, t),
            count: section.words.length,
          })),
        ]}
      />

      <motion.div
        variants={staggerGrid(0.035)}
        initial="hidden"
        animate="show"
        className="dictionary-word-grid"
        style={{ display: "grid", gap: 16 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              caption={
                category === ALL_CATEGORIES
                  ? getDictionaryCategoryLabel(word.category, t)
                  : undefined
              }
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {words.length > limit ? (
        <Stack sx={{ alignItems: "center" }}>
          <Button
            variant="outlined"
            onClick={onShowMore}
            sx={{
              px: 3,
              borderColor: KslColors.border,
              color: KslColors.textPrimary,
              "&:hover": {
                borderColor: KslColors.primary,
                bgcolor: KslPalette.primary.lighter,
              },
            }}
          >
            {t("DICTIONARY.LIST.SHOW_MORE")} ({words.length - limit})
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}

function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Stack
        spacing={1.5}
        sx={{
          alignItems: "center",
          textAlign: "center",
          py: 8,
          px: 3,
          borderRadius: `${KslRadii.card}px`,
          border: `1px dashed ${KslColors.border}`,
        }}
      >
        <SearchOffRoundedIcon
          sx={{ fontSize: 40, color: KslColors.textSecondary }}
        />
        <Typography
          sx={{
            fontSize: KslFontSizes.lg,
            fontWeight: 700,
            color: KslColors.textPrimary,
          }}
        >
          {title}
        </Typography>
        {hint ? (
          <Typography
            sx={{
              maxWidth: 420,
              fontSize: KslFontSizes.sm,
              color: KslColors.textSecondary,
            }}
          >
            {hint}
          </Typography>
        ) : null}
        {action}
      </Stack>
    </motion.div>
  );
}

export default function DictionaryBrowser({
  words,
  loadFailed,
  initialQuery,
  initialTab,
  initialCategory,
}: DictionaryBrowserProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<DictionaryEntryType>(initialTab);
  const [category, setCategory] = useState(initialCategory || ALL_CATEGORIES);
  const [wordLimit, setWordLimit] = useState(WORDS_BATCH);

  // Keep state in the URL so "back" from a sign returns to the same view.
  // replaceState syncs with the Next router without a server round trip.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (tab === "word") params.set("tab", "words");
    if (tab === "word" && category !== ALL_CATEGORIES)
      params.set("cat", category);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      search ? `${pathname}?${search}` : pathname,
    );
  }, [query, tab, category, pathname]);

  // "/" focuses search, like most docs/dictionary sites.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const matched = useMemo(
    () =>
      words.filter((word) =>
        matchesDictionarySearch(word, query, [
          getDictionaryCategoryLabel(word.category, t),
        ]),
      ),
    [words, query, t],
  );
  const characters = useMemo(
    () => filterByEntryType(matched, "character"),
    [matched],
  );
  const wordEntries = useMemo(
    () => filterByEntryType(matched, "word"),
    [matched],
  );
  const characterSections = useMemo(
    () => groupDictionaryWords(characters),
    [characters],
  );
  const wordSections = useMemo(
    () => groupDictionaryWords(wordEntries),
    [wordEntries],
  );
  const visibleWords = useMemo(
    () =>
      category === ALL_CATEGORIES
        ? wordEntries
        : wordEntries.filter((word) => word.category === category),
    [wordEntries, category],
  );

  const isSearching = query.trim().length > 0;
  const currentCount =
    tab === "character" ? characters.length : visibleWords.length;
  const otherTab: DictionaryEntryType =
    tab === "character" ? "word" : "character";
  const otherCount =
    tab === "character" ? wordEntries.length : characters.length;

  const changeQuery = (value: string) => {
    setQuery(value);
    setWordLimit(WORDS_BATCH);
  };
  const changeTab = (value: DictionaryEntryType) => {
    setTab(value);
    setWordLimit(WORDS_BATCH);
  };
  const changeCategory = (value: string) => {
    setCategory(value);
    setWordLimit(WORDS_BATCH);
  };

  const renderPanel = () => {
    if (loadFailed) {
      return <EmptyState title={t("DICTIONARY.LIST.LOAD_ERROR")} />;
    }
    if (currentCount === 0) {
      return (
        <EmptyState
          title={t("DICTIONARY.LIST.NO_RESULTS_TITLE")}
          hint={t("DICTIONARY.LIST.NO_RESULTS_HINT")}
          action={
            otherCount > 0 ? (
              <Button
                variant="contained"
                disableElevation
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => {
                  changeTab(otherTab);
                  changeCategory(ALL_CATEGORIES);
                }}
              >
                {otherTab === "word"
                  ? t("DICTIONARY.LIST.FILTER_WORDS")
                  : t("DICTIONARY.LIST.FILTER_CHARACTERS")}{" "}
                ({otherCount})
              </Button>
            ) : null
          }
        />
      );
    }
    if (tab === "character") {
      return (
        <CharacterSections
          sections={characterSections}
          showJumpBar={!isSearching && characterSections.length > 1}
        />
      );
    }
    return (
      <WordGrid
        words={visibleWords}
        sections={wordSections}
        category={category}
        onCategoryChange={changeCategory}
        limit={wordLimit}
        onShowMore={() => setWordLimit((limit) => limit + WORDS_BATCH)}
      />
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <Stack
        spacing={3}
        sx={{
          "& .dictionary-character-grid": {
            gridTemplateColumns: {
              xs: "repeat(auto-fill, minmax(72px, 1fr))",
              md: "repeat(auto-fill, minmax(88px, 1fr))",
            },
          },
          "& .dictionary-word-grid": {
            gridTemplateColumns: {
              xs: "repeat(auto-fill, minmax(150px, 1fr))",
              md: "repeat(auto-fill, minmax(220px, 1fr))",
            },
          },
        }}
      >
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Stack
            direction="row"
            sx={{
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 30, md: 36 },
                fontWeight: 700,
                lineHeight: 1.2,
                color: KslColors.textPrimary,
              }}
            >
              {t("DICTIONARY.LIST.HEADLINE")}
            </Typography>
            {words.length > 0 ? (
              <Typography
                sx={{
                  fontSize: KslFontSizes.sm,
                  fontWeight: 600,
                  color: KslColors.textSecondary,
                }}
              >
                {t("DICTIONARY.LIST.SIGN_COUNT").replace(
                  "{count}",
                  String(words.length),
                )}
              </Typography>
            ) : null}
          </Stack>
        </motion.div>

        {/* Sticky so search stays reachable while scrolling long unit lists. */}
        <Box
          sx={{
            position: "sticky",
            top: MAIN_HEADER_HEIGHT,
            zIndex: 3,
            mx: { xs: -2, md: -3 },
            px: { xs: 2, md: 3 },
            py: 1,
            bgcolor: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
          }}
        >
          <TextField
            inputRef={searchRef}
            fullWidth
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder={t("DICTIONARY.LIST.SEARCH_PLACEHOLDER")}
            slotProps={{
              htmlInput: {
                "aria-label": t("DICTIONARY.LIST.SEARCH_LABEL"),
                type: "search",
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon
                      sx={{ color: KslColors.textSecondary }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <AnimatePresence mode="wait" initial={false}>
                      {query ? (
                        <motion.span
                          key="clear"
                          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                          animate={{ opacity: 1, rotate: 0, scale: 1 }}
                          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                          transition={{ duration: 0.18 }}
                        >
                          <IconButton
                            size="small"
                            aria-label={t("DICTIONARY.LIST.SEARCH_CLEAR")}
                            onClick={() => {
                              changeQuery("");
                              searchRef.current?.focus();
                            }}
                          >
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </motion.span>
                      ) : (
                        <motion.span
                          key="hint"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Box
                            component="kbd"
                            sx={{
                              display: { xs: "none", md: "inline-flex" },
                              px: 1,
                              py: 0.25,
                              borderRadius: "6px",
                              border: `1px solid ${KslColors.border}`,
                              fontFamily: "inherit",
                              fontSize: KslFontSizes.xs,
                              color: KslColors.textSecondary,
                            }}
                          >
                            /
                          </Box>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </InputAdornment>
                ),
                sx: {
                  height: 56,
                  fontSize: KslFontSizes.md,
                  borderRadius: `${KslRadii.button}px`,
                  bgcolor: "background.paper",
                  "& fieldset": { borderColor: KslColors.border },
                  // Hide the browser's own clear button; we render our own.
                  "& input::-webkit-search-cancel-button": { display: "none" },
                },
              },
            }}
          />
        </Box>

        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <DictionaryPillRow
              variant="segmented"
              ariaLabel={t("DICTIONARY.LIST.TYPE_FILTER_LABEL")}
              layoutId="dictionary-type"
              selected={tab}
              onSelect={changeTab}
              items={[
                {
                  value: "character",
                  label: t("DICTIONARY.LIST.FILTER_CHARACTERS"),
                  count: characters.length,
                },
                {
                  value: "word",
                  label: t("DICTIONARY.LIST.FILTER_WORDS"),
                  count: wordEntries.length,
                },
              ]}
            />
            <AnimatePresence>
              {isSearching ? (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                >
                  <Typography
                    role="status"
                    sx={{
                      fontSize: KslFontSizes.sm,
                      fontWeight: 600,
                      color: KslColors.textSecondary,
                    }}
                  >
                    {t("DICTIONARY.LIST.RESULTS_FOR")
                      .replace("{count}", String(matched.length))
                      .replace("{query}", query.trim())}
                  </Typography>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Stack>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </Stack>
    </MotionConfig>
  );
}
