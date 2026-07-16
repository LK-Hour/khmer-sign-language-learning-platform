"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import { Alert, Box, Button, IconButton, Tooltip } from "@mui/material";
import PageHeader from "../components/shared/PageHeader";
import SearchInput from "../components/shared/SearchInput";
import DataTable, { type DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";
import {
  listCharacters,
  listWords,
  type DictionaryItem,
  type PaginatedDictionaryResponse,
} from "../api/dictionaryAdminApi";
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

  const title = type === "characters" ? "Characters" : "Words";
  const basePath = `/admin/dictionary/${type}`;

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
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => router.push(`${basePath}/${row.id}/edit`)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

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
    </Box>
  );
}
