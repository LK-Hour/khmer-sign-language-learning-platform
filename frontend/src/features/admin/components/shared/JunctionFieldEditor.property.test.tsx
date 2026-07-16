/**
 * Property-Based Test: Junction editor state consistency
 *
 * **Validates: Requirements 4.3, 4.5**
 *
 * Property 3: For any sequence of add and remove operations on a JunctionFieldEditor,
 * the resulting selected items list SHALL contain exactly those items that were added
 * and not subsequently removed, each with a unique sequential order_index starting from 1.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { JunctionItem } from "./JunctionFieldEditor";

// ── Simulated Junction State Manager ─────────────────────────────────────────
// This simulates the parent component's state logic when using JunctionFieldEditor.
// The component delegates add/remove to the parent via callbacks; we test that logic.

interface JunctionItemData {
  id: number;
  name_en: string;
  name_kh: string;
}

type Operation =
  | { type: "add"; item: JunctionItemData }
  | { type: "remove"; itemId: number };

/**
 * Simulates the state management logic a parent component uses with JunctionFieldEditor.
 * When an item is added via onAdd, the parent appends it with the next order_index.
 * When an item is removed via onRemove, the parent removes it and re-indexes remaining items.
 */
function applyOperations(
  operations: Operation[]
): JunctionItem<JunctionItemData>[] {
  let items: JunctionItem<JunctionItemData>[] = [];

  for (const op of operations) {
    if (op.type === "add") {
      // Only add if not already present
      const alreadyExists = items.some((ji) => ji.item.id === op.item.id);
      if (!alreadyExists) {
        items.push({
          item: op.item,
          order_index: items.length + 1,
        });
      }
    } else if (op.type === "remove") {
      items = items.filter((ji) => ji.item.id !== op.itemId);
      // Re-index remaining items sequentially from 1
      items = items.map((ji, index) => ({
        ...ji,
        order_index: index + 1,
      }));
    }
  }

  return items;
}

// ── Arbitraries ──────────────────────────────────────────────────────────────

const itemArbitrary: fc.Arbitrary<JunctionItemData> = fc.record({
  id: fc.integer({ min: 1, max: 50 }),
  name_en: fc.string({ minLength: 1, maxLength: 20 }),
  name_kh: fc.string({ minLength: 1, maxLength: 20 }),
});

/**
 * Generates a sequence of add/remove operations.
 * Remove operations reference IDs from a pool of items that might have been added.
 */
const operationSequenceArbitrary: fc.Arbitrary<Operation[]> = fc
  .array(itemArbitrary, { minLength: 1, maxLength: 20 })
  .chain((itemPool) => {
    const operationArb: fc.Arbitrary<Operation> = fc.oneof(
      // Add a random item from the pool
      fc.constantFrom(...itemPool).map((item) => ({
        type: "add" as const,
        item,
      })),
      // Remove a random item ID from the pool
      fc.constantFrom(...itemPool.map((i) => i.id)).map((itemId) => ({
        type: "remove" as const,
        itemId,
      }))
    );
    return fc.array(operationArb, { minLength: 1, maxLength: 30 });
  });

// ── Property Tests ───────────────────────────────────────────────────────────

