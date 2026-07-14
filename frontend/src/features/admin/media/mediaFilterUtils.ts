import type { MediaResponse } from "../api/mediaAdminApi";

/**
 * Filter media assets by type.
 * Returns only assets whose media_type matches the given type.
 */
export function filterMediaByType(
  assets: MediaResponse[],
  type: "image" | "video"
): MediaResponse[] {
  return assets.filter((asset) => asset.media_type === type);
}
