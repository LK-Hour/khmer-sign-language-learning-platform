/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useChildAttachments } from "./useChildAttachments";

interface Child {
  id: number;
  order_index: number;
}

const child = (id: number, order_index: number): Child => ({ id, order_index });

type Attach = (child: Child, parentId: number, orderIndex: number) => Promise<unknown>;

function setup(options: { parentId?: number; existing?: Child[]; attach?: Attach } = {}) {
  const attach = vi.fn<Attach>(options.attach ?? (async () => undefined));
  const load = vi.fn(async () => options.existing ?? []);
  const hook = renderHook(() =>
    useChildAttachments<Child>({ parentId: options.parentId, load, attach }),
  );
  return { ...hook, attach, load };
}

describe("useChildAttachments", () => {
  it("loads the parent's children in edit mode", async () => {
    const { result, load } = setup({ parentId: 7, existing: [child(1, 1), child(2, 2)] });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(load).toHaveBeenCalledWith(7);
    expect(result.current.items).toEqual([child(1, 1), child(2, 2)]);
  });

  it("does not load anything on a create form", () => {
    const { result, load } = setup({ parentId: undefined });

    expect(load).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
  });

  it("stages a child once and lets it be undone", () => {
    const { result } = setup();

    act(() => result.current.stage(child(9, 3)));
    act(() => result.current.stage(child(9, 3)));
    expect(result.current.pending).toEqual([child(9, 3)]);

    act(() => result.current.unstage(child(9, 3)));
    expect(result.current.pending).toEqual([]);
  });

  it("appends attached children after the current last order and moves them into items", async () => {
    const { result, attach } = setup({ parentId: 7, existing: [child(1, 1), child(2, 4)] });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.stage(child(10, 1));
      result.current.stage(child(11, 1));
    });
    await act(async () => {
      await result.current.attachPending(7);
    });

    expect(attach).toHaveBeenNthCalledWith(1, child(10, 1), 7, 5);
    expect(attach).toHaveBeenNthCalledWith(2, child(11, 1), 7, 6);
    expect(result.current.pending).toEqual([]);
    expect(result.current.items.map((c) => [c.id, c.order_index])).toEqual([
      [1, 1],
      [2, 4],
      [10, 5],
      [11, 6],
    ]);
  });

  it("starts at order 1 for a brand-new parent", async () => {
    const { result, attach } = setup();

    act(() => result.current.stage(child(10, 3)));
    await act(async () => {
      await result.current.attachPending(42);
    });

    expect(attach).toHaveBeenCalledWith(child(10, 3), 42, 1);
  });

  it("keeps only the unattached children pending when one fails, so a retry skips the done ones", async () => {
    let calls = 0;
    const { result, attach } = setup({
      attach: async () => {
        calls += 1;
        if (calls === 2) throw new Error("conflict");
      },
    });

    act(() => {
      result.current.stage(child(10, 1));
      result.current.stage(child(11, 1));
      result.current.stage(child(12, 1));
    });
    await act(async () => {
      await expect(result.current.attachPending(7)).rejects.toThrow("conflict");
    });

    expect(result.current.items.map((c) => c.id)).toEqual([10]);
    expect(result.current.pending.map((c) => c.id)).toEqual([11, 12]);

    await act(async () => {
      await result.current.attachPending(7);
    });

    // 10 was never attached again; 11 continues from the order after 10.
    expect(attach.mock.calls.map(([c, , order]) => [c.id, order])).toEqual([
      [10, 1],
      [11, 2],
      [11, 2],
      [12, 3],
    ]);
    expect(result.current.pending).toEqual([]);
  });
});
