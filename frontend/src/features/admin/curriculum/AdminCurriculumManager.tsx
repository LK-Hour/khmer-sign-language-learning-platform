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
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/i18n/useTranslation";
import { ApiError } from "@/utils/api/client";

import * as adminApi from "../api/adminApi";
import type {
  AdminChapter,
  AdminEntity,
  AdminLesson,
  AdminUnit,
} from "../api/types";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import type { DataTableColumn } from "../components/shared/DataTable";
import StatusChip from "../components/shared/StatusChip";
import FormDialog from "../components/shared/FormDialog";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { useAdminEntityTab, useAdminTrack } from "../store/adminUi.store";

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

export default function AdminCurriculumManager() {
  const { t, entityActionLabel, quotedConfirmMessage } = useTranslation();

  const [track, setTrack] = useAdminTrack();
  const [tab, setTab] = useAdminEntityTab();

  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number>(0); // 0=All, 1=Draft, 2=Published, 3=Active, 4=Inactive
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
      setError(err instanceof ApiError ? err.message : t("ADMIN.LOAD_FAILED"));
    } finally {
      setLoading(false);
    }
  }, [track, t]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  useEffect(() => {
    void Promise.resolve().then(() => setPage(0));
  }, [track, tab, search, statusFilter]);

  const rows: AdminEntity[] =
    tab === "units" ? units : tab === "chapters" ? chapters : lessons;

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      // Status filter
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

  const entityLabel =
    tab === "units"
      ? t("ADMIN.UNIT")
      : tab === "chapters"
        ? t("ADMIN.CHAPTER")
        : t("ADMIN.LESSON");

  const parentLabel = tab === "chapters" ? t("ADMIN.PARENT_UNIT") : t("ADMIN.PARENT_CHAPTER");
  const parentOptions = tab === "chapters" ? units : chapters;

  const parentName = (row: AdminEntity): string => {
    if (tab === "chapters") {
      const unit = units.find((u) => u.id === (row as AdminChapter).unit_id);
      return unit?.name_en ?? `#${(row as AdminChapter).unit_id}`;
    }
    if (tab === "lessons") {
      const chapter = chapters.find((c) => c.id === (row as AdminLesson).chapter_id);
      return chapter?.name_en ?? `#${(row as AdminLesson).chapter_id}`;
    }
    return "";
  };

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
        tab === "chapters"
          ? (row as AdminChapter).unit_id
          : tab === "lessons"
            ? (row as AdminLesson).chapter_id
            : "",
      level: tab === "chapters" ? ((row as AdminChapter).level ?? 0) : 0,
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
      setError(err instanceof ApiError ? err.message : t("ADMIN.ACTION_FAILED"));
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
      if (tab === "units") {
        return editing
          ? adminApi.updateUnit(track, editing.id, base)
          : adminApi.createUnit(track, base);
      }
      if (tab === "chapters") {
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

    const ok = await runAction(save, t("ADMIN.SAVED_AS_DRAFT_NOTE"));
    if (ok) setFormOpen(false);
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    const id = publishTarget.id;
    const publish = () =>
      tab === "units"
        ? adminApi.publishUnit(track, id)
        : tab === "chapters"
          ? adminApi.publishChapter(track, id)
          : adminApi.publishLesson(track, id);
    const ok = await runAction(publish, t("ADMIN.PUBLISH_SUCCESS"));
    if (ok) setPublishTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const remove = () =>
      tab === "units"
        ? adminApi.deleteUnit(track, id)
        : tab === "chapters"
          ? adminApi.deleteChapter(track, id)
          : adminApi.deleteLesson(track, id);
    const ok = await runAction(remove, t("ADMIN.DELETE_SUCCESS"));
    if (ok) setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const id = restoreTarget.id;
    const restore = () =>
      tab === "units"
        ? adminApi.restoreUnit(track, id)
        : tab === "chapters"
          ? adminApi.restoreChapter(track, id)
          : adminApi.restoreLesson(track, id);
    const ok = await runAction(restore, t("ADMIN.RESTORE_SUCCESS"));
    if (ok) setRestoreTarget(null);
  };

  // DataTable columns
  const columns: DataTableColumn<AdminEntity>[] = useMemo(() => {
    const cols: DataTableColumn<AdminEntity>[] = [
      {
        id: "name_en",
        label: t("ADMIN.NAME"),
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
    ];

    if (tab !== "units") {
      cols.push({
        id: "parent",
        label: parentLabel,
        render: (row) => (
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            {parentName(row)}
          </Typography>
        ),
      });
    }

    if (tab === "chapters" && isWordDetection) {
      cols.push({
        id: "level",
        label: t("ADMIN.LEVEL"),
        render: (row) => (row as AdminChapter).level ?? 0,
      });
    }

    cols.push({
      id: "status",
      label: t("ADMIN.STATUS"),
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <StatusChip variant={row.is_active ? "active" : "inactive"} />
          <StatusChip variant={row.publish_status === "published" ? "published" : "draft"} />
        </Stack>
      ),
    });

    cols.push({
      id: "actions",
      label: t("ADMIN.ACTIONS"),
      sortable: false,
      width: 140,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("BUTTON.EDIT")}>
            <IconButton size="small" onClick={() => openEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.is_active && row.publish_status === "draft" && (
            <Tooltip title={t("ADMIN.PUBLISH")}>
              <IconButton size="small" color="success" onClick={() => setPublishTarget(row)}>
                <Publish fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.is_active ? (
            <Tooltip title={t("BUTTON.DELETE")}>
              <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t("ADMIN.RESTORE")}>
              <IconButton size="small" color="success" onClick={() => setRestoreTarget(row)}>
                <RestoreFromTrash fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    });

    return cols;
  }, [tab, parentLabel, isWordDetection, t]);

  const filterTabs = [
    { label: t("ADMIN.FILTER_ALL"), count: rows.length },
    { label: t("ADMIN.DRAFT") },
    { label: t("ADMIN.PUBLISHED") },
    { label: t("ADMIN.ACTIVE") },
    { label: t("ADMIN.INACTIVE") },
  ];

  return (
    <>
      <PageHeader
        title={t("ADMIN.CURRICULUM_MANAGEMENT")}
        subtitle={`${t("ADMIN.MANAGEMENT")} / ${t("ADMIN.CURRICULUM")}`}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            {entityActionLabel("ADMIN.ADD", entityLabel)}
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

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={track}
            onChange={(_, value) => value && setTrack(value)}
          >
            <ToggleButton value="finger" sx={{ fontWeight: 700 }}>
              {t("ADMIN.TRACK_FINGER")}
            </ToggleButton>
            <ToggleButton value="word_detection" sx={{ fontWeight: 700 }}>
              {t("ADMIN.TRACK_WORD_DETECTION")}
            </ToggleButton>
          </ToggleButtonGroup>

          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab value="units" label={t("ADMIN.UNITS")} />
            <Tab value="chapters" label={t("ADMIN.CHAPTERS")} />
            <Tab value="lessons" label={t("ADMIN.LESSONS")} />
          </Tabs>
        </Stack>

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
        title={
          editing
            ? entityActionLabel("BUTTON.EDIT", entityLabel)
            : entityActionLabel("ADMIN.ADD", entityLabel)
        }
        subtitle={t("ADMIN.DRAFT_WORKFLOW_NOTE")}
        onSubmit={handleSave}
        loading={busy}
        submitLabel={t("ADMIN.SAVE_DRAFT")}
        cancelLabel={t("BUTTON.CANCEL")}
      >
        {tab !== "units" && (
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
          label={t("ADMIN.NAME_EN")}
          value={form.name_en}
          onChange={(e) => setForm({ ...form, name_en: e.target.value })}
        />
        <TextField
          required
          fullWidth
          label={t("ADMIN.NAME_KH")}
          value={form.name_kh}
          onChange={(e) => setForm({ ...form, name_kh: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label={t("ADMIN.DESCRIPTION_EN")}
          value={form.description_en}
          onChange={(e) => setForm({ ...form, description_en: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label={t("ADMIN.DESCRIPTION_KH")}
          value={form.description_kh}
          onChange={(e) => setForm({ ...form, description_kh: e.target.value })}
        />
        <TextField
          type="number"
          label={t("ADMIN.SORT_ORDER")}
          value={form.order_index}
          onChange={(e) =>
            setForm({ ...form, order_index: Number.parseInt(e.target.value, 10) || 0 })
          }
        />
        {tab === "chapters" && isWordDetection && (
          <TextField
            type="number"
            label={t("ADMIN.LEVEL")}
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
        title={t("ADMIN.PUBLISH")}
        message={quotedConfirmMessage(
          publishTarget?.name_en ?? "",
          "ADMIN.DELETE_CONFIRM_SUFFIX",
        )}
        confirmLabel={t("ADMIN.PUBLISH")}
        loading={busy}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`${entityActionLabel("BUTTON.DELETE", entityLabel)}?`}
        message={quotedConfirmMessage(
          deleteTarget?.name_en ?? "",
          "ADMIN.DELETE_CONFIRM_SUFFIX",
        )}
        confirmLabel={t("BUTTON.DELETE")}
        loading={busy}
      />

      {/* Restore Confirmation */}
      <ConfirmDialog
        open={restoreTarget !== null}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title={`${entityActionLabel("ADMIN.RESTORE", entityLabel)}?`}
        message={quotedConfirmMessage(
          restoreTarget?.name_en ?? "",
          "ADMIN.RESTORE_CONFIRM_SUFFIX",
        )}
        confirmLabel={t("ADMIN.RESTORE")}
        loading={busy}
      />
    </>
  );
}
