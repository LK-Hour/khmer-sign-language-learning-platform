import { describe, it, expect } from "vitest";
import { filterMediaByType } from "./mediaFilterUtils";
import type { MediaResponse } from "../api/mediaAdminApi";

function createMedia(
  id: number,
  mediaType: "video" | "gif" | "image"
): MediaResponse {
  return {
    id,
    media_type: mediaType,
    file_url: `/media/file-${id}.${mediaType === "image" ? "png" : mediaType === "video" ? "mp4" : "gif"}`,
    created_at: "2024-01-01T00:00:00Z",
    associations: [],
  };
}

describe("filterMediaByType", () => {
  const mixedAssets: MediaResponse[] = [
    createMedia(1, "image"),
    createMedia(2, "video"),
    createMedia(3, "image"),
    createMedia(4, "gif"),
    createMedia(5, "video"),
    createMedia(6, "image"),
  ];

  it("filters to only image assets when type is 'image'", () => {
    const result = filterMediaByType(mixedAssets, "image");
    expect(result).toHaveLength(3);
    expect(result.every((a) => a.media_type === "image")).toBe(true);
    expect(result.map((a) => a.id)).toEqual([1, 3, 6]);
  });

  it("filters to only video assets when type is 'video'", () => {
    const result = filterMediaByType(mixedAssets, "video");
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.media_type === "video")).toBe(true);
    expect(result.map((a) => a.id)).toEqual([2, 5]);
  });

  it("returns empty array when no assets match the type", () => {
    const imageOnly: MediaResponse[] = [
      createMedia(1, "image"),
      createMedia(2, "image"),
    ];
    const result = filterMediaByType(imageOnly, "video");
    expect(result).toHaveLength(0);
  });

  it("returns empty array when input is empty", () => {
    const result = filterMediaByType([], "image");
    expect(result).toHaveLength(0);
  });

  it("does not include gif assets when filtering for image", () => {
    const result = filterMediaByType(mixedAssets, "image");
    expect(result.some((a) => a.media_type === "gif")).toBe(false);
  });

  it("preserves all matching assets (no false negatives)", () => {
    const allImages = mixedAssets.filter((a) => a.media_type === "image");
    const result = filterMediaByType(mixedAssets, "image");
    expect(result).toEqual(allImages);
  });
});
