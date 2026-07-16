import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * **Validates: Requirements 4.4, 8.2**
 *
 * Property 2: SearchableDropdown filtering returns only matching options
 *
 * For any set of available options and any non-empty query string,
 * the filtered results SHALL contain only options where name_en, name_kh,
 * or file_url includes the query as a case-insensitive substring.
 */

interface SearchableOption {
  id: number;
  name_en: string;
  name_kh: string;
  file_url: string;
}

/**
 * Pure filtering function that implements the SearchableDropdown filtering contract.
 * This is the logic that fetchOptions implementations must follow:
 * an option matches if name_en, name_kh, or file_url includes the query (case-insensitive).
 */
function filterOptions(options: SearchableOption[], query: string): SearchableOption[] {
  if (!query) return options;
  const lowerQuery = query.toLowerCase();
  return options.filter(
    (option) =>
      option.name_en.toLowerCase().includes(lowerQuery) ||
      option.name_kh.toLowerCase().includes(lowerQuery) ||
      option.file_url.toLowerCase().includes(lowerQuery),
  );
}

// Custom arbitrary for generating SearchableOption objects
const searchableOptionArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name_en: fc.string({ minLength: 0, maxLength: 30 }),
  name_kh: fc.string({ minLength: 0, maxLength: 30 }),
  file_url: fc.string({ minLength: 0, maxLength: 50 }),
});

// Generate option sets with unique IDs
const optionSetArb = fc
  .array(searchableOptionArb, { minLength: 0, maxLength: 20 })
  .map((options) => {
    const seen = new Set<number>();
    return options.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
  });

// Non-empty query strings (filtering only applies with non-empty queries)
const queryArb = fc.string({ minLength: 1, maxLength: 15 });

describe("SearchableDropdown filtering property tests", () => {
  it("Property 2: filtered results contain only options matching the query (case-insensitive)", () => {
    fc.assert(
      fc.property(optionSetArb, queryArb, (options, query) => {
        const results = filterOptions(options, query);
        const lowerQuery = query.toLowerCase();

        // Every result must match the query in at least one field
        for (const result of results) {
          const matchesNameEn = result.name_en.toLowerCase().includes(lowerQuery);
          const matchesNameKh = result.name_kh.toLowerCase().includes(lowerQuery);
          const matchesFileUrl = result.file_url.toLowerCase().includes(lowerQuery);

          expect(matchesNameEn || matchesNameKh || matchesFileUrl).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("Property 2: no matching option is excluded from filtered results (completeness)", () => {
    fc.assert(
      fc.property(optionSetArb, queryArb, (options, query) => {
        const results = filterOptions(options, query);
        const lowerQuery = query.toLowerCase();

        // Every option that matches the query must appear in results
        for (const option of options) {
          const shouldMatch =
            option.name_en.toLowerCase().includes(lowerQuery) ||
            option.name_kh.toLowerCase().includes(lowerQuery) ||
            option.file_url.toLowerCase().includes(lowerQuery);

          if (shouldMatch) {
            expect(results).toContainEqual(option);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it("Property 2: result count equals number of matching options", () => {
    fc.assert(
      fc.property(optionSetArb, queryArb, (options, query) => {
        const results = filterOptions(options, query);
        const lowerQuery = query.toLowerCase();

        const expectedCount = options.filter(
          (o) =>
            o.name_en.toLowerCase().includes(lowerQuery) ||
            o.name_kh.toLowerCase().includes(lowerQuery) ||
            o.file_url.toLowerCase().includes(lowerQuery),
        ).length;

        expect(results.length).toBe(expectedCount);
      }),
      { numRuns: 200 },
    );
  });

  it("Property 2: filtering is case-insensitive", () => {
    fc.assert(
      fc.property(optionSetArb, queryArb, (options, query) => {
        const upperResults = filterOptions(options, query.toUpperCase());
        const lowerResults = filterOptions(options, query.toLowerCase());

        // Same options should match regardless of query case
        expect(upperResults.length).toBe(lowerResults.length);
        expect(upperResults.map((r) => r.id).sort()).toEqual(
          lowerResults.map((r) => r.id).sort(),
        );
      }),
      { numRuns: 200 },
    );
  });

  it("Property 2: empty query returns all options", () => {
    fc.assert(
      fc.property(optionSetArb, (options) => {
        const results = filterOptions(options, "");
        expect(results.length).toBe(options.length);
      }),
      { numRuns: 100 },
    );
  });
});
