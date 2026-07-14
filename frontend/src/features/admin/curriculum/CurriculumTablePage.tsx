"use client";

import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Publish from "@mui/icons-material/Publish";
import RestoreFromTrash from "@mui/icons-material/RestoreFromTrash";
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/utils/api/client";

import * as adminApi from "../api/adminApi";
import type {
  AdminChapter,
  AdminEntity,
  AdminLesson,
  AdminTrack,
  AdminUnit,
} from "../api/types";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import type { DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";
import FormDialog from "../components/shared/FormDialog";
import ConfirmDialog from "../components/shared/ConfirmDialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CurriculumTablePageProps {
  track: AdminTrack;
  entity: "units" | "chapters" | "lessons";
}

type FormState = {
  name_en: string;
  name_kh: string;
  description_en: string;
  description_kh: string;
  order_index: number;
  parent_id: number | "";
  level: number;
};

const emptyForm = (orderIndex = 1): FormState => ({
  name_en: "",
  name_kh: "",
  description_en: "",
  description_kh: "",
  order_index: orderIndex,
  parent_id: "",
  level: 0,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CurriculumTablePage({
  track,
  entity,
}: CurriculumTablePageProps) {

  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEntity | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [busy, setBusy] = useState(false);

  const [publishTarget, setPublishTarget] = useState<AdminEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminEntity | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AdminEntity | null>(null);

  const isWordDetection = track === "word_detection";

  // ── Data Loading ──────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [unitRows, chapterRows, lessonRows] = await Promise.all([
        adminApi.listUnits(track),
        adminApi.listChapters(track),
        adminApi.listLessons(track),
      ]);
      setUnits(unitRows);
      setChapters(chapterRows);
      setLessons(lessonRows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [track]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setPage(0);
  }, [track, entity, search, statusFilter]);

  // ── Derived Data ──────────────────────────────────────────────────────────

  const rows: AdminEntity[] =
    entity === "units" ? units : entity === "chapters" ? chapters : lessons;

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter === 1 && row.publish_status !== "draft") return false;
      if (statusFilter === 2 && row.publish_status !== "published") return false;
      if (statusFilter === 3 && !row.is_active) return false;
      if (statusFilter === 4 && row.is_active) return false;
      if (
        needle &&
        !row.name_en.toLowerCase().includes(needle) &&
        !row.name_kh.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  const pagedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  // ── Title & Labels ────────────────────────────────────────────────────────

  const trackLabel = isWordDetection ? "Word Detection" : "Finger Spelling";
  const entityLabel =
    entity === "units" ? "Units" : entity === "chapters" ? "Chapters" : "Lessons";
  const pageTitle = `${trackLabel} — ${entityLabel}`;

  const parentLabel = entity === "chapters" ? "Unit" : "Chapter";
  const parentOptions: AdminEntity[] =
    entity === "chapters" ? units : entity === "lessons" ? chapters : [];

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getChapterCount = (unit: AdminUnit): number => unit.chapter_count;

  const getLessonCount = (row: AdminEntity): number => {
    if (entity === "units") {
      // Sum lessons across chapters belonging to this unit
      return chapters
        .filter((ch) => ch.unit_id === row.id)
        .reduce((sum, ch) => sum + ch.lesson_count, 0);
    }
    if (entity === "chapters") {
      return (row as AdminChapter).lesson_count;
    }
    return 0;
  };

  const getChapterName = (lesson: AdminLesson): string => {
    const chapter = chapters.find((ch) => ch.id === lesson.chapter_id);
    return chapter?.name_en ?? `#${lesson.chapter_id}`;
  };

  const getVideoCount = (_lesson: AdminLesson): number => {
    // Video count not directly available on lesson entity; use exercise_count as proxy
    return _lesson.exercise_count;
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(rows.length + 1));
    setFormOpen(true);
  };

  const openEdit = (row: AdminEntity) => {
    setEditing(row);
    setForm({
      name_en: row.name_en,
      name_kh: row.name_kh,
      description_en: row.description_en ?? "",
      description_kh: row.description_kh ?? "",
      order_index: row.order_index,
      parent_id:
        entity === "chapters"
          ? (row as AdminChapter).unit_id
          : entity === "lessons"
            ? (row as AdminLesson).chapter_id
            : "",
      level: entity === "chapters" ? ((row as AdminChapter).level ?? 0) : 0,
    });
    setFormOpen(true);
  };

  const runAction = async (action: () => Promise<unknown>, successNotice: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setNotice(successNotice);
      await loadAll();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    const base = {
      name_en: form.name_en,
      name_kh: form.name_kh,
      description_en: form.description_en || null,
      description_kh: form.description_kh || null,
      order_index: form.order_index,
    };

    const save = async () => {
      if (entity === "units") {
        return editing
          ? adminApi.updateUnit(track, editing.id, base)
          : adminApi.createUnit(track, base);
      }
      if (entity === "chapters") {
        const body = {
          ...base,
          unit_id: Number(form.parent_id),
          ...(isWordDetection ? { level: form.level } : {}),
        };
        return editing
          ? adminApi.updateChapter(track, editing.id, body)
          : adminApi.createChapter(track, body);
      }
      const body = { ...base, chapter_id: Number(form.parent_id) };
      return editing
        ? adminApi.updateLesson(track, editing.id, body)
        : adminApi.createLesson(track, body);
    };

    const ok = await runAction(save, "Saved as draft successfully");
    if (ok) setFormOpen(false);
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    const id = publishTarget.id;
    const publish = () =>
      entity === "units"
        ? adminApi.publishUnit(track, id)
        : entity === "chapters"
          ? adminApi.publishChapter(track, id)
          : adminApi.publishLesson(track, id);
    const ok = await runAction(publish, "Published successfully");
    if (ok) setPublishTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const remove = () =>
      entity === "units"
        ? adminApi.deleteUnit(track, id)
        : entity === "chapters"
          ? adminApi.deleteChapter(track, id)
          : adminApi.deleteLesson(track, id);
    const ok = await runAction(remove, "Deleted successfully");
    if (ok) setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const id = restoreTarget.id;
    const restore = () =>
      entity === "units"
        ? adminApi.restoreUnit(track, id)
        : entity === "chapters"
          ? adminApi.restoreChapter(track, id)
          : adminApi.restoreLesson(track, id);
    const ok = await runAction(restore, "Restored successfully");
    if (ok) setRestoreTarget(null);
  };

  // ── Column Definitions ────────────────────────────────────────────────────

  const columns: DataTableColumn<AdminEntity>[] = useMemo(() => {
    const cols: DataTableColumn<AdminEntity>[] = [
      {
        id: "row_number",
        label: "#",
        width: 60,
        sortable: false,
        render: (row) => {
          const idx = rows.findIndex((r) => r.id === row.id);
          return idx + 1;
        },
      },
    ];

    if (entity === "units") {
      cols.push(
        {
          id: "name_en",
          label: "Unit Name",
          render: (row) => (
            <Stack sx={{ opacity: row.is_active ? 1 : 0.55 }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
                {row.name_en}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {row.name_kh}
              </Typography>
            </Stack>
          ),
        },
        {
          id: "chapters",
          label: "Chapters",
          width: 100,
          render: (row) => getChapterCount(row as AdminUnit),
        },
        {
          id: "lessons",
          label: "Lessons",
          width: 100,
          render: (row) => getLessonCount(row),
        },
      );
    }

    if (entity === "chapters") {
      cols.push(
        {
          id: "name_en",
          label: "Chapter Name",
          render: (row) => (
            <Stack sx={{ opacity: row.is_active ? 1 : 0.55 }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
                {row.name_en}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {row.name_kh}
              </Typography>
            </Stack>
          ),
        },
        {
          id: "lessons",
          label: "Lessons",
          width: 100,
          render: (row) => (row as AdminChapter).lesson_count,
        },
      );
    }

    if (entity === "lessons") {
      cols.push(
        {
          id: "name_en",
          label: "Word (EN)",
          render: (row) => (
            <Stack sx={{ opacity: row.is_active ? 1 : 0.55 }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
                {row.name_en}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {row.name_kh}
              </Typography>
            </Stack>
          ),
        },
        {
          id: "chapter",
          label: "Chapter",
          render: (row) => (
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              {getChapterName(row as AdminLesson)}
            </Typography>
          ),
        },
        {
          id: "videos",
          label: "Videos",
          width: 90,
          render: (row) => getVideoCount(row as AdminLesson),
        },
      );
    }

    // Status column (shared)
    cols.push({
      id: "status",
      label: "Status",
      sortable: false,
      width: 160,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <StatusChip variant={row.publish_status === "published" ? "published" : "draft"} />
        </Stack>
      ),
    });

    // Actions column (shared)
    cols.push({
      id: "actions",
      label: "Actions",
      sortable: false,
      width: 140,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.is_active && row.publish_status === "draft" && (
            <Tooltip title="Publish">
              <IconButton size="small" color="success" onClick={() => setPublishTarget(row)}>
                <Publish fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.is_active ? (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Restore">
              <IconButton size="small" color="success" onClick={() => setRestoreTarget(row)}>
                <RestoreFromTrash fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    });

    return cols;
  }, [entity, rows, chapters, units]);

  // ── Filter Tabs ───────────────────────────────────────────────────────────

  const filterTabs = [
    { label: "All", count: rows.length },
    { label: "Draft" },
    { label: "Published" },
    { label: "Active" },
    { label: "Inactive" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title={pageTitle}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Create {entity === "units" ? "Unit" : entity === "chapters" ? "Chapter" : "Lesson"}
          </Button>
        }
      />

      <Stack spacing={2}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="info" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        <DataTable<AdminEntity>
          columns={columns}
          rows={pagedRows}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          filterTabs={filterTabs}
          activeFilterIndex={statusFilter}
          onFilterChange={setStatusFilter}
          pagination={{
            page,
            rowsPerPage,
            total: filteredRows.length,
          }}
          onPageChange={setPage}
          onRowsPerPageChange={(rpp) => {
            setRowsPerPage(rpp);
            setPage(0);
          }}
        />
      </Stack>

      {/* Create / Edit Form Dialog */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${entityLabel.slice(0, -1)}` : `Create ${entityLabel.slice(0, -1)}`}
        subtitle="New items are saved as drafts. Publish when ready."
        onSubmit={handleSave}
        loading={busy}
        submitLabel="Save Draft"
        cancelLabel="Cancel"
      >
        {entity !== "units" && (
          <TextField
            select
            required
            fullWidth
            label={parentLabel}
            value={form.parent_id}
            onChange={(e) => setForm({ ...form, parent_id: Number(e.target.value) })}
            sx={{ gridColumn: "1 / -1" }}
          >
            {parentOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name_en} · {option.name_kh}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          required
          fullWidth
          label="Name (EN)"
          value={form.name_en}
          onChange={(e) => setForm({ ...form, name_en: e.target.value })}
        />
        <TextField
          required
          fullWidth
          label="Name (KH)"
          value={form.name_kh}
          onChange={(e) => setForm({ ...form, name_kh: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Description (EN)"
          value={form.description_en}
          onChange={(e) => setForm({ ...form, description_en: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Description (KH)"
          value={form.description_kh}
          onChange={(e) => setForm({ ...form, description_kh: e.target.value })}
        />
        <TextField
          type="number"
          label="Sort Order"
          value={form.order_index}
          onChange={(e) =>
            setForm({ ...form, order_index: Number.parseInt(e.target.value, 10) || 0 })
          }
        />
        {entity === "chapters" && isWordDetection && (
          <TextField
            type="number"
            label="Level"
            value={form.level}
            onChange={(e) =>
              setForm({ ...form, level: Number.parseInt(e.target.value, 10) || 0 })
            }
          />
        )}
      </FormDialog>

      {/* Publish Confirmation */}
      <ConfirmDialog
        open={publishTarget !== null}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublish}
        title="Publish"
        message={`Are you sure you want to publish "${publishTarget?.name_en ?? ""}"?`}
        confirmLabel="Publish"
        loading={busy}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${entityLabel.slice(0, -1)}?`}
        message={`Are you sure you want to delete "${deleteTarget?.name_en ?? ""}"? This can be undone by restoring.`}
        confirmLabel="Delete"
        loading={busy}
      />

      {/* Restore Confirmation */}
      <ConfirmDialog
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title={`Restore ${entityLabel.slice(0, -1)}?`}
        message={`Are you sure you want to restore "${restoreTarget?.name_en ?? ""}"?`}
        confirmLabel="Restore"
        loading={busy}
      />
    </>
  );
}
