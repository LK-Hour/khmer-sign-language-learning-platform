import type { Locale } from "@/i18n/config";
import { getLocalizedPair } from "@/i18n/localizedText";

import type { PublishStatus } from "../api/types";
import type { RelatedItem } from "../components/shared/RelatedItemsField";

export type CurriculumKind = "units" | "chapters" | "lessons";
export type CurriculumTrack = "finger" | "word_detection";

/** Edit page of a unit / chapter / lesson (mirrors the app/[locale]/admin/learning routes). */
export function curriculumEditPath(
  locale: Locale,
  track: CurriculumTrack,
  kind: CurriculumKind,
  id: number,
): string {
  const segment = track === "finger" ? "finger-spelling" : "word-detection";
  return `/${locale}/admin/learning/${segment}/${kind}/${id}/edit`;
}

interface Named {
  id: number;
  name_en: string;
  name_kh: string;
  order_index: number;
  publish_status: PublishStatus;
}

/** Maps a curriculum row to what RelatedItemsField shows, naming it in the active language. */
export function toRelatedItem<T extends Named>(
  entity: T,
  locale: Locale,
  options: { href?: string; note?: string } = {},
): RelatedItem<T> {
  const { primary, secondary } = getLocalizedPair(locale, entity.name_en, entity.name_kh);
  return {
    id: entity.id,
    label: primary,
    secondaryLabel: secondary,
    order: entity.order_index,
    status: entity.publish_status,
    href: options.href,
    note: options.note,
    source: entity,
  };
}

/** Case-insensitive match against both language names. */
export function matchesName(entity: { name_en: string; name_kh: string }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return entity.name_en.toLowerCase().includes(q) || entity.name_kh.toLowerCase().includes(q);
}
