"use client";

import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Layers from "@mui/icons-material/Layers";
import Publish from "@mui/icons-material/Publish";
import RestoreFromTrash from "@mui/icons-material/RestoreFromTrash";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageHeader,
  AdminTableFooter,
} from "../components/AdminTablePage";
import { ConfirmActionDialog, PublishConfirmDialog } from "../components/ConfirmDialogs";
import { ActiveChip, PublishChip } from "../components/StatusChips";
import { AdminColors, AdminFontSizes, adminTableHeaderSx } from "../components/adminTokens";
import { useAdminEntityTab, useAdminTrack } from "../store/adminUi.store";
import { KslColors, KslRadii } from "@/theme/theme";

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
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
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
  }, [track, tab, search, statusFilter, activeFilter]);

  const rows: AdminEntity[] =
    tab === "units" ? units : tab === "chapters" ? chapters : lessons;

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.publish_status !== statusFilter) return false;
      if (activeFilter === "active" && !row.is_active) return false;
      if (activeFilter === "inactive" && row.is_active) return false;
      if (
        needle &&
        !row.name_en.toLowerCase().includes(needle) &&
        !row.name_kh.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, search, statusFilter, activeFilter]);

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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
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

  return (
    <>
      <AdminPageHeader
        eyebrow={`${t("ADMIN.MANAGEMENT")} / ${t("ADMIN.CURRICULUM")}`}
        title={t("ADMIN.CURRICULUM_MANAGEMENT")}
        icon={<Layers sx={{ fontSize: 24, color: AdminColors.primary }} />}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{borderRadius: KslRadii.showCard}}>
            {entityActionLabel("ADMIN.ADD", entityLabel)}
          </Button>
        }
      />

      <Stack sx={{ flex: 1, overflow: "auto", p: { xs: 2, md: 3 } }} spacing={2}>
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
            <ToggleButton value="finger" sx={{ fontSize: AdminFontSizes.small, fontWeight: 700, borderRadius: KslRadii.showCard}}>
              {t("ADMIN.TRACK_FINGER")}
            </ToggleButton>
            <ToggleButton
              value="word_detection"
              sx={{ fontSize: AdminFontSizes.small, fontWeight: 700, borderRadius: KslRadii.showCard }}
            >
              {t("ADMIN.TRACK_WORD_DETECTION")}
            </ToggleButton>
          </ToggleButtonGroup>

          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab value="units" label={t("ADMIN.UNITS")} />
            <Tab value="chapters" label={t("ADMIN.CHAPTERS")} />
            <Tab value="lessons" label={t("ADMIN.LESSONS")} />
          </Tabs>
        </Stack>

        <AdminFilterBar search={search} onSearchChange={setSearch}>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            label={t("ADMIN.FILTER_STATUS")}
            sx={{ minWidth: 160, bgcolor: "background.paper" }}
          >
            <MenuItem value="all">{t("ADMIN.FILTER_ALL")}</MenuItem>
            <MenuItem value="draft">{t("ADMIN.DRAFT")}</MenuItem>
            <MenuItem value="published">{t("ADMIN.PUBLISHED")}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
            label={t("ADMIN.FILTER_ACTIVE")}
            sx={{ minWidth: 160, bgcolor: "background.paper" }}
          >
            <MenuItem value="all">{t("ADMIN.FILTER_ALL")}</MenuItem>
            <MenuItem value="active">{t("ADMIN.ACTIVE")}</MenuItem>
            <MenuItem value="inactive">{t("ADMIN.INACTIVE")}</MenuItem>
          </TextField>
        </AdminFilterBar>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: AdminColors.page }}>
                <TableCell align="center" sx={{ width: 64, ...adminTableHeaderSx }}>
                  {t("ADMIN.ORDER")}
                </TableCell>
                <TableCell sx={adminTableHeaderSx}>{t("ADMIN.NAME")}</TableCell>
                {tab !== "units" && (
                  <TableCell sx={adminTableHeaderSx}>{parentLabel}</TableCell>
                )}
                {tab === "chapters" && isWordDetection && (
                  <TableCell sx={adminTableHeaderSx}>{t("ADMIN.LEVEL")}</TableCell>
                )}
                <TableCell sx={adminTableHeaderSx}>{t("ADMIN.STATUS")}</TableCell>
                <TableCell align="right" sx={adminTableHeaderSx}>
                  {t("ADMIN.ACTIONS")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && pagedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <AdminEmptyState message={t("ADMIN.NO_RECORDS")} />
                  </TableCell>
                </TableRow>
              )}
              {pagedRows.map((row) => (
                <TableRow key={row.id} hover sx={{ opacity: row.is_active ? 1 : 0.55 }}>
                  <TableCell
                    align="center"
                    sx={{
                      fontFamily: "var(--font-app-mono)",
                      fontSize: AdminFontSizes.small,
                      color: AdminColors.sidebarMuted,
                    }}
                  >
                    {row.order_index}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontSize: AdminFontSizes.body,
                        fontWeight: 700,
                        color: AdminColors.heading,
                      }}
                    >
                      {row.name_en}
                    </Typography>
                    <Typography
                      sx={{ mt: 0.5, fontSize: AdminFontSizes.small, color: AdminColors.muted }}
                    >
                      {row.name_kh}
                    </Typography>
                  </TableCell>
                  {tab !== "units" && (
                    <TableCell sx={{ fontSize: AdminFontSizes.small, color: AdminColors.muted }}>
                      {parentName(row)}
                    </TableCell>
                  )}
                  {tab === "chapters" && isWordDetection && (
                    <TableCell sx={{ fontSize: AdminFontSizes.small, color: AdminColors.muted }}>
                      {(row as AdminChapter).level ?? 0}
                    </TableCell>
                  )}
                  <TableCell>
                    <Stack direction="row" spacing={0.75}>
                      <ActiveChip active={row.is_active} />
                      <PublishChip status={row.publish_status} />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t("BUTTON.EDIT")}>
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {row.is_active && row.publish_status === "draft" && (
                      <Tooltip title={t("ADMIN.PUBLISH")}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setPublishTarget(row)}
                        >
                          <Publish fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {row.is_active ? (
                      <Tooltip title={t("BUTTON.DELETE")}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={t("ADMIN.RESTORE")}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setRestoreTarget(row)}
                        >
                          <RestoreFromTrash fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTableFooter
            count={filteredRows.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(0);
            }}
          />
        </TableContainer>
      </Stack>

      {/* Create / edit form — saves as draft until published */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing
            ? entityActionLabel("BUTTON.EDIT", entityLabel)
            : entityActionLabel("ADMIN.ADD", entityLabel)}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: AdminColors.page }}>
          <Stack id="curriculumForm" component="form" onSubmit={handleSave} spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ fontSize: AdminFontSizes.small }}>
              {t("ADMIN.DRAFT_WORKFLOW_NOTE")}
            </Alert>
            {tab !== "units" && (
              <TextField
                select
                required
                fullWidth
                label={parentLabel}
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: Number(e.target.value) })}
              >
                {parentOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name_en} · {option.name_kh}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                type="number"
                label={t("ADMIN.SORT_ORDER")}
                value={form.order_index}
                onChange={(e) =>
                  setForm({ ...form, order_index: Number.parseInt(e.target.value, 10) || 0 })
                }
                sx={{ width: 140 }}
              />
              {tab === "chapters" && isWordDetection && (
                <TextField
                  type="number"
                  label={t("ADMIN.LEVEL")}
                  value={form.level}
                  onChange={(e) =>
                    setForm({ ...form, level: Number.parseInt(e.target.value, 10) || 0 })
                  }
                  sx={{ width: 140 }}
                />
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setFormOpen(false)} disabled={busy} sx={{color:KslColors.muted ,borderRadius: KslRadii.showCard}}>
            {t("BUTTON.CANCEL")}
          </Button>
          <Button type="submit" form="curriculumForm" variant="contained" disabled={busy} sx={{borderRadius: KslRadii.showCard}}>
            {t("ADMIN.SAVE_DRAFT")}
          </Button>
        </DialogActions>
      </Dialog>

      <PublishConfirmDialog
        open={publishTarget !== null}
        entityLabel={entityLabel}
        nameEn={publishTarget?.name_en ?? ""}
        nameKh={publishTarget?.name_kh}
        isActive={publishTarget?.is_active ?? true}
        busy={busy}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublish}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        title={`${entityActionLabel("BUTTON.DELETE", entityLabel)}?`}
        message={quotedConfirmMessage(
          deleteTarget?.name_en ?? "",
          "ADMIN.DELETE_CONFIRM_SUFFIX",
        )}
        confirmLabel={t("BUTTON.DELETE")}
        confirmColor="error"
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmActionDialog
        open={restoreTarget !== null}
        title={`${entityActionLabel("ADMIN.RESTORE", entityLabel)}?`}
        message={quotedConfirmMessage(
          restoreTarget?.name_en ?? "",
          "ADMIN.RESTORE_CONFIRM_SUFFIX",
        )}
        confirmLabel={t("ADMIN.RESTORE")}
        confirmColor="success"
        busy={busy}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
      />
    </>
  );
}
