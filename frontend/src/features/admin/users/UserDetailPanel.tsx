"use client";

import Close from "@mui/icons-material/Close";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import type { UserResponse } from "../api/userAdminApi";
import StatusChip from "../components/shared/StatusChip";

// ── Types ────────────────────────────────────────────────────────────────────

interface UserDetailPanelProps {
  user: UserResponse | null;
  open: boolean;
  onClose: () => void;
  currentAdminId: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

/** Slide-out drawer showing full user details with theme tokens. */
export default function UserDetailPanel({
  user,
  open,
  onClose,
}: UserDetailPanelProps) {
  if (!user) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Stack
        sx={{
          width: { xs: "100%", sm: 400 },
          p: 3,
          bgcolor: "background.paper",
        }}
        spacing={2}
      >
        {/* Header */}
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
            User Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* Avatar + Name */}
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar
            src={user.avatar_url ?? undefined}
            alt={user.display_name}
            sx={{ width: 56, height: 56 }}
          >
            {user.display_name[0]?.toUpperCase()}
          </Avatar>
          <Stack>
            <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
              {user.display_name}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              {user.email ?? "No email"}
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* Details */}
        <Box>
          <DetailRow label="Username" value={user.username} />
          <DetailRow label="Account Type" value={user.account_type} />
          <DetailRow label="Auth Provider" value={user.auth_provider} />
          <DetailRow label="Guest" value={user.is_guest ? "Yes" : "No"} />
          <DetailRow
            label="Status"
            value={<StatusChip variant={user.is_active ? "active" : "inactive"} />}
          />
          <DetailRow
            label="Last Login"
            value={
              user.last_login_at
                ? new Date(user.last_login_at).toLocaleString()
                : "Never"
            }
          />
          <DetailRow
            label="Created"
            value={new Date(user.created_at).toLocaleString()}
          />
        </Box>
      </Stack>
    </Drawer>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
        borderBottom: (t) => `1px dashed ${t.palette.divider}`,
      }}
    >
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", textTransform: "capitalize", color: "text.primary" }}>
        {value}
      </Typography>
    </Stack>
  );
}
