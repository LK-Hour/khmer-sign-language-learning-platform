"use client";

import { useCallback, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Chip,
  Link as MuiLink,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { useLocale } from "@/i18n/locale-context";
import { getLocalizedPair } from "@/i18n/localizedText";
import { useTranslation } from "@/i18n/useTranslation";

import type { DictionaryItem } from "../api/dictionaryAdminApi";
import type { MediaAssociation } from "../api/mediaAdminApi";
import SearchableDropdown from "../components/shared/SearchableDropdown";

type TargetType = MediaAssociation["target_type"];

export interface MediaAssociationsEditorProps {
  /** Letters/words this media is linked to, including unsaved changes. */
  items: MediaAssociation[];
  onAdd: (item: MediaAssociation) => void;
  onRemove: (item: MediaAssociation) => void;
  /** Search the dictionary for letters or words to link. */
  fetchTargets: (type: TargetType, query: string) => Promise<DictionaryItem[]>;
}

const keyOf = (item: Pick<MediaAssociation, "target_type" | "target_id">) =>
  `${item.target_type}:${item.target_id}`;

function dictionaryEditPath(locale: string, item: MediaAssociation): string {
  const segment = item.target_type === "letter" ? "characters" : "words";
  return `/${locale}/admin/dictionary/${segment}/${item.target_id}/edit`;
}

/**
 * Add/remove the characters (letters) and words a media asset is linked to. Changes are
 * only staged here; the edit page applies them on Save.
 */
export default function MediaAssociationsEditor({
  items,
  onAdd,
  onRemove,
  fetchTargets,
}: MediaAssociationsEditorProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [type, setType] = useState<TargetType>("letter");

  const linked = useMemo(() => new Set(items.map(keyOf)), [items]);

  const typeLabel = (target: TargetType) =>
    target === "letter" ? t("FORM.CHARACTER") : t("FORM.WORD");

  const optionName = useCallback(
    (option: DictionaryItem) =>
      getLocalizedPair(locale, option.name_en ?? "", option.name_kh).primary,
    [locale],
  );

  const fetchOptions = useCallback(
    async (query: string) => {
      const results = await fetchTargets(type, query);
      return results.filter((option) => !linked.has(keyOf({ target_type: type, target_id: option.id })));
    },
    [fetchTargets, type, linked],
  );

  const handleSelect = useCallback(
    (option: DictionaryItem | null) => {
      if (!option || linked.has(keyOf({ target_type: type, target_id: option.id }))) return;
      onAdd({ target_type: type, target_id: option.id, target_name: optionName(option) });
    },
    [onAdd, type, optionName, linked],
  );

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {t("FORM.MEDIA_LINKS")} ({items.length})
      </Typography>

      {items.length === 0 ? (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("FORM.MEDIA_LINKS_EMPTY")}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {items.map((item) => (
            <Chip
              key={keyOf(item)}
              size="small"
              variant="outlined"
              // The name is the link and the delete icon is separate, so removing a link
              // never navigates away.
              label={
                <MuiLink
                  component={NextLink}
                  href={dictionaryEditPath(locale, item)}
                  underline="hover"
                  color="inherit"
                >
                  {typeLabel(item.target_type)} · {item.target_name}
                </MuiLink>
              }
              onDelete={() => onRemove(item)}
            />
          ))}
        </Box>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={type}
          onChange={(_event, next: TargetType | null) => next && setType(next)}
          aria-label={t("FORM.MEDIA_LINK_TYPE")}
          sx={{ flexShrink: 0, height: 40 }}
        >
          <ToggleButton value="letter">{t("FORM.CHARACTER")}</ToggleButton>
          <ToggleButton value="word">{t("FORM.WORD")}</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* key: switching type restarts the search so the list matches the chosen type */}
          <SearchableDropdown<DictionaryItem>
            key={type}
            label={type === "letter" ? t("FORM.MEDIA_ADD_CHARACTER") : t("FORM.MEDIA_ADD_WORD")}
            value={null}
            onChange={handleSelect}
            fetchOptions={fetchOptions}
            getOptionLabel={(option) =>
              option.name_en ? `${option.name_kh} · ${option.name_en}` : option.name_kh
            }
            getOptionKey={(option) => option.id}
            placeholder={t("FORM.SEARCH_PLACEHOLDER")}
            clearOnSelect
          />
        </Box>
      </Stack>
    </Stack>
  );
}
