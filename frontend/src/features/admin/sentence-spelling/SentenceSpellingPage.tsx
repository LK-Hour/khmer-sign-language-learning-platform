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
import ConfirmDialog from "../components/shared/ConfirmDialog";
import SuccessSnackbar from "../components/shared/SuccessSnackbar";
import {
  listSentences,
  deleteSentence,
  type SentenceItem,
  type PaginatedSentenceResponse,
} from "../api/sentenceSpellingAdminApi";
import { ApiError } from "@/utils/api/client";
import { useLocale } from "@/i18n/locale-context";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SentenceSpellingPage() {
  const router = useRouter();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [data, setData] = useState<PaginatedSentenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SentenceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const basePath = `/${locale}/admin/sentence-spelling`;

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
      const result = await listSentences(params);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Table columns
  const columns: DataTableColumn<SentenceItem>[] = [
    { id: "id", label: "ID", width: 80 },
    { id: "text_kh", label: "Sentence (KH)" },
    {
      id: "text_en",
      label: "Sentence (EN)",
      render: (row) => row.text_en ?? "—",
    },
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
      await deleteSentence(deleteTarget.id);
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
        title="Sentence Spelling"
        breadcrumbs={[{ label: "Sentence Spelling" }]}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push(`${basePath}/create`)}
          >
            Create Sentence
          </Button>
        }
      />

      {/* Search row */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sentences…"
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
      <DataTable<SentenceItem>
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

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Sentence?"
        message={`Are you sure you want to delete "${deleteTarget?.text_kh ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </Box>
  );
}
