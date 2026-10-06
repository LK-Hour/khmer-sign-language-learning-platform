import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import IconButton from "@mui/material/IconButton";
import { KslColors } from "@/theme/theme";

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
        bgcolor: disabled ? "grey.200" : KslColors.primaryTrack,
        color: disabled ? KslColors.locked : KslColors.primary,
        "&:hover": {
          bgcolor: disabled ? "grey.200" : KslColors.primaryLight,
        },
        "&.Mui-disabled": {
          color: KslColors.locked,
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
