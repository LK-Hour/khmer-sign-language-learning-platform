"use client";

import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchTrigger() {
  return (
    <IconButton size="small" aria-label="Search">
      <SearchIcon sx={{ fontSize: 20 }} />
    </IconButton>
  );
}
