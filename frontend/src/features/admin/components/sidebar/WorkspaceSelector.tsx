"use client";

import { useState } from "react";
import {
  Box,
  ButtonBase,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Typography,
} from "@mui/material";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { useAdminUiStore } from "../../store/adminUi.store";
import { useTranslation } from "@/i18n/useTranslation";
import type { AdminTrack } from "../../api/types";

interface TrackOption {
  id: AdminTrack;
  labelKey: string;
  color: string;
}

const TRACK_OPTIONS: TrackOption[] = [
  { id: "finger", labelKey: "ADMIN.TRACK_FINGER", color: "#0C44AE" },
  { id: "word_detection", labelKey: "ADMIN.TRACK_WORD_DETECTION", color: "#22C55E" },
];

export default function WorkspaceSelector() {
  const track = useAdminUiStore((state) => state.track);
  const setTrack = useAdminUiStore((state) => state.setTrack);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { t } = useTranslation();

  const open = Boolean(anchorEl);
  const currentOption = TRACK_OPTIONS.find((opt) => opt.id === track) ?? TRACK_OPTIONS[0];

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (selected: AdminTrack) => {
    setTrack(selected);
    handleClose();
  };

  return (
    <Box sx={{ px: 2.5, pb: 1 }}>
      <ButtonBase
        onClick={handleOpen}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderRadius: 1.5,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Colored dot indicator */}
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: currentOption.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
            {t(currentOption.labelKey as Parameters<typeof t>[0])}
          </Typography>
        </Box>
        <UnfoldMoreIcon sx={{ fontSize: 18, color: "text.secondary" }} />
      </ButtonBase>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { width: 220, mt: 0.5, borderRadius: 1.5 },
          },
        }}
      >
        <List disablePadding sx={{ py: 0.5 }}>
          {TRACK_OPTIONS.map((option) => (
            <ListItemButton
              key={option.id}
              selected={option.id === track}
              onClick={() => handleSelect(option.id)}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                mx: 0.5,
                "&.Mui-selected": {
                  bgcolor: "rgba(12, 68, 174, 0.08)",
                  "&:hover": { bgcolor: "rgba(12, 68, 174, 0.12)" },
                },
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: option.color,
                  mr: 1.5,
                  flexShrink: 0,
                }}
              />
              <ListItemText
                primary={t(option.labelKey as Parameters<typeof t>[0])}
                slotProps={{
                  primary: {
                    sx: { fontSize: "0.875rem", fontWeight: 500 },
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </Box>
  );
}
