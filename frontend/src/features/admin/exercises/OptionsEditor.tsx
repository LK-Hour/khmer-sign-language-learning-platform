"use client";

import { useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import DragIndicator from "@mui/icons-material/DragIndicator";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";

import SearchableDropdown from "../components/shared/SearchableDropdown";
import { listMedia } from "../api/mediaAdminApi";
import type { MediaResponse } from "../api/mediaAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseOptionFormState {
  id?: number; // Undefined for new options
  option_text_en: string;
  option_text_kh: string;
  media_id: number | null;
  is_correct: boolean;
  points: number;
  order_index: number;
}

export interface OptionsEditorProps {
  options: ExerciseOptionFormState[];
  onChange: (options: ExerciseOptionFormState[]) => void;
  exerciseType: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createBlankOption(orderIndex: number): ExerciseOptionFormState {
  return {
    option_text_en: "",
    option_text_kh: "",
    media_id: null,
    is_correct: false,
    points: 0,
    order_index: orderIndex,
  };
}

/** Reassign order_index values based on array position (1-based). */
function reindex(options: ExerciseOptionFormState[]): ExerciseOptionFormState[] {
  return options.map((opt, i) => ({ ...opt, order_index: i + 1 }));
}

/** Fetch media options for the SearchableDropdown. */
async function fetchMediaOptions(query: string): Promise<MediaResponse[]> {
  const response = await listMedia({ search: query, size: 20 });
  return response.items;
}

function getMediaLabel(media: MediaResponse): string {
  return media.file_url;
}

function getMediaKey(media: MediaResponse): number {
  return media.id;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Inline editor for managing exercise answer options.
 * Renders as a card section with option rows that support add, remove,
 * reorder, and editing of text/media/correctness/points fields.
 */
export default function OptionsEditor({
  options,
  onChange,
  exerciseType,
}: OptionsEditorProps) {
  const handleFieldChange = useCallback(
    (index: number, field: keyof ExerciseOptionFormState, value: unknown) => {
      const updated = options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt,
      );
      onChange(updated);
    },
    [options, onChange],
  );

  const handleIsCorrectChange = useCallback(
    (index: number, checked: boolean) => {
      const updated = options.map((opt, i) =>
        i === index ? { ...opt, is_correct: checked } : opt,
      );
      onChange(updated);
    },
    [options, onChange],
  );

  const handleAddOption = useCallback(() => {
    const newOption = createBlankOption(options.length + 1);
    onChange([...options, newOption]);
  }, [options, onChange]);

  const handleRemoveOption = useCallback(
    (index: number) => {
      const updated = options.filter((_, i) => i !== index);
      onChange(reindex(updated));
    },
    [options, onChange],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const updated = [...options];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      onChange(reindex(updated));
    },
    [options, onChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= options.length - 1) return;
      const updated = [...options];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      onChange(reindex(updated));
    },
    [options, onChange],
  );

  const handleMediaChange = useCallback(
    (index: number, media: MediaResponse | null) => {
      handleFieldChange(index, "media_id", media ? media.id : null);
    },
    [handleFieldChange],
  );

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              color: "text.secondary",
              fontSize: "0.75rem",
            }}
          >
            Options ({exerciseType.replace(/_/g, " ")})
          </Typography>
          <Button size="small" startIcon={<Add />} onClick={handleAddOption}>
            Add Option
          </Button>
        </Stack>

        {/* Option Rows */}
        <Stack spacing={2}>
          {options.map((option, index) => (
            <Box
              key={option.id ?? `new-${index}`}
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.default",
              }}
            >
              <Stack spacing={1.5}>
                {/* Top row: drag/reorder controls, order badge, remove button */}
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <DragIndicator
                      fontSize="small"
                      sx={{ color: "text.disabled", cursor: "grab" }}
                    />
                    <Tooltip title="Move up">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === options.length - 1}
                        >
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        bgcolor: "action.selected",
                        px: 1,
                        py: 0.25,
                        borderRadius: 0.5,
                      }}
                    >
                      #{option.order_index}
                    </Typography>
                  </Stack>

                  <Tooltip title="Remove option">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Text fields: EN / KH in two-column grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.5,
                  }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    label={`Option Text (EN)`}
                    value={option.option_text_en}
                    onChange={(e) =>
                      handleFieldChange(index, "option_text_en", e.target.value)
                    }
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label={`Option Text (KH)`}
                    value={option.option_text_kh}
                    onChange={(e) =>
                      handleFieldChange(index, "option_text_kh", e.target.value)
                    }
                  />
                </Box>

                {/* Media dropdown + is_correct + points in row */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
                    gap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <SearchableDropdown<MediaResponse>
                    label="Media"
                    value={
                      option.media_id
                        ? ({ id: option.media_id, file_url: "", media_type: "image", created_at: "", associations: [] } as MediaResponse)
                        : null
                    }
                    onChange={(media) => handleMediaChange(index, media)}
                    fetchOptions={fetchMediaOptions}
                    getOptionLabel={getMediaLabel}
                    getOptionKey={getMediaKey}
                    placeholder="Search media..."
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Points"
                    value={option.points}
                    onChange={(e) =>
                      handleFieldChange(
                        index,
                        "points",
                        Number.parseInt(e.target.value, 10) || 0,
                      )
                    }
                    slotProps={{ htmlInput: { min: 0 } }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={option.is_correct}
                        onChange={(e) =>
                          handleIsCorrectChange(index, e.target.checked)
                        }
                        size="small"
                      />
                    }
                    label="Correct"
                    sx={{
                      ".MuiFormControlLabel-label": { fontSize: "0.8125rem" },
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>

        {/* Empty state */}
        {options.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 3 }}
          >
            No options yet. Click &quot;Add Option&quot; to get started.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
