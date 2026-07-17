"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Add from "@mui/icons-material/Add";
import { Alert, Box, Button } from "@mui/material";
import PageHeader from "../components/shared/PageHeader";
import SearchInput from "../components/shared/SearchInput";
import DataTable, { type DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";
import RowActionsMenu from "../components/shared/RowActionsMenu";
import PreviewDrawer from "../components/shared/PreviewDrawer";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import {
  listCharacters,
  listWords,
  getCharacter,
  getWord,
  deleteCharacter,
  deleteWord,
  type DictionaryItem,
  type PaginatedDictionaryResponse,
} from "../api/dictionaryAdminApi";
import type { MediaResponse } from "../api/mediaAdminApi";
import { MediaCarousel } from "../components/shared/MediaCarousel";
import { ApiError } from "@/utils/api/client";
import SuccessSnackbar from "../components/shared/SuccessSnackbar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DictionaryPageProps {
  type: "characters" | "words";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DictionaryPage({ type }: DictionaryPageProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [data, setData] = useState<PaginatedDictionaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewItem, setPreviewItem] = useState<DictionaryItem | null>(null);
  const [previewMedias, setPreviewMedias] = useState<MediaResponse[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DictionaryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const title = type === "characters" ? "Characters" : "Words";
  const basePath = `/admin/dictionary/${type}`;

  const handlePreview = useCallback(async (row: DictionaryItem) => {
    setPreviewItem(row);
    setPreviewMedias([]);
    try {
      const detail = type === "characters"
        ? await getCharacter(row.id)
        : await getWord(row.id);
      setPreviewMedias(detail.medias ?? []);
    } catch { /* non-critical */ }
  }, [type]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1, // API is 1-indexed
        size: rowsPerPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      };
      const fetcher = type === "characters" ? listCharacters : listWords;
      const result = await fetcher(params);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, type]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Table columns
  const columns: DataTableColumn<DictionaryItem>[] = [
    { id: "id", label: "ID", width: 80 },
    { id: "name_kh", label: "Name (KH)" },
    { id: "name_en", label: "Name (EN)" },
    { id: "media_count", label: "Media Count", width: 120 },
    {
      id: "is_active",
      label: "Status",
      width: 120,
      render: (row) => (
        <StatusChip variant={row.is_active ? "published" : "draft"} />
      ),
    },
    {
      id: "created_at",
      label: "Created At",
      width: 180,
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString()
          : "—",
    },
    {
      id: "actions",
      label: "Actions",
      width: 80,
      sortable: false,
      render: (row) => (
        <RowActionsMenu
          onPreview={() => handlePreview(row)}
          onEdit={() => router.push(`${basePath}/${row.id}/edit`)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (type === "characters") {
        await deleteCharacter(deleteTarget.id);
      } else {
        await deleteWord(deleteTarget.id);
      }
      setDeleteTarget(null);
      void loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete item.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: "Dictionary" },
          { label: title },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push(`${basePath}/create`)}
          >
            Create {type === "characters" ? "Character" : "Word"}
          </Button>
        }
      />

      {/* Search row */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${title.toLowerCase()}…`}
          sx={{ width: { xs: "100%", sm: 260 } }}
        />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data table */}
      <DataTable<DictionaryItem>
        columns={columns}
        rows={data?.items ?? []}
        loading={loading}
        onRowClick={(row) => router.push(`${basePath}/${row.id}/edit`)}
        pagination={{
          page,
          rowsPerPage,
          total: data?.total ?? 0,
        }}
        onPageChange={setPage}
        onRowsPerPageChange={(rpp) => {
          setRowsPerPage(rpp);
          setPage(0);
        }}
      />

      {/* Success notification from form submission */}
      <SuccessSnackbar />

      {/* Preview drawer */}
      <PreviewDrawer
        open={previewItem !== null}
        onClose={() => { setPreviewItem(null); setPreviewMedias([]); }}
        title={previewItem?.name_kh ?? ""}
        subtitle={previewItem?.name_en ?? undefined}
        media={<MediaCarousel medias={previewMedias} emptyLabel="No media" />}
        fields={
          previewItem
            ? [
                { label: "ID", value: previewItem.id },
                { label: "Name (KH)", value: previewItem.name_kh },
                { label: "Name (EN)", value: previewItem.name_en ?? "—" },
                { label: "Media Count", value: previewItem.media_count },
                {
                  label: "Status",
                  value: (
                    <StatusChip variant={previewItem.is_active ? "published" : "draft"} />
                  ),
                },
                {
                  label: "Created At",
                  value: previewItem.created_at
                    ? new Date(previewItem.created_at).toLocaleDateString()
                    : "—",
                },
              ]
            : []
        }
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${type === "characters" ? "Character" : "Word"}?`}
        message={`Are you sure you want to delete "${deleteTarget?.name_kh ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </Box>
  );
}
