"use client";

import { useCallback, useMemo } from "react";
import {
  Badge,
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import SearchableDropdown from "./SearchableDropdown";

// ── Types ────────────────────────────────────────────────────────────────────

export interface JunctionItem<T> {
  item: T;
  order_index: number;
}

export interface JunctionFieldEditorProps<T> {
  label: string;
  selectedItems: JunctionItem<T>[];
  onAdd: (item: T) => void;
  onRemove: (item: T) => void;
  onReorder: (items: JunctionItem<T>[]) => void;
  fetchOptions: (query: string) => Promise<T[]>;
  getOptionLabel: (option: T) => string;
  getOptionKey: (option: T) => string | number;
  showOrderIndex?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Manages many-to-many relationships through junction tables.
 * Renders a SearchableDropdown for adding items and displays
 * selected items as Chips with optional order_index badges
 * and reorder controls.
 */
export default function JunctionFieldEditor<T>({
  label,
  selectedItems,
  onAdd,
  onRemove,
  onReorder,
  fetchOptions,
  getOptionLabel,
  getOptionKey,
  showOrderIndex = false,
}: JunctionFieldEditorProps<T>) {
  // Filter already-selected items from dropdown options
  const selectedKeys = useMemo(
    () => new Set(selectedItems.map((si) => getOptionKey(si.item))),
    [selectedItems, getOptionKey],
  );

  const filteredFetchOptions = useCallback(
    async (query: string): Promise<T[]> => {
      const results = await fetchOptions(query);
      return results.filter((item) => !selectedKeys.has(getOptionKey(item)));
    },
    [fetchOptions, selectedKeys, getOptionKey],
  );

  // Handle adding a new item from the dropdown
  const handleAdd = useCallback(
    (item: T | null) => {
      if (item) {
        onAdd(item);
      }
    },
    [onAdd],
  );

  // Handle removing an item
  const handleRemove = useCallback(
    (item: T) => {
      onRemove(item);
    },
    [onRemove],
  );

  // Move item up in order
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const updated = [...selectedItems];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      // Reassign order_index values based on new positions
      const reindexed = updated.map((item, i) => ({
        ...item,
        order_index: i + 1,
      }));
      onReorder(reindexed);
    },
    [selectedItems, onReorder],
  );

  // Move item down in order
  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= selectedItems.length - 1) return;
      const updated = [...selectedItems];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      // Reassign order_index values based on new positions
      const reindexed = updated.map((item, i) => ({
        ...item,
        order_index: i + 1,
      }));
      onReorder(reindexed);
    },
    [selectedItems, onReorder],
  );

  return (
    <Stack spacing={2}>
      {/* Section Heading */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>

      {/* Searchable Dropdown for adding items */}
      <SearchableDropdown<T>
        label={`Search ${label}`}
        value={null}
        onChange={handleAdd}
        fetchOptions={filteredFetchOptions}
        getOptionLabel={getOptionLabel}
        getOptionKey={getOptionKey}
        placeholder={`Type to search and add ${label.toLowerCase()}…`}
      />

      {/* Selected Items as Chips */}
      {selectedItems.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
          }}
        >
          {selectedItems.map((junctionItem, index) => {
            const chipLabel = getOptionLabel(junctionItem.item);
            const itemKey = String(getOptionKey(junctionItem.item));
            const chip = (
              <Chip
                key={itemKey}
                label={
                  <Stack
                    direction="row"
                    sx={{ alignItems: "center" }}
                    spacing={0.5}
                  >
                    <span>{chipLabel}</span>
                    {/* Reorder controls */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(index);
                      }}
                      disabled={index === 0}
                      sx={{ p: 0.25 }}
                      aria-label={`Move ${chipLabel} up`}
                    >
                      <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(index);
                      }}
                      disabled={index === selectedItems.length - 1}
                      sx={{ p: 0.25 }}
                      aria-label={`Move ${chipLabel} down`}
                    >
                      <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                }
                onDelete={() => handleRemove(junctionItem.item)}
                deleteIcon={<DeleteIcon fontSize="small" />}
                variant="outlined"
                sx={{ py: 2.5 }}
              />
            );

            // Wrap in Badge to show order_index when showOrderIndex is true
            if (showOrderIndex) {
              return (
                <Badge
                  key={itemKey}
                  badgeContent={junctionItem.order_index}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.7rem",
                      minWidth: 18,
                      height: 18,
                    },
                  }}
                >
                  {chip}
                </Badge>
              );
            }

            return chip;
          })}
        </Box>
      )}

      {/* Empty state */}
      {selectedItems.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No items selected. Use the search above to add items.
        </Typography>
      )}
    </Stack>
  );
}
