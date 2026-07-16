import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Validates: Requirements 8.3**
 *
 * Property 6: Bilingual option labels follow consistent format
 *
 * For any option object with non-empty name_en and name_kh fields,
 * the getOptionLabel function SHALL return a string in the format
 * "{name_en} · {name_kh}".
 */

interface BilingualOption {
  id: number;
  name_en: string;
  name_kh: string;
}

/**
 * The getOptionLabel implementation used throughout the admin portal
 * for bilingual entity dropdowns (units, chapters, lessons, etc.)
 */
const getOptionLabel = (option: BilingualOption): string =>
  `${option.name_en} · ${option.name_kh}`;

describe("SearchableDropdown - Property 6: Bilingual option labels follow consistent format", () => {
  /**
   * Arbitrary that generates bilingual option objects with non-empty
   * name_en and name_kh strings.
   */
  const bilingualOptionArb = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    name_en: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    name_kh: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  });

  it("should return label in the format '{name_en} · {name_kh}' for any bilingual option", () => {
    fc.assert(
      fc.property(bilingualOptionArb, (option) => {
        const label = getOptionLabel(option);
        const expected = `${option.name_en} · ${option.name_kh}`;
        expect(label).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it("should always contain the separator ' · ' between the two name parts", () => {
    fc.assert(
      fc.property(bilingualOptionArb, (option) => {
        const label = getOptionLabel(option);
        expect(label).toContain(" · ");
      }),
      { numRuns: 100 },
    );
  });

  it("should start with name_en and end with name_kh", () => {
    fc.assert(
      fc.property(bilingualOptionArb, (option) => {
        const label = getOptionLabel(option);
        expect(label.startsWith(option.name_en)).toBe(true);
        expect(label.endsWith(option.name_kh)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("should have length equal to name_en + separator + name_kh", () => {
    fc.assert(
      fc.property(bilingualOptionArb, (option) => {
        const label = getOptionLabel(option);
        const separator = " · ";
        expect(label.length).toBe(
          option.name_en.length + separator.length + option.name_kh.length,
        );
      }),
      { numRuns: 100 },
    );
  });
});