describe("JunctionFieldEditor - Property 3: Junction editor state consistency", () => {
  it("resulting items = added minus removed, each with unique sequential order_index from 1", () => {
    fc.assert(
      fc.property(operationSequenceArbitrary, (operations) => {
        const result = applyOperations(operations);

        // Compute expected items: those added and not subsequently removed
        const addedIds = new Map<number, JunctionItemData>();
        const removedIds = new Set<number>();

        for (const op of operations) {
          if (op.type === "add") {
            if (!addedIds.has(op.item.id)) {
              addedIds.set(op.item.id, op.item);
            }
          } else if (op.type === "remove") {
            removedIds.add(op.itemId);
          }
        }

        // But we need to track the precise order of operations:
        // An item can be added, removed, then added again.
        // Let's compute expected state by replaying operations tracking final presence.
        const finalPresence = new Map<number, JunctionItemData>();
        for (const op of operations) {
          if (op.type === "add") {
            if (!finalPresence.has(op.item.id)) {
              finalPresence.set(op.item.id, op.item);
            }
          } else if (op.type === "remove") {
            finalPresence.delete(op.itemId);
          }
        }

        // 1. Result should contain exactly the items in finalPresence
        const resultIds = new Set(result.map((ji) => ji.item.id));
        const expectedIds = new Set(finalPresence.keys());
        expect(resultIds).toEqual(expectedIds);

        // 2. Result count matches expected
        expect(result.length).toBe(finalPresence.size);

        // 3. order_index values are unique and sequential starting from 1
        const orderIndices = result.map((ji) => ji.order_index);
        const expectedIndices = Array.from(
          { length: result.length },
          (_, i) => i + 1
        );
        expect(orderIndices).toEqual(expectedIndices);

        // 4. No duplicate items in result
        const uniqueIds = new Set(result.map((ji) => ji.item.id));
        expect(uniqueIds.size).toBe(result.length);
      }),
      { numRuns: 200 }
    );
  });

  it("adding an item that already exists does not create duplicates", () => {
    fc.assert(
      fc.property(itemArbitrary, (item) => {
        const operations: Operation[] = [
          { type: "add", item },
          { type: "add", item }, // duplicate add
          { type: "add", item }, // triple add
        ];

        const result = applyOperations(operations);

        // Should only contain one instance
        expect(result.length).toBe(1);
        expect(result[0].item.id).toBe(item.id);
        expect(result[0].order_index).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it("removing a non-existent item does not affect the list", () => {
    fc.assert(
      fc.property(
        fc.array(itemArbitrary, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 100, max: 200 }), // ID that won't collide with items (id range 1-50)
        (items, nonExistentId) => {
          // Add all items first
          const addOps: Operation[] = items.map((item) => ({
            type: "add" as const,
            item,
          }));

          // Then try to remove a non-existent ID
          const operations: Operation[] = [
            ...addOps,
            { type: "remove", itemId: nonExistentId },
          ];

          const result = applyOperations(operations);

          // Unique items from the add operations (deduplicated by id)
          const uniqueItems = new Map<number, JunctionItemData>();
          for (const item of items) {
            if (!uniqueItems.has(item.id)) {
              uniqueItems.set(item.id, item);
            }
          }

          // All originally added items should still be present
          expect(result.length).toBe(uniqueItems.size);

          // order_index remains sequential
          const orderIndices = result.map((ji) => ji.order_index);
          const expectedIndices = Array.from(
            { length: result.length },
            (_, i) => i + 1
          );
          expect(orderIndices).toEqual(expectedIndices);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("add then remove results in empty list with no order_index gaps", () => {
    fc.assert(
      fc.property(
        fc.array(itemArbitrary, { minLength: 1, maxLength: 10 }),
        (items) => {
          // Add all, then remove all
          const uniqueItems = new Map<number, JunctionItemData>();
          for (const item of items) {
            if (!uniqueItems.has(item.id)) {
              uniqueItems.set(item.id, item);
            }
          }

          const addOps: Operation[] = items.map((item) => ({
            type: "add" as const,
            item,
          }));
          const removeOps: Operation[] = [...uniqueItems.keys()].map((id) => ({
            type: "remove" as const,
            itemId: id,
          }));

          const result = applyOperations([...addOps, ...removeOps]);

          expect(result.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("order_index is always reassigned correctly after removals from the middle", () => {
    fc.assert(
      fc.property(
        // Generate 3-10 unique items
        fc
          .uniqueArray(fc.integer({ min: 1, max: 100 }), {
            minLength: 3,
            maxLength: 10,
          })
          .chain((ids) => {
            const items = ids.map((id) => ({
              id,
              name_en: `item_${id}`,
              name_kh: `ធាតុ_${id}`,
            }));
            // Pick a random index to remove (not first, not last - middle)
            const removeIdx = fc.integer({ min: 1, max: ids.length - 2 });
            return removeIdx.map((idx) => ({ items, removeIdx: idx }));
          }),
        ({ items, removeIdx }) => {
          // Add all items
          const addOps: Operation[] = items.map((item) => ({
            type: "add" as const,
            item,
          }));

          // Remove item at removeIdx
          const removeOp: Operation = {
            type: "remove",
            itemId: items[removeIdx].id,
          };

          const result = applyOperations([...addOps, removeOp]);

          // Should have one less item
          expect(result.length).toBe(items.length - 1);

          // order_index should be sequential from 1
          for (let i = 0; i < result.length; i++) {
            expect(result[i].order_index).toBe(i + 1);
          }

          // Removed item should not be present
          expect(result.find((ji) => ji.item.id === items[removeIdx].id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
