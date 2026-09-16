import type { ReactNode } from "react";

/**
 * One row in a record picker. `@erp/ui` knows nothing about what the record
 * is — the consumer maps its own entity onto this shape and gets `meta` back
 * untouched when a row is chosen.
 */
export type PickerItem = {
  key: string;
  label: string;
  /** Muted text beside the label — a code, a city, an email… */
  secondary?: string;
  /** Opaque payload handed back on select. */
  meta?: unknown;
};

/** A column in the Search more… dialog. */
export type RecordSearchColumn<T> = {
  header: string;
  cell: (item: T) => ReactNode;
  /**
   * Column width as a px length (`"180px"` or `"180"`). Other units are
   * ignored: the table grid sizes its columns in px.
   */
  width?: string;
};

/** What a search call resolves to. `total` drives Search more… and paging. */
export type RecordSearchResult<T> = { items: T[]; total: number };

/**
 * Search callback. The consumer fetches; the UI owns debounce, abort and the
 * race guard. `page` / `pageSize` are only passed by the paginated
 * Search more… dialog — the inline list omits them.
 */
export type RecordSearchFn<T> = (
  query: string,
  opts: { signal: AbortSignal; page?: number; pageSize?: number }
) => Promise<RecordSearchResult<T>>;

/** The same callback as seen by the paginated dialog, where a page is always sent. */
export type PagedRecordSearchFn<T> = (
  query: string,
  opts: { signal: AbortSignal; page: number; pageSize: number }
) => Promise<RecordSearchResult<T>>;

/** Debounce applied to every search box in this folder. */
export const RECORD_SEARCH_DEBOUNCE_MS = 250;

export type RecordSearchStatus = "idle" | "loading" | "ready" | "error";
