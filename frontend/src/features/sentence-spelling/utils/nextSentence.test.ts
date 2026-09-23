import { describe, expect, it } from "vitest";

import { findNextSentence } from "./nextSentence";

const sentences = [{ id: 4 }, { id: 9 }, { id: 12 }];

describe("findNextSentence", () => {
  it("returns the sentence after the current one in list order", () => {
    expect(findNextSentence(sentences, 4)).toEqual({ id: 9 });
    expect(findNextSentence(sentences, 9)).toEqual({ id: 12 });
  });

  it("returns null for the last sentence", () => {
    expect(findNextSentence(sentences, 12)).toBeNull();
  });

  it("returns null when the current sentence is unknown or missing", () => {
    expect(findNextSentence(sentences, 99)).toBeNull();
    expect(findNextSentence(sentences, undefined)).toBeNull();
    expect(findNextSentence([], 4)).toBeNull();
  });
});
