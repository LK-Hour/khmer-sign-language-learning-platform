"use client";

import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

interface NotificationBellProps {
  count?: number;
}

export default function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <IconButton size="small" aria-label="Notifications">
      <Badge
        badgeContent={count}
        color="error"
        invisible={count === 0}
      >
        <NotificationsNoneIcon sx={{ fontSize: 20 }} />
      </Badge>
    </IconButton>
  );
}
