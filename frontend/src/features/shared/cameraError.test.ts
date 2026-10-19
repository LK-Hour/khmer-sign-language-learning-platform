import { describe, expect, it } from "vitest";
import { cameraErrorKey } from "./cameraError";

const domError = (name: string) => new DOMException("x", name);

describe("cameraErrorKey", () => {
  it.each([
    ["NotAllowedError", "ERROR.CAMERA_DENIED"],
    ["NotFoundError", "ERROR.CAMERA_NOT_FOUND"],
    ["NotReadableError", "ERROR.CAMERA_IN_USE"],
    ["SomethingElse", "ERROR.CAMERA_FAILED"],
  ])("maps %s", (name, key) => {
    expect(cameraErrorKey(domError(name))).toBe(key);
  });

  it("falls back for non-DOM errors", () => {
    expect(cameraErrorKey(new Error("boom"))).toBe("ERROR.CAMERA_FAILED");
  });
});
