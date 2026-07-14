"use client";

import Add from "@mui/icons-material/Add";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import Delete from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import { ApiError } from "@/utils/api/client";

import * as mediaApi from "../api/mediaAdminApi";
import type { MediaResponse, PaginatedMediaResponse } from "../api/mediaAdminApi";
import DataTable, { type DataTableColumn } from "../components/shared/DataTable";
import PageHeader from "../components/shared/PageHeader";

import MediaUploadDialog from "./MediaUploadDialog";
import MediaDetailPanel from "./MediaDetailPanel";
import { filterMediaByType } from "./mediaFilterUtils";

export type ViewMode = "grid" | "list";
export type MediaTypeFilter = "all" | "image" | "video" | "gif";

export interface AdminMediaManagerProps {
  /** Optional type filter to restrict displayed assets to a specific media type */
  typeFilter?: "image" | "video";
}

// Re-export for backward compatibility
export { filterMediaByType } from "./mediaFilterUtils";

// ── Helper: extract file name from URL ───────────────────────────────────────

function getFileName(fileUrl: string): string {
  const parts = fileUrl.split("/");
  return parts[parts.length - 1] || fileUrl;
}

// ── Helper: get associated name (letter or word) ─────────────────────────────

function getAssociatedName(associations: MediaResponse["associations"]): string {
  if (!associations || associations.length === 0) return "—";
  return associations.map((a) => a.target_name).join(", ");
}

export default function AdminMediaManager(props?: AdminMediaManagerProps) {
  const { typeFilter } = props ?? {};
  const { t } = useTranslation();

  // ── Pagination State ───────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Data State ─────────────────────────────────────────────────────────────
  const [mediaData, setMediaData] = useState<PaginatedMediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Upload Modal State ─────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);

  // ── Search State ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page on new search
  }, []);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input so we don't fire API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset to first page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Detail Panel State ─────────────────────────────────────────────────────
  const [selectedMedia, setSelectedMedia] = useState<MediaResponse | null>(null);

  // ── Actions Menu State ─────────────────────────────────────────────────────
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuMedia, setMenuMedia] = useState<MediaResponse | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: mediaApi.ListMediaParams = {
        page: page + 1, // API is 1-indexed
        size: rowsPerPage,
      };
      // If typeFilter prop is provided, use it for the API query
      if (typeFilter) {
        params.media_type = typeFilter;
      }
      // Pass search query to the API for server-side filtering
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const data = await mediaApi.listMedia(params);
      setMediaData(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load media assets.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, typeFilter, debouncedSearch]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  // ── Client-side filtering by typeFilter (fallback if API doesn't filter) ───
  const filteredItems = useMemo(() => {
    if (!mediaData) return [];
    let result = mediaData.items;
    if (typeFilter) {
      result = filterMediaByType(result, typeFilter);
    }
    return result;
  }, [mediaData, typeFilter]);

  const totalCount = mediaData?.total ?? 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUploadSuccess = () => {
    setUploadOpen(false);
    void loadMedia();
  };

  const handleMediaSelect = (media: MediaResponse) => {
    setSelectedMedia(media);
  };

  const handleDetailClose = () => {
    setSelectedMedia(null);
  };

  const handleMediaDeleted = () => {
    setSelectedMedia(null);
    void loadMedia();
  };

  const handleRetry = () => {
    void loadMedia();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, media: MediaResponse) => {
    setMenuAnchor(event.currentTarget);
    setMenuMedia(media);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuMedia(null);
  };

  const handleMenuView = () => {
    if (menuMedia) handleMediaSelect(menuMedia);
    handleMenuClose();
  };

  const handleMenuDelete = async () => {
    if (menuMedia) {
      try {
        await mediaApi.deleteMedia(menuMedia.id);
        void loadMedia();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to delete media.");
      }
    }
    handleMenuClose();
  };

  // ── Table Columns: ID, Name (letter/word), File URL, Type, Size, Actions ────
  const columns: DataTableColumn<MediaResponse>[] = useMemo(
    () => [
      { id: "id", label: "ID", width: 60 },
      {
        id: "name",
        label: typeFilter === "image" ? "Letter" : "Word",
        width: 180,
        render: (row) => getAssociatedName(row.associations),
      },
      {
        id: "file_url",
        label: "File URL",
        sortable: false,
        render: (row) => getFileName(row.file_url),
      },
      {
        id: "media_type",
        label: "Type",
        width: 100,
        sortable: false,
        render: (row) => (
          <Chip
            label={row.media_type}
            size="small"
            color={row.media_type === "video" ? "info" : "default"}
            variant="outlined"
          />
        ),
      },
      {
        id: "size",
        label: "Size",
        width: 80,
        render: () => "—",
      },
      {
        id: "actions",
        label: "Actions",
        width: 70,
        sortable: false,
        render: (row) => (
          <Tooltip title="Actions">
            <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
              <MoreVertRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typeFilter],
  );

  // ── Page title based on typeFilter ─────────────────────────────────────────
  const pageTitle = typeFilter
    ? `Media Library – ${typeFilter === "image" ? "Images" : "Videos"}`
    : "Media Library";

  return (
    <>
      <PageHeader
        title={pageTitle}
        subtitle={`${t("ADMIN.MANAGEMENT")} / Media`}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setUploadOpen(true)}
          >
            Upload
          </Button>
        }
      />

      <Stack spacing={2}>
        {/* Search */}
        <TextField
          placeholder={`Search ${typeFilter === "image" ? "images" : typeFilter === "video" ? "videos" : "media"}...`}
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded sx={{ fontSize: 20, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ maxWidth: 320 }}
        />

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Data Table with columns: ID, File name, Type, Linked To, Size, Actions */}
        <DataTable<MediaResponse>
          columns={columns}
          rows={filteredItems}
          loading={loading}
          pagination={{
            page,
            rowsPerPage,
            total: totalCount,
          }}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(rpp) => {
            setRowsPerPage(rpp);
            setPage(0);
          }}
        />
      </Stack>

      {/* Upload Dialog */}
      <MediaUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Detail Panel */}
      <MediaDetailPanel
        media={selectedMedia}
        onClose={handleDetailClose}
        onDeleted={handleMediaDeleted}
        onUpdated={loadMedia}
      />

      {/* Actions Menu (3-dot) */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { minWidth: 140 } } }}
      >
        <MenuItem onClick={handleMenuView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuDelete} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
