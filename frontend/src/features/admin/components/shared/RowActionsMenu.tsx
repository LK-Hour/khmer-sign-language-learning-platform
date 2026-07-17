"use client";

import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useState, type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RowActionsMenuExtraItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: string;
}

export interface RowActionsMenuProps {
  /** Called when "Preview" is selected. Omit to hide the Preview action. */
  onPreview?: () => void;
  /** Called when "Edit" is selected. Omit to hide the Edit action. */
  onEdit?: () => void;
  /** Called when "Delete" is selected. Omit to hide the Delete action. */
  onDelete?: () => void;
  /** Additional menu items rendered between Edit and Delete (e.g. Publish, Restore). */
  extraActions?: RowActionsMenuExtraItem[];
  /** Disables the whole menu trigger (e.g. protected admin rows). */
  disabled?: boolean;
  /** Tooltip shown on the trigger button when disabled. */
  disabledReason?: string;
  previewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Standard 3-dot row actions menu for admin tables: Preview, Edit, Delete.
 * Any action can be omitted by not passing its handler — e.g. tables with
 * no preview route just skip `onPreview`.
 */
export default function RowActionsMenu({
  onPreview,
  onEdit,
  onDelete,
  extraActions,
  disabled = false,
  disabledReason,
  previewLabel = "Preview",
  editLabel = "Edit",
  deleteLabel = "Delete",
}: RowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleAction = (action?: () => void) => {
    handleClose();
    action?.();
  };

  const trigger = (
    <IconButton
      size="small"
      onClick={handleOpen}
      disabled={disabled}
      aria-label="Row actions"
    >
      <MoreVertRounded fontSize="small" />
    </IconButton>
  );

  return (
    <>
      {disabled && disabledReason ? (
        <Tooltip title={disabledReason}>
          <span>{trigger}</span>
        </Tooltip>
      ) : (
        trigger
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        {onPreview && (
          <MenuItem onClick={() => handleAction(onPreview)}>
            <ListItemIcon>
              <VisibilityRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>{previewLabel}</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => handleAction(onEdit)}>
            <ListItemIcon>
              <EditRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText>{editLabel}</ListItemText>
          </MenuItem>
        )}
        {extraActions?.map((extra, index) => (
          <MenuItem
            key={index}
            onClick={() => handleAction(extra.onClick)}
            sx={extra.color ? { color: extra.color } : undefined}
          >
            {extra.icon && (
              <ListItemIcon sx={extra.color ? { color: extra.color } : undefined}>
                {extra.icon}
              </ListItemIcon>
            )}
            <ListItemText>{extra.label}</ListItemText>
          </MenuItem>
        ))}
        {onDelete && (
          <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <DeleteRounded fontSize="small" sx={{ color: "error.main" }} />
            </ListItemIcon>
            <ListItemText>{deleteLabel}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
