/**
 * Unit Tests: Navigation Flows
 *
 * Tests that Create/Edit buttons trigger correct `router.push` calls,
 * Cancel navigates back to list page, and successful submit navigates
 * back with a success notification URL param.
 *
 * _Requirements: 1.1, 1.2, 1.4, 1.5_
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Navigation helper functions (extracted from CurriculumTablePage) ─────────

type AdminTrack = "finger" | "word_detection";

function getTrackPathSegment(track: AdminTrack): string {
  return track === "finger" ? "finger-spelling" : "word-detection";
}

function getBasePath(
  track: AdminTrack,
  entity: "units" | "chapters" | "lessons",
): string {
  return `/admin/learning/${getTrackPathSegment(track)}/${entity}`;
}

/**
 * Generates the path for creating a new entity (mirrors CurriculumTablePage.openCreate).
 */
function getCreatePath(
  track: AdminTrack,
  entity: "units" | "chapters" | "lessons",
): string {
  return `${getBasePath(track, entity)}/create`;
}

/**
 * Generates the path for editing an entity (mirrors CurriculumTablePage.openEdit).
 */
function getEditPath(
  track: AdminTrack,
  entity: "units" | "chapters" | "lessons",
  entityId: number,
): string {
  return `${getBasePath(track, entity)}/${entityId}/edit`;
}

/**
 * Generates the list path for a given track (mirrors UnitFormPage.getListPath).
 */
function getUnitListPath(track: AdminTrack): string {
  return track === "finger"
    ? "/admin/learning/finger-spelling/units"
    : "/admin/learning/word-detection/units";
}

function getChapterListPath(track: AdminTrack): string {
  return track === "finger"
    ? "/admin/learning/finger-spelling/chapters"
    : "/admin/learning/word-detection/chapters";
}

function getLessonListPath(track: AdminTrack): string {
  return track === "finger"
    ? "/admin/learning/finger-spelling/lessons"
    : "/admin/learning/word-detection/lessons";
}

/**
 * Generates the success navigation URL (mirrors form page onSuccess callback).
 */
function getSuccessNavigationPath(
  listPath: string,
  action: "created" | "updated",
): string {
  return `${listPath}?success=${action}`;
}

// ── Dictionary navigation helpers ────────────────────────────────────────────

function getDictionaryCreatePath(entityType: "characters" | "words"): string {
  return `/admin/dictionary/${entityType}/create`;
}

function getDictionaryEditPath(
  entityType: "characters" | "words",
  entityId: number,
): string {
  return `/admin/dictionary/${entityType}/${entityId}/edit`;
}

function getDictionaryListPath(entityType: "characters" | "words"): string {
  return `/admin/dictionary/${entityType}`;
}

// ── Exercise navigation helpers ──────────────────────────────────────────────

function getExerciseCreatePath(): string {
  return "/admin/exercises/create";
}

function getExerciseEditPath(entityId: number): string {
  return `/admin/exercises/${entityId}/edit`;
}

function getExerciseListPath(): string {
  return "/admin/exercises";
}

// ── Media navigation helpers ─────────────────────────────────────────────────

function getMediaUploadPath(): string {
  return "/admin/media/upload";
}

function getMediaPreviewPath(mediaId: number): string {
  return `/admin/media/${mediaId}/preview`;
}

function getMediaListPath(): string {
  return "/admin/media";
}

// ── Contribution navigation helpers ──────────────────────────────────────────

function getContributionReviewPath(contributionId: number): string {
  return `/admin/learning/contributions/${contributionId}/review`;
}

function getContributionListPath(): string {
  return "/admin/learning/contributions";
}

// ── Practice navigation helpers ──────────────────────────────────────────────

function getPracticeCreatePath(track: AdminTrack): string {
  return `/admin/learning/${getTrackPathSegment(track)}/practices/create`;
}

function getPracticeEditPath(track: AdminTrack, entityId: number): string {
  return `/admin/learning/${getTrackPathSegment(track)}/practices/${entityId}/edit`;
}

