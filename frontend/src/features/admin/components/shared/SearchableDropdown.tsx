"use client";

import { useCallback } from "react";
import {
  Autocomplete,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useSearchOptions } from "../../hooks/useSearchOptions";

export interface SearchableDropdownProps<T> {
  label: string;
  value: T | null;
  onChange: (value: T | null) => void;
  fetchOptions: (query: string) => Promise<T[]>;
  getOptionLabel: (option: T) => string;
  getOptionKey: (option: T) => string | number;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Searchable dropdown component for foreign key and single-select fields.
 * Wraps MUI Autocomplete with debounced API search via useSearchOptions.
 * Displays bilingual labels (e.g., "name_en · name_kh") and supports
 * full keyboard navigation (arrow keys, Enter, Escape).
 */
export default function SearchableDropdown<T>({
  label,
  value,
  onChange,
  fetchOptions,
  getOptionLabel,
  getOptionKey,
  required = false,
  error = false,
  helperText,
  disabled = false,
  placeholder,
}: SearchableDropdownProps<T>) {
  const { options, loading, search } = useSearchOptions<T>({
    fetcher: fetchOptions,
    debounceMs: 300,
    initialFetch: true,
  });

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, inputValue: string, reason: string) => {
      if (reason === "input") {
        search(inputValue);
      }
    },
    [search],
  );

  return (
    <Autocomplete<T, false, false, false>
      value={value}
      onChange={(_event, newValue) => onChange(newValue)}
      onInputChange={handleInputChange}
      options={options}
      getOptionLabel={getOptionLabel}
      getOptionKey={(option) => String(getOptionKey(option))}
      isOptionEqualToValue={(option, val) =>
        getOptionKey(option) === getOptionKey(val)
      }
      loading={loading}
      disabled={disabled}
      noOptionsText={
        <Typography variant="body2" color="text.secondary">
          No results found
        </Typography>
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={18} />}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
