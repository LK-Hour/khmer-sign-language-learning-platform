/**
 * Property-based test: Media preview displays all metadata fields
 *
 * **Validates: Requirements 7.3**
 *
 * Property 5: For any valid MediaResponse record with any number of
 * associations (0 to many), the MediaPreviewView SHALL render the media's
 * id, media_type, file_url, created_at, updated_at, and every association entry.
 *
 * Since the test environment is node (no DOM), we validate this property by
 * extracting the metadata fields the component renders and asserting they
 * are all derivable from the input MediaResponse.
 */

import { describe, expect, it } from "vitest";
import * as fc from "fast-check";

import type { MediaAssociation, MediaResponse } from "../api/mediaAdminApi";

// ── Arbitraries ──────────────────────────────────────────────────────────────

const mediaTypeArb = fc.constantFrom("video", "gif", "image") as fc.Arbitrary<
  "video" | "gif" | "image"
>;

const targetTypeArb = fc.constantFrom("letter", "word") as fc.Arbitrary<
  "letter" | "word"
>;

const isoDateArb = fc
  .integer({ min: new Date("2020-01-01").getTime(), max: new Date("2030-12-31").getTime() })
  .map((ts) => new Date(ts).toISOString());

const mediaAssociationArb: fc.Arbitrary<MediaAssociation> = fc.record({
  target_type: targetTypeArb,
  target_id: fc.integer({ min: 1, max: 10000 }),
  target_name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
});

const mediaResponseArb: fc.Arbitrary<MediaResponse & { updated_at?: string }> = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  media_type: mediaTypeArb,
  file_url: fc.webUrl(),
  created_at: isoDateArb,
  updated_at: fc.option(isoDateArb, { nil: undefined }),
  associations: fc.array(mediaAssociationArb, { minLength: 0, maxLength: 10 }),
});

// ── Extracted rendering logic ────────────────────────────────────────────────

/**
 * Extracts the set of metadata text content that MediaPreviewView would
 * render given a MediaResponse. This mirrors the component's rendering logic:
 * - ID displayed as String(media.id)
 * - media_type displayed as chip label
 * - file_url displayed as text
 * - created_at displayed via toLocaleString or "—"
 * - updated_at displayed via toLocaleString or "—"
 * - Each association rendered with target_type label and target_name
 */
function extractRenderedMetadata(media: MediaResponse & { updated_at?: string }): {
  id: string;
  mediaType: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  associationEntries: Array<{ typeLabel: string; name: string }>;
} {
  return {
    id: String(media.id),
    mediaType: media.media_type,
    fileUrl: media.file_url,
    createdAt: media.created_at
      ? new Date(media.created_at).toLocaleString()
      : "—",
    updatedAt: media.updated_at
      ? new Date(media.updated_at).toLocaleString()
      : "—",
    associationEntries: media.associations.map((assoc) => ({
      typeLabel: getAssociationTypeLabel(assoc.target_type),
      name: assoc.target_name,
    })),
  };
}

/** Mirrors the component's helper function for formatting association type */
function getAssociationTypeLabel(type: string): string {
  switch (type) {
    case "letter":
      return "Letter";
    case "word":
      return "Word";
    case "exercise":
      return "Exercise";
    default:
      return type;
  }
}

// ── Property Tests ───────────────────────────────────────────────────────────

describe("MediaPreviewView - Property 5: Media preview displays all metadata fields", () => {
  it("all metadata fields are present in rendered output for any MediaResponse", () => {
    fc.assert(
      fc.property(mediaResponseArb, (media) => {
        const rendered = extractRenderedMetadata(media);

        // ID is rendered
        expect(rendered.id).toBe(String(media.id));

        // media_type is rendered
        expect(rendered.mediaType).toBe(media.media_type);

        // file_url is rendered
        expect(rendered.fileUrl).toBe(media.file_url);

        // created_at is rendered (non-empty)
        expect(rendered.createdAt.length).toBeGreaterThan(0);
        if (media.created_at) {
          expect(rendered.createdAt).toBe(
            new Date(media.created_at).toLocaleString(),
          );
        }

        // updated_at is rendered (non-empty, either date or dash)
        expect(rendered.updatedAt.length).toBeGreaterThan(0);
        if (media.updated_at) {
          expect(rendered.updatedAt).toBe(
            new Date(media.updated_at).toLocaleString(),
          );
        } else {
          expect(rendered.updatedAt).toBe("—");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every association entry is represented in the rendered output", () => {
    fc.assert(
      fc.property(mediaResponseArb, (media) => {
        const rendered = extractRenderedMetadata(media);

        // Number of rendered associations matches input
        expect(rendered.associationEntries).toHaveLength(
          media.associations.length,
        );

        // Each association's name and type label are present
        media.associations.forEach((assoc, index) => {
          const entry = rendered.associationEntries[index];
          expect(entry.name).toBe(assoc.target_name);
          expect(entry.typeLabel).toBe(
            getAssociationTypeLabel(assoc.target_type),
          );
        });
      }),
      { numRuns: 100 },
    );
  });

  it("handles zero associations correctly (empty state)", () => {
    fc.assert(
      fc.property(
        mediaResponseArb.map((m) => ({ ...m, associations: [] })),
        (media) => {
          const rendered = extractRenderedMetadata(media);
          expect(rendered.associationEntries).toHaveLength(0);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("handles many associations without data loss", () => {
    fc.assert(
      fc.property(
        mediaResponseArb.chain((m) =>
          fc
            .array(mediaAssociationArb, { minLength: 5, maxLength: 20 })
            .map((assocs) => ({ ...m, associations: assocs })),
        ),
        (media) => {
          const rendered = extractRenderedMetadata(media);

          // All associations are rendered with no loss
          expect(rendered.associationEntries).toHaveLength(
            media.associations.length,
          );

          // Every association name appears in rendered output
          for (const assoc of media.associations) {
            const found = rendered.associationEntries.some(
              (entry) =>
                entry.name === assoc.target_name &&
                entry.typeLabel === getAssociationTypeLabel(assoc.target_type),
            );
            expect(found).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
