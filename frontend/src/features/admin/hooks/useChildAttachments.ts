"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseChildAttachmentsOptions<T> {
  /** Saved parent id. `undefined` on a create form: there is nothing to load yet. */
  parentId: number | undefined;
  /** Loads the parent's current children (edit mode). */
  load: (parentId: number) => Promise<T[]>;
  /** Moves `child` under the parent at `orderIndex`. */
  attach: (child: T, parentId: number, orderIndex: number) => Promise<unknown>;
}

export interface UseChildAttachmentsReturn<T> {
  /** Children already saved under the parent. */
  items: T[];
  /** Existing rows chosen in the form that will be moved under the parent on save. */
  pending: T[];
  loading: boolean;
  loadFailed: boolean;
  stage: (child: T) => void;
  unstage: (child: T) => void;
  /**
   * Moves every pending child under `parentId`, appended after the current last child
   * (order numbers are unique per parent). Each child leaves `pending` as soon as it
   * succeeds, so if one fails a retry only re-attempts what is left.
   */
  attachPending: (parentId: number) => Promise<void>;
}

/**
 * Children of a curriculum parent (unit -> chapters, chapter -> lessons) plus the existing
 * rows the admin has chosen to attach. Attaching is staged and only applied on save, which
 * also lets it work on a create form where the parent doesn't exist yet.
 */
export function useChildAttachments<T extends { id: number; order_index: number }>({
  parentId,
  load,
  attach,
}: UseChildAttachmentsOptions<T>): UseChildAttachmentsReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [pending, setPending] = useState<T[]>([]);
  const [loading, setLoading] = useState(parentId !== undefined);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (parentId === undefined) return;

    let cancelled = false;
    load(parentId)
      .then((children) => {
        if (!cancelled) setItems(children);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `load` is recreated every render; only a different parent should reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  const stage = useCallback((child: T) => {
    setPending((prev) => (prev.some((p) => p.id === child.id) ? prev : [...prev, child]));
  }, []);

  const unstage = useCallback((child: T) => {
    setPending((prev) => prev.filter((p) => p.id !== child.id));
  }, []);

  const attachPending = async (targetParentId: number) => {
    let order = items.reduce((max, child) => Math.max(max, child.order_index), 0);

    for (const child of pending) {
      order += 1;
      // Copy: the state updater below runs later, after `order` has moved on.
      const assignedOrder = order;
      await attach(child, targetParentId, assignedOrder);
      setItems((prev) => [...prev, { ...child, order_index: assignedOrder }]);
      setPending((prev) => prev.filter((p) => p.id !== child.id));
    }
  };

  return { items, pending, loading, loadFailed, stage, unstage, attachPending };
}
