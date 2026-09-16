import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Modal } from "../Modal";
import { DataTable } from "../DataTable";
import { Input } from "../../primitives/Input";
import { useDebounce } from "../../hooks/useDebounce";
import { useUiTranslation } from "../../i18n";
import {
  RECORD_SEARCH_DEBOUNCE_MS,
  type PagedRecordSearchFn,
  type PickerItem,
  type RecordSearchColumn,
  type RecordSearchStatus,
} from "./types";

export interface RecordSearchModalProps<T extends { key: string } = PickerItem> {
  open: boolean;
  onClose: () => void;
  /** Consumer fetches. The dialog owns debounce, abort, races and paging. */
  onSearch: PagedRecordSearchFn<T>;
  columns: RecordSearchColumn<T>[];
  onSelect: (item: T) => void;
  title?: string;
  /** Rows per page. Defaults to 20. */
  pageSize?: number;
  /** Seeds the dialog's search box — e.g. the text typed into the picker. */
  initialQuery?: string;
}

/** `"180px"` → 180. Anything that is not a px length sizes automatically. */
function parsePxWidth(width: string | undefined): number | undefined {
  if (!width) return undefined;
  const trimmed = width.trim();
  if (!/^\d+(\.\d+)?(px)?$/.test(trimmed)) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * The dialog behind "Search more…": its own debounced search box, a paginated
 * list and selectable rows. Mounted only while open, so every visit starts
 * from a clean search.
 */
export function RecordSearchModal<T extends { key: string } = PickerItem>({
  open,
  onClose,
  onSearch,
  columns,
  onSelect,
  title,
  pageSize = 20,
  initialQuery,
}: RecordSearchModalProps<T>) {
  const { t } = useUiTranslation("ui");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? t("picker.searchTitle")}
      size="xl"
    >
      <RecordSearchPanel
        onSearch={onSearch}
        columns={columns}
        onSelect={onSelect}
        pageSize={pageSize}
        initialQuery={initialQuery}
      />
    </Modal>
  );
}

function RecordSearchPanel<T extends { key: string }>({
  onSearch,
  columns,
  onSelect,
  pageSize,
  initialQuery,
}: {
  onSearch: PagedRecordSearchFn<T>;
  columns: RecordSearchColumn<T>[];
  onSelect: (item: T) => void;
  pageSize: number;
  initialQuery?: string;
}) {
  const { t } = useUiTranslation("ui");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RecordSearchStatus>("loading");
  const [result, setResult] = useState<{ items: T[]; total: number }>({
    items: [],
    total: 0,
  });

  const requestIdRef = useRef(0);
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const debouncedQuery = useDebounce(query, RECORD_SEARCH_DEBOUNCE_MS);
  const settling = query !== debouncedQuery;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setStatus("loading");

    onSearchRef
      .current(debouncedQuery.trim(), {
        signal: controller.signal,
        page,
        pageSize,
      })
      .then((next) => {
        // An aborted request can still resolve — only the newest one counts.
        if (requestIdRef.current !== requestId) return;
        setResult({ items: next?.items ?? [], total: next?.total ?? 0 });
        setStatus("ready");
      })
      .catch(() => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) return;
        setResult({ items: [], total: 0 });
        setStatus("error");
      });

    return () => controller.abort();
  }, [debouncedQuery, page, pageSize]);

  const tableColumns = useMemo<ColumnDef<T, unknown>[]>(
    () =>
      columns.map((column, index) => ({
        id: `record-search-${index}`,
        header: column.header,
        size: parsePxWidth(column.width),
        cell: ({ row }) =>
          index === 0 ? (
            // The leading column is the row's handle: a real button, so the
            // list is selectable by pointer and by keyboard alike.
            <button
              type="button"
              className="w-full truncate border-0 bg-transparent p-0 text-start text-erp-text hover:underline"
              onClick={() => onSelect(row.original)}
            >
              {column.cell(row.original)}
            </button>
          ) : (
            column.cell(row.original)
          ),
      })),
    [columns, onSelect]
  );

  const busy = settling || status === "loading";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable<T, unknown>
        columns={tableColumns}
        data={result.items}
        getRowId={(row) => row.key}
        manualFiltering
        stickyHeader={false}
        className="min-h-0 flex-1 overflow-auto"
        pagination={{ page, pageSize, total: result.total, onPageChange: setPage }}
        loading={busy && result.items.length === 0}
        fetching={busy && result.items.length > 0}
        error={status === "error" ? t("picker.searchFailed") : null}
        emptyMessage={t("picker.noResults")}
        renderToolbar={({ pagination }) => (
          <div className="flex shrink-0 items-center gap-3 border-b border-erp-border bg-erp-surface-alt px-3 py-2">
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-erp-muted"
              />
              <Input
                autoFocus
                className="w-full ps-7"
                value={query}
                aria-label={t("datatable.searchPlaceholder")}
                placeholder={t("datatable.searchPlaceholder")}
                onChange={(event) => {
                  setQuery(event.target.value);
                  // A new search starts over at the first page.
                  setPage(1);
                }}
              />
            </div>
            {pagination}
          </div>
        )}
      />
    </div>
  );
}
