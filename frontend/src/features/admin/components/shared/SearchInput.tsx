"use client";

import { IconButton, InputAdornment, OutlinedInput } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import type { SxProps, Theme } from "@mui/material/styles";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  sx,
}: SearchInputProps) {
  return (
    <OutlinedInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="small"
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon sx={{ color: "grey.500", fontSize: 20 }} />
        </InputAdornment>
      }
      endAdornment={
        value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange("")} edge="end">
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </InputAdornment>
        ) : null
      }
      sx={{
        borderRadius: "8px",
        fontSize: "0.875rem",
        ...sx,
      }}
    />
  );
}
