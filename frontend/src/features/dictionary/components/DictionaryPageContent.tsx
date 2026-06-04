"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { DictionaryWord } from "../types";
import DictionaryListItem from "./DictionaryListItem";
import DictionarySearchBar from "./DictionarySearchBar";

type DictionaryPageContentProps = {
  words: DictionaryWord[];
};

export default function DictionaryPageContent({
  words,
}: DictionaryPageContentProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return words;

    return words.filter(
      (word) =>
        word.textEn.toLowerCase().includes(query) ||
        word.textKh.includes(query)
    );
  }, [search, words]);

  return (
    <Box sx={{ maxWidth: 1120, mx: "auto" }}>
      <DictionarySearchBar value={search} onChange={setSearch} />

      {filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          {t("fsDictionaryNoResults")}
        </Typography>
      ) : (
        <Stack spacing={0}>
          {filtered.map((word) => (
            <DictionaryListItem key={word.id} word={word} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
