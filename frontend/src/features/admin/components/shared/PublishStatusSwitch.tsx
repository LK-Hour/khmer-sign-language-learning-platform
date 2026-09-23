"use client";

import { FormControlLabel, Stack, Switch, Typography } from "@mui/material";

import { useTranslation } from "@/i18n/useTranslation";

import { statusTone } from "../../theme/tones";

export interface PublishStatusSwitchProps {
  /** true = Published, false = Draft. */
  checked: boolean;
  onChange: (published: boolean) => void;
  /** Soft-deleted rows can't be published (the backend rejects it), so the switch is locked off. */
  inactive?: boolean;
  disabled?: boolean;
}

/**
 * Single control for a content row's publish state, shown on the curriculum forms.
 * The chosen state is applied on Save: the form saves the row (which always lands as a
 * draft) and, when this is on, follows up with the publish call.
 */
export default function PublishStatusSwitch({
  checked,
  onChange,
  inactive = false,
  disabled = false,
}: PublishStatusSwitchProps) {
  const { t } = useTranslation();

  const help = inactive
    ? t("FORM.PUBLISH_HELP_INACTIVE")
    : checked
      ? t("FORM.PUBLISH_HELP_LIVE")
      : t("FORM.PUBLISH_HELP_DRAFT");

  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {t("FORM.PUBLISH_STATUS")}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            disabled={disabled || inactive}
            onChange={(e) => onChange(e.target.checked)}
          />
        }
        label={checked ? t("ADMIN.PUBLISHED") : t("ADMIN.DRAFT")}
        slotProps={{
          typography: {
            sx: (theme) => ({
              fontWeight: 600,
              color: checked ? statusTone(theme, "success").color : "text.secondary",
            }),
          },
        }}
      />
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {help}
      </Typography>
    </Stack>
  );
}