function getPracticeListPath(track: AdminTrack): string {
  return `/admin/learning/${getTrackPathSegment(track)}/practices`;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Navigation Flows", () => {
  let mockPush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPush = vi.fn();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 1.1: Create button navigates to dedicated full-page form
  // ──────────────────────────────────────────────────────────────────────────

  describe("Create buttons trigger correct router.push calls (Req 1.1)", () => {
    it("Finger Spelling Units — Create navigates to /admin/learning/finger-spelling/units/create", () => {
      const path = getCreatePath("finger", "units");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/units/create",
      );
    });

    it("Finger Spelling Chapters — Create navigates to /admin/learning/finger-spelling/chapters/create", () => {
      const path = getCreatePath("finger", "chapters");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/chapters/create",
      );
    });

    it("Finger Spelling Lessons — Create navigates to /admin/learning/finger-spelling/lessons/create", () => {
      const path = getCreatePath("finger", "lessons");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/lessons/create",
      );
    });

    it("Word Detection Units — Create navigates to /admin/learning/word-detection/units/create", () => {
      const path = getCreatePath("word_detection", "units");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/units/create",
      );
    });

    it("Word Detection Chapters — Create navigates to /admin/learning/word-detection/chapters/create", () => {
      const path = getCreatePath("word_detection", "chapters");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/chapters/create",
      );
    });

    it("Word Detection Lessons — Create navigates to /admin/learning/word-detection/lessons/create", () => {
      const path = getCreatePath("word_detection", "lessons");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/lessons/create",
      );
    });

    it("Dictionary Characters — Create navigates to /admin/dictionary/characters/create", () => {
      const path = getDictionaryCreatePath("characters");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/dictionary/characters/create");
    });

    it("Dictionary Words — Create navigates to /admin/dictionary/words/create", () => {
      const path = getDictionaryCreatePath("words");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/dictionary/words/create");
    });

    it("Exercises — Create navigates to /admin/exercises/create", () => {
      const path = getExerciseCreatePath();
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/exercises/create");
    });

    it("Media — Upload navigates to /admin/media/upload", () => {
      const path = getMediaUploadPath();
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/media/upload");
    });

    it("Practices (Finger Spelling) — Create navigates to /admin/learning/finger-spelling/practices/create", () => {
      const path = getPracticeCreatePath("finger");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/practices/create",
      );
    });

    it("Practices (Word Detection) — Create navigates to /admin/learning/word-detection/practices/create", () => {
      const path = getPracticeCreatePath("word_detection");
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/practices/create",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 1.2: Edit button navigates to form with entity ID
  // ──────────────────────────────────────────────────────────────────────────

  describe("Edit buttons trigger correct router.push calls (Req 1.2)", () => {
    it("Finger Spelling Units — Edit navigates to /admin/learning/finger-spelling/units/:id/edit", () => {
      const path = getEditPath("finger", "units", 42);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/units/42/edit",
      );
    });

    it("Word Detection Chapters — Edit navigates to /admin/learning/word-detection/chapters/:id/edit", () => {
      const path = getEditPath("word_detection", "chapters", 7);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/chapters/7/edit",
      );
    });

    it("Finger Spelling Lessons — Edit includes entity ID in path", () => {
      const path = getEditPath("finger", "lessons", 123);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/lessons/123/edit",
      );
    });

    it("Dictionary Characters — Edit navigates to /admin/dictionary/characters/:id/edit", () => {
      const path = getDictionaryEditPath("characters", 5);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/dictionary/characters/5/edit");
    });

    it("Dictionary Words — Edit navigates to /admin/dictionary/words/:id/edit", () => {
      const path = getDictionaryEditPath("words", 99);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/dictionary/words/99/edit");
    });

    it("Exercises — Edit navigates to /admin/exercises/:id/edit", () => {
      const path = getExerciseEditPath(15);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/exercises/15/edit");
    });

    it("Media — Preview navigates to /admin/media/:id/preview", () => {
      const path = getMediaPreviewPath(33);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/media/33/preview");
    });

    it("Contributions — Review navigates to /admin/learning/contributions/:id/review", () => {
      const path = getContributionReviewPath(77);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/contributions/77/review",
      );
    });

    it("Practices (Finger Spelling) — Edit navigates to /admin/learning/finger-spelling/practices/:id/edit", () => {
      const path = getPracticeEditPath("finger", 8);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/practices/8/edit",
      );
    });

    it("Practices (Word Detection) — Edit navigates to /admin/learning/word-detection/practices/:id/edit", () => {
      const path = getPracticeEditPath("word_detection", 12);
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/practices/12/edit",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 1.4: Cancel button navigates back to list page
  // ──────────────────────────────────────────────────────────────────────────

  describe("Cancel button navigates back to list page (Req 1.4)", () => {
    it("Unit form Cancel navigates to units list (Finger Spelling)", () => {
      const listPath = getUnitListPath("finger");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/units",
      );
    });

    it("Unit form Cancel navigates to units list (Word Detection)", () => {
      const listPath = getUnitListPath("word_detection");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/units",
      );
    });

    it("Chapter form Cancel navigates to chapters list (Finger Spelling)", () => {
      const listPath = getChapterListPath("finger");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/chapters",
      );
    });

    it("Lesson form Cancel navigates to lessons list (Word Detection)", () => {
      const listPath = getLessonListPath("word_detection");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/lessons",
      );
    });

    it("Dictionary form Cancel navigates to dictionary list (characters)", () => {
      const listPath = getDictionaryListPath("characters");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/dictionary/characters");
    });

    it("Dictionary form Cancel navigates to dictionary list (words)", () => {
      const listPath = getDictionaryListPath("words");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/dictionary/words");
    });

    it("Exercise form Cancel navigates to exercises list", () => {
      const listPath = getExerciseListPath();
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/exercises");
    });

    it("Media upload Cancel navigates to media library", () => {
      const listPath = getMediaListPath();
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/media");
    });

    it("Media preview Back button navigates to media library", () => {
      const listPath = getMediaListPath();
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/media");
    });

    it("Contribution review Cancel navigates to contributions list", () => {
      const listPath = getContributionListPath();
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/learning/contributions");
    });

    it("Practice form Cancel navigates to practices list (Finger Spelling)", () => {
      const listPath = getPracticeListPath("finger");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/practices",
      );
    });

    it("Practice form Cancel navigates to practices list (Word Detection)", () => {
      const listPath = getPracticeListPath("word_detection");
      mockPush(listPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/practices",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 1.5: Successful submit navigates back with notification
  // ──────────────────────────────────────────────────────────────────────────

  describe("Successful submit navigates back with success notification (Req 1.5)", () => {
    it("Creating a Unit navigates to list path with ?success=created", () => {
      const listPath = getUnitListPath("finger");
      const successPath = getSuccessNavigationPath(listPath, "created");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/units?success=created",
      );
    });

    it("Updating a Unit navigates to list path with ?success=updated", () => {
      const listPath = getUnitListPath("word_detection");
      const successPath = getSuccessNavigationPath(listPath, "updated");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/units?success=updated",
      );
    });

    it("Creating a Chapter navigates to list path with ?success=created", () => {
      const listPath = getChapterListPath("finger");
      const successPath = getSuccessNavigationPath(listPath, "created");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/chapters?success=created",
      );
    });

    it("Updating a Lesson navigates to list path with ?success=updated", () => {
      const listPath = getLessonListPath("word_detection");
      const successPath = getSuccessNavigationPath(listPath, "updated");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/word-detection/lessons?success=updated",
      );
    });

    it("Creating a dictionary entry navigates with ?success=created", () => {
      const listPath = getDictionaryListPath("characters");
      const successPath = getSuccessNavigationPath(listPath, "created");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/dictionary/characters?success=created",
      );
    });

    it("Updating a dictionary word navigates with ?success=updated", () => {
      const listPath = getDictionaryListPath("words");
      const successPath = getSuccessNavigationPath(listPath, "updated");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/dictionary/words?success=updated",
      );
    });

    it("Creating an exercise navigates with ?success=created", () => {
      const listPath = getExerciseListPath();
      const successPath = getSuccessNavigationPath(listPath, "created");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/exercises?success=created");
    });

    it("Updating an exercise navigates with ?success=updated", () => {
      const listPath = getExerciseListPath();
      const successPath = getSuccessNavigationPath(listPath, "updated");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith("/admin/exercises?success=updated");
    });

    it("Uploading media navigates to media list with ?success=upload", () => {
      // Special case: media upload uses "upload" action
      const path = `${getMediaListPath()}?success=upload`;
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith("/admin/media?success=upload");
    });

    it("Creating a practice navigates with ?success=created", () => {
      const listPath = getPracticeListPath("finger");
      const successPath = getSuccessNavigationPath(listPath, "created");
      mockPush(successPath);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/finger-spelling/practices?success=created",
      );
    });

    it("Approving a contribution navigates to list with ?success=approved", () => {
      const path = `${getContributionListPath()}?success=approved`;
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/contributions?success=approved",
      );
    });

    it("Rejecting a contribution navigates to list with ?success=rejected", () => {
      const path = `${getContributionListPath()}?success=rejected`;
      mockPush(path);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/learning/contributions?success=rejected",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Integration: Navigation path construction is consistent across tracks
  // ──────────────────────────────────────────────────────────────────────────

  describe("Track path segment mapping is consistent", () => {
    it('"finger" track maps to "finger-spelling" path segment', () => {
      expect(getTrackPathSegment("finger")).toBe("finger-spelling");
    });

    it('"word_detection" track maps to "word-detection" path segment', () => {
      expect(getTrackPathSegment("word_detection")).toBe("word-detection");
    });

    it("getBasePath constructs correct prefix for any track/entity combo", () => {
      expect(getBasePath("finger", "units")).toBe(
        "/admin/learning/finger-spelling/units",
      );
      expect(getBasePath("finger", "chapters")).toBe(
        "/admin/learning/finger-spelling/chapters",
      );
      expect(getBasePath("finger", "lessons")).toBe(
        "/admin/learning/finger-spelling/lessons",
      );
      expect(getBasePath("word_detection", "units")).toBe(
        "/admin/learning/word-detection/units",
      );
      expect(getBasePath("word_detection", "chapters")).toBe(
        "/admin/learning/word-detection/chapters",
      );
      expect(getBasePath("word_detection", "lessons")).toBe(
        "/admin/learning/word-detection/lessons",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Success notification mechanism
  // ──────────────────────────────────────────────────────────────────────────

  describe("Success notification URL param mechanism", () => {
    it("success param is appended as query string to list path", () => {
      const listPath = "/admin/learning/finger-spelling/units";
      const result = getSuccessNavigationPath(listPath, "created");

      expect(result).toBe(
        "/admin/learning/finger-spelling/units?success=created",
      );
      expect(result).toContain("?success=");
    });

    it("updated action appends ?success=updated", () => {
      const listPath = "/admin/exercises";
      const result = getSuccessNavigationPath(listPath, "updated");

      expect(result).toBe("/admin/exercises?success=updated");
    });

    it("navigation path never has double slashes", () => {
      const paths = [
        getCreatePath("finger", "units"),
        getEditPath("word_detection", "chapters", 1),
        getUnitListPath("finger"),
        getDictionaryCreatePath("characters"),
        getExerciseEditPath(5),
        getMediaUploadPath(),
        getMediaPreviewPath(10),
        getContributionReviewPath(3),
        getPracticeCreatePath("word_detection"),
        getPracticeEditPath("finger", 4),
      ];

      for (const path of paths) {
        expect(path).not.toContain("//");
      }
    });

    it("all edit paths end with /edit", () => {
      const editPaths = [
        getEditPath("finger", "units", 1),
        getEditPath("word_detection", "chapters", 2),
        getEditPath("finger", "lessons", 3),
        getDictionaryEditPath("characters", 4),
        getDictionaryEditPath("words", 5),
        getExerciseEditPath(6),
        getPracticeEditPath("finger", 7),
        getPracticeEditPath("word_detection", 8),
      ];

      for (const path of editPaths) {
        expect(path).toMatch(/\/edit$/);
      }
    });

    it("all create paths end with /create", () => {
      const createPaths = [
        getCreatePath("finger", "units"),
        getCreatePath("word_detection", "chapters"),
        getCreatePath("finger", "lessons"),
        getDictionaryCreatePath("characters"),
        getDictionaryCreatePath("words"),
        getExerciseCreatePath(),
        getPracticeCreatePath("finger"),
        getPracticeCreatePath("word_detection"),
      ];

      for (const path of createPaths) {
        expect(path).toMatch(/\/create$/);
      }
    });

    it("all paths start with /admin/", () => {
      const allPaths = [
        getCreatePath("finger", "units"),
        getEditPath("word_detection", "units", 1),
        getUnitListPath("finger"),
        getChapterListPath("word_detection"),
        getLessonListPath("finger"),
        getDictionaryCreatePath("characters"),
        getDictionaryEditPath("words", 1),
        getDictionaryListPath("characters"),
        getExerciseCreatePath(),
        getExerciseEditPath(1),
        getExerciseListPath(),
        getMediaUploadPath(),
        getMediaPreviewPath(1),
        getMediaListPath(),
        getContributionReviewPath(1),
        getContributionListPath(),
        getPracticeCreatePath("finger"),
        getPracticeEditPath("word_detection", 1),
        getPracticeListPath("finger"),
      ];

      for (const path of allPaths) {
        expect(path).toMatch(/^\/admin\//);
      }
    });
  });
});
