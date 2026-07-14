"use client";

import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  Checkbox,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import SearchInput from "./SearchInput";
import FilterTabs from "./FilterTabs";
import Scrollbar from "./Scrollbar";

export interface DataTableColumn<T> {
  id: string;
  label: string;
  width?: number | string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (ids: number[]) => void;
  pagination?: { page: number; rowsPerPage: number; total: number };
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rpp: number) => void;
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterTabs?: Array<{ label: string; count?: number }>;
  activeFilterIndex?: number;
  onFilterChange?: (index: number) => void;
  sx?: SxProps<Theme>;
}

export default function DataTable<T extends { id: number }>({
  columns,
  rows,
  loading = false,
  selectable = false,
  onSelectionChange,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  searchValue,
  onSearchChange,
  filterTabs,
  activeFilterIndex = 0,
  onFilterChange,
  sx,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selected, setSelected] = useState<number[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // ── Column resize state ──────────────────────────────────────────────────
  // Widths are tracked in a ref during drag (mutated directly via colgroup <col>
  // elements for a jank-free live preview) and only committed to React state
  // once, on mouseup. This avoids re-rendering the whole table on every pixel
  // of mouse movement, which is what caused the visible "glitch"/stutter.
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const colRefs = useRef<Record<string, HTMLTableColElement | null>>({});
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleResizeStart = useCallback(
    (colId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const th = (e.currentTarget as HTMLElement).closest("th");
      const startWidth = th?.offsetWidth ?? 100;
      resizingRef.current = { colId, startX: e.clientX, startWidth };

      // Prevent text selection and show resize cursor for the whole page
      // while dragging — without this, fast mouse movement selects header
      // text and rows, which reads as visual "glitching".
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const applyWidth = (width: number) => {
        const col = colRefs.current[colId];
        if (col) col.style.width = `${width}px`;
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const diff = moveEvent.clientX - resizingRef.current.startX;
        const newWidth = Math.max(40, resizingRef.current.startWidth + diff);

        // Batch DOM writes to one per animation frame instead of one per
        // mousemove event (mousemove can fire far faster than paint rate).
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => applyWidth(newWidth));
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (resizingRef.current) {
          const diff = upEvent.clientX - resizingRef.current.startX;
          const finalWidth = Math.max(40, resizingRef.current.startWidth + diff);
          // Commit the final width to React state exactly once.
          setColumnWidths((prev) => ({ ...prev, [colId]: finalWidth }));
        }
        resizingRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [],
  );

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? rows.map((row) => row.id) : [];
    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleSelectRow = (id: number) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleSort = (columnId: string) => {
    const newDirection =
      sortColumn === columnId && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(columnId);
    setSortDirection(newDirection);
    onSort?.(columnId, newDirection);
  };

  // ── Client-side sorting ────────────────────────────────────────────────────
  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows;
    return [...rows].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortColumn];
      const bVal = (b as Record<string, unknown>)[sortColumn];

      // Handle nulls
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? -1 : 1;
      if (bVal == null) return sortDirection === "asc" ? 1 : -1;

      // String comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Numeric comparison
      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }

      return 0;
    });
  }, [rows, sortColumn, sortDirection]);

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    onPageChange?.(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
  };

  const showToolbar =
    (searchValue !== undefined && onSearchChange) ||
    (filterTabs && filterTabs.length > 0);

  const skeletonRowCount = pagination?.rowsPerPage ?? 5;

  // Sticky first column styles for mobile
  const stickyFirstColumnSx: SxProps<Theme> = isMobile
    ? {
        position: "sticky",
        left: 0,
        zIndex: 1,
        bgcolor: "background.paper",
      }
    : {};

  return (
    <Card sx={sx}>
      {/* Toolbar */}
      {showToolbar && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ px: 2, py: 2.5, alignItems: { sm: "center" } }}
        >
          {searchValue !== undefined && onSearchChange && (
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              sx={{ width: { xs: "100%", sm: 260 } }}
            />
          )}
          {filterTabs && filterTabs.length > 0 && onFilterChange && (
            <FilterTabs
              tabs={filterTabs}
              activeIndex={activeFilterIndex}
              onChange={onFilterChange}
            />
          )}
        </Stack>
      )}

      {/* Table */}
      <TableContainer component={Scrollbar}>
        <Table sx={{ minWidth: 860, tableLayout: "fixed" }}>
          <colgroup>
            {selectable && <col style={{ width: 48 }} />}
            {columns.map((col) => (
              <col
                key={col.id}
                ref={(el) => {
                  colRefs.current[col.id] = el;
                }}
                style={{ width: columnWidths[col.id] ?? col.width }}
              />
            ))}
          </colgroup>
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-head": {
                  position: "sticky",
                  top: 0,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "text.secondary",
                  backgroundColor: "background.neutral",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                },
              }}
            >
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{ ...stickyFirstColumnSx, width: 48 }}
                >
                  <Checkbox
                    indeterminate={
                      selected.length > 0 && selected.length < rows.length
                    }
                    checked={
                      rows.length > 0 && selected.length === rows.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    size="small"
                  />
                </TableCell>
              )}
              {columns.map((col, colIndex) => {
                const isSortable = col.sortable !== false;
                const isActive = sortColumn === col.id;

                return (
                  <TableCell
                    key={col.id}
                    sx={{
                      position: "relative",
                      userSelect: "none",
                      ...(colIndex === 0 && !selectable
                        ? stickyFirstColumnSx
                        : {}),
                    }}
                  >
                    {isSortable ? (
                      <Box
                        onClick={() => handleSort(col.id)}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          cursor: "pointer",
                          "&:hover": { color: "text.primary" },
                        }}
                      >
                        {col.label}
                        {isActive ? (
                          sortDirection === "asc" ? (
                            <KeyboardArrowUpRoundedIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
                          )
                        ) : (
                          <UnfoldMoreRoundedIcon sx={{ fontSize: 16, opacity: 0.4 }} />
                        )}
                      </Box>
                    ) : (
                      col.label
                    )}

                    {/* Resize handle */}
                    <Box
                      onMouseDown={(e) => handleResizeStart(col.id, e)}
                      sx={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        cursor: "col-resize",
                        "&:hover": { bgcolor: "primary.main", opacity: 0.3 },
                      }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading
              ? Array.from({ length: skeletonRowCount }).map((_, rowIdx) => (
                  <TableRow key={`skeleton-${rowIdx}`}>
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Skeleton variant="rectangular" width={18} height={18} />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton variant="text" width="80%" height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : sortedRows.map((row) => {
                  const isSelected = selected.includes(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      selected={isSelected}
                      sx={{
                        "& .MuiTableCell-body": {
                          fontSize: "0.875rem",
                          borderBottomStyle: "dashed",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                        "&:hover": {
                          bgcolor: "rgba(145, 158, 171, 0.08)",
                        },
                        "&.Mui-selected": {
                          bgcolor: "rgba(12, 68, 174, 0.04)",
                        },
                      }}
                    >
                      {selectable && (
                        <TableCell
                          padding="checkbox"
                          sx={stickyFirstColumnSx}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectRow(row.id)}
                            size="small"
                          />
                        </TableCell>
                      )}
                      {columns.map((col, colIndex) => (
                        <TableCell
                          key={col.id}
                          sx={
                            colIndex === 0 && !selectable
                              ? stickyFirstColumnSx
                              : undefined
                          }
                        >
                          {col.render
                            ? col.render(row)
                            : (row as Record<string, unknown>)[col.id] as ReactNode}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && (
        <Box sx={{ borderTop: (t) => `1px dashed ${t.palette.divider}` }}>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            rowsPerPage={pagination.rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      )}
    </Card>
  );
}
