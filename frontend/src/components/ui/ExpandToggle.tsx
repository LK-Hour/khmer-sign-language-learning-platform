import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import IconButton from "@mui/material/IconButton";
import { kslColors } from "@/theme/theme";

type ExpandToggleProps = {
  expanded: boolean;
  onClick: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export default function ExpandToggle({
  expanded,
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
}: ExpandToggleProps) {
  return (
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={ariaLabel ?? (expanded ? "Collapse" : "Expand")}
      aria-expanded={expanded}
      sx={{
        width: 44,
        height: 44,
        flexShrink: 0,
        bgcolor: disabled ? "grey.200" : kslColors.primaryTrack,
        color: disabled ? kslColors.locked : kslColors.primary,
        "&:hover": {
          bgcolor: disabled ? "grey.200" : kslColors.primaryLight,
        },
        "&.Mui-disabled": {
          color: kslColors.locked,
        },
      }}
    >
      {expanded ? (
        <RemoveIcon sx={{ fontSize: 22 }} />
      ) : (
        <AddIcon sx={{ fontSize: 22 }} />
      )}
    </IconButton>
  );
}
