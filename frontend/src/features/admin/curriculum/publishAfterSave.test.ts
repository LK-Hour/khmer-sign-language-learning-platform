import { describe, expect, it } from "vitest";

import { ApiError } from "@/utils/api/client";

import { publishAfterSave } from "./publishAfterSave";

describe("publishAfterSave", () => {
  it("returns the published entity when publishing succeeds", async () => {
    const published = { id: 7, publish_status: "published" };
    await expect(publishAfterSave(async () => published)).resolves.toBe(published);
  });

  it("says the row was saved as a draft when publishing is rejected", async () => {
    const rejected = new ApiError(
      409,
      "/api/admin/finger/chapters/7/publish",
      "Cannot publish this chapter: its parent unit is not published and active.",
    );

    await expect(publishAfterSave(() => Promise.reject(rejected))).rejects.toThrow(
      /^Saved as a draft, but it could not be published\. Conflict: Cannot publish this chapter/,
    );
  });

  it("keeps the reason for non-API failures", async () => {
    await expect(publishAfterSave(() => Promise.reject(new Error("boom")))).rejects.toThrow(
      "Saved as a draft, but it could not be published. boom",
    );
  });
});
