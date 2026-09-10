import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Search,
  Star,
  X,
} from "lucide-react";
import { cn } from "../../utils";
import { useUiTranslation } from "../../i18n";

export type SearchFilterChipKind = "filter" | "group";

export type SearchFilterChip = {
  id: string;
  /** Single-value fallback when `values` is omitted. */
  label: string;
  /** Facet values — joined with `separator` / “or” (filter) or “>” (group). */
  values?: string[];
  /** Optional field label shown before values (Odoo: “Create Date: …”). */
  prefix?: string;
  /**
   * Join between values. Defaults: filter → translated “or”, group → “>”.
   * Date multi-selects typically pass `"/"`.
   */
  separator?: string;
  kind?: SearchFilterChipKind;
  onRemove: () => void;
};

export type SearchFilterItem = {
  id: string;
  label: string;
  checked?: boolean;
  active?: boolean;
  onSelect?: () => void;
  dividerBefore?: boolean;
  disabled?: boolean;
  /** Nested tree (Odoo Create Date / Order Date). */
  children?: SearchFilterItem[];
  /** Start expanded when the panel opens. Default false. */
  defaultExpanded?: boolean;
  /**
   * When false, the row is expand-only (caret + label), not a checkbox.
   * Defaults to true when `onSelect` is set, else false when only children.
   */
  selectable?: boolean;
  /** Extra UI under the row (e.g. Custom Range From–To). */
  extra?: ReactNode;
};

export interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  chips?: SearchFilterChip[];
  filters?: SearchFilterItem[];
  groupBy?: SearchFilterItem[];
  favorites?: SearchFilterItem[];
  panelOpen?: boolean;
  defaultPanelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  /** Columns control rendered beside the search shell. */
  columnsSlot?: ReactNode;
  /** Compact pager (or other control) at the end of the search row. */
  endSlot?: ReactNode;
  /** When false, hides the Filters / Group By / Favorites panel toggle. Default true. */
  showPanel?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

function isItemSelectable(item: SearchFilterItem): boolean {
  if (item.selectable != null) return item.selectable;
  if (item.children && item.children.length > 0 && !item.onSelect) return false;
  return Boolean(item.onSelect);
}

/**
 * Odoo search panel row: check gutter | label | caret (parents, end).
 * Selected = checkmark only; background only on hover.
 */
function PanelItemRow({ item, depth }: { item: SearchFilterItem; depth: number }) {
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const [expanded, setExpanded] = useState(
    () => Boolean(item.defaultExpanded) || Boolean(item.extra)
  );
  const selectable = isItemSelectable(item);
  const checked = Boolean(item.checked || item.active);

  useEffect(() => {
    if (item.extra) setExpanded(true);
  }, [item.extra]);

  return (
    <li role="none" className="relative">
      {item.dividerBefore ? (
        <div className="my-1 border-t border-erp-table-border" role="separator" />
      ) : null}
      <div className="flex min-w-0 items-center hover:bg-erp-menu-hover">
        <button
          type="button"
          role={selectable ? "menuitemcheckbox" : "menuitem"}
          aria-checked={selectable || checked ? checked : undefined}
          aria-expanded={hasChildren ? expanded : undefined}
          disabled={item.disabled}
          onClick={() => {
            if (selectable && item.onSelect) {
              item.onSelect();
              return;
            }
            if (hasChildren) setExpanded((prev) => !prev);
          }}
          className={cn(
            "relative flex min-w-0 flex-1 items-center border-0 bg-transparent py-0.5 text-start text-[12px] leading-snug text-erp-text",
            item.disabled && "cursor-not-allowed text-erp-muted",
            "ps-2",
            hasChildren ? "pe-0" : "pe-2"
          )}
        >
          <span
            className="relative me-1.5 grid h-4 w-3.5 shrink-0 place-items-center"
            aria-hidden
          >
            {checked ? (
              <Check className="h-2.5 w-2.5 text-erp-primary" strokeWidth={3} />
            ) : null}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              depth === 0 && hasChildren && "font-medium"
            )}
          >
            {item.label}
          </span>
        </button>
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
            className="grid h-6 w-5 shrink-0 place-items-center border-0 bg-transparent p-0 text-erp-text"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      {expanded && item.extra ? (
        <div
          className="pb-1.5 pt-0.5 ps-8"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {item.extra}
        </div>
      ) : null}
      {expanded && hasChildren ? (
        <ul
          className="relative m-0 ms-[1.125rem] list-none border-s border-erp-table-border py-0.5 ps-0"
          role="none"
        >
          {item.children!.map((child) => (
            <PanelItemRow key={child.id} item={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function PanelColumn({
  title,
  icon,
  items,
  emptyLabel,
  showEndBorder,
}: {
  title: string;
  icon: ReactNode;
  items: SearchFilterItem[];
  emptyLabel?: string;
  showEndBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-52 shrink-0 px-2",
        showEndBorder &&
          "max-lg:mb-2 max-lg:border-b max-lg:border-erp-table-border max-lg:pb-2 lg:border-e lg:border-erp-table-border"
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5 px-2 text-[13px] font-medium text-erp-text">
        {icon}
        <h5 className="m-0 inline text-[13px] font-medium">{title}</h5>
      </div>
      <ul className="m-0 list-none p-0" role="none">
        {items.length === 0 ? (
          <li className="px-3 py-0.5 text-[12px] text-erp-muted">{emptyLabel}</li>
        ) : (
          items.map((item) => <PanelItemRow key={item.id} item={item} depth={0} />)
        )}
      </ul>
    </div>
  );
}

function SearchFacet({
  chip,
  disabled,
  orLabel,
  removeLabel,
}: {
  chip: SearchFilterChip;
  disabled?: boolean;
  orLabel: string;
  removeLabel: string;
}) {
  const kind = chip.kind ?? "filter";
  const values = chip.values && chip.values.length > 0 ? chip.values : [chip.label];
  const separator = chip.separator ?? (kind === "group" ? ">" : orLabel);
  const titleValues = values.join(` ${separator} `);
  const title = chip.prefix ? `${chip.prefix}: ${titleValues}` : titleValues;

  return (
    <div
      role="listitem"
      className="group/facet relative inline-flex max-w-full items-stretch rounded-md bg-erp-secondary"
    >
      <div className="pointer-events-none absolute inset-0 rounded-md border border-erp-table-border bg-erp-table-bg opacity-0 shadow-sm group-hover/facet:opacity-100" />
      <span
        className={cn(
          "relative z-[1] grid shrink-0 place-items-center self-stretch rounded-s-md px-1",
          kind === "group"
            ? "bg-erp-teal text-white"
            : "bg-erp-primary text-erp-primary-foreground"
        )}
        aria-hidden
      >
        {kind === "group" ? (
          <Layers className="h-3 w-3" />
        ) : (
          <Filter className="h-3 w-3" />
        )}
      </span>
      <div className="relative z-[1] flex min-w-0 flex-wrap items-center ps-2">
        {chip.prefix ? (
          <small className="me-0.5 max-w-[8rem] truncate text-[12px] leading-none text-erp-text">
            {chip.prefix}:
          </small>
        ) : null}
        {values.map((value, index) => (
          <span key={`${chip.id}:${value}:${index}`} className="contents">
            {index > 0 ? (
              <em className="mx-1 text-[12px] font-bold opacity-50">{separator}</em>
            ) : null}
            <small
              className="max-w-[11rem] truncate text-[12px] leading-none text-erp-text"
              title={value}
            >
              {value}
            </small>
          </span>
        ))}
        <button
          type="button"
          disabled={disabled}
          aria-label={`${removeLabel}: ${title}`}
          title={removeLabel}
          className="px-2 py-0 text-erp-danger hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={chip.onRemove}
        >
          <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export const SearchFilter = forwardRef<HTMLInputElement, SearchFilterProps>(
  function SearchFilter(
    {
      value,
      onChange,
      placeholder,
      chips = [],
      filters = [],
      groupBy = [],
      favorites,
      panelOpen: controlledOpen,
      defaultPanelOpen = false,
      onPanelOpenChange,
      columnsSlot,
      endSlot,
      showPanel = true,
      disabled = false,
      readOnly = false,
      className,
    },
    ref
  ) {
    const { t } = useUiTranslation("ui");
    const panelId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const shellRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultPanelOpen);
    const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
    const isControlled = controlledOpen !== undefined;
    const open = showPanel && (isControlled ? controlledOpen : uncontrolledOpen);
    const searchPlaceholder = placeholder ?? t("searchFilter.search");

    function setOpen(next: boolean) {
      if (!showPanel) return;
      if (!isControlled) setUncontrolledOpen(next);
      onPanelOpenChange?.(next);
    }

    function assignInputRef(node: HTMLInputElement | null) {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }

    const favoriteItems =
      favorites ??
      ([
        {
          id: "save-current",
          label: t("searchFilter.saveCurrentSearch"),
          disabled: true,
        },
      ] satisfies SearchFilterItem[]);

    useLayoutEffect(() => {
      if (!open || !showPanel) {
        setPanelPos(null);
        return;
      }
      const shell = shellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
      });
    }, [open, showPanel, chips.length, value]);

    useEffect(() => {
      if (!open || !showPanel) return;

      function onPointerDown(event: MouseEvent) {
        const target = event.target as Node;
        if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
          return;
        }
        if (!isControlled) setUncontrolledOpen(false);
        onPanelOpenChange?.(false);
      }

      function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          if (!isControlled) setUncontrolledOpen(false);
          onPanelOpenChange?.(false);
        }
      }

      function onReposition() {
        const shell = shellRef.current;
        if (!shell) return;
        const rect = shell.getBoundingClientRect();
        setPanelPos({
          top: rect.bottom + 6,
          left: rect.left + rect.width / 2,
        });
      }

      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("resize", onReposition);
      window.addEventListener("scroll", onReposition, true);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("resize", onReposition);
        window.removeEventListener("scroll", onReposition, true);
      };
    }, [open, showPanel, isControlled, onPanelOpenChange]);

    const hasSideSlots = Boolean(columnsSlot || endSlot);
    const panel =
      open && panelPos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={panelId}
              role="menu"
              aria-label={t("searchFilter.filters")}
              className={cn(
                "fixed z-[1070] flex w-max flex-row flex-nowrap overflow-auto py-2.5",
                "rounded border border-erp-table-border bg-erp-table-bg text-[12px] text-erp-text",
                "shadow-[0_0.3rem_1rem_rgba(0,0,0,0.1)]"
              )}
              style={{
                top: panelPos.top,
                left: panelPos.left,
                transform: "translateX(-50%)",
                maxHeight: "min(50vh, 24rem)",
              }}
            >
              <PanelColumn
                title={t("searchFilter.filters")}
                icon={<Filter className="h-3.5 w-3.5 text-erp-primary" aria-hidden />}
                items={filters}
                emptyLabel={t("searchFilter.noFilters")}
                showEndBorder
              />
              <PanelColumn
                title={t("searchFilter.groupBy")}
                icon={<Layers className="h-3.5 w-3.5 text-erp-teal" aria-hidden />}
                items={groupBy}
                emptyLabel={t("searchFilter.noGroupings")}
                showEndBorder
              />
              <PanelColumn
                title={t("searchFilter.favorites")}
                icon={<Star className="h-3.5 w-3.5 text-erp-favourite" aria-hidden />}
                items={favoriteItems}
                emptyLabel={t("searchFilter.noFavorites")}
              />
            </div>,
            document.body
          )
        : null;

    return (
      <div
        ref={rootRef}
        className={cn(
          "relative w-full min-w-0",
          hasSideSlots &&
            "grid grid-cols-[minmax(0,1fr)_minmax(0,28rem)_minmax(0,1fr)] items-center gap-3",
          className
        )}
      >
        {hasSideSlots ? <div /> : null}
        <div ref={shellRef} className="relative w-full min-w-0 max-w-md mx-auto">
          <div className="flex w-full max-w-full items-stretch">
            <div
              className={cn(
                "flex min-w-0 flex-1 items-stretch",
                disabled && "cursor-not-allowed opacity-60"
              )}
              role="search"
            >
              <div
                className={cn(
                  "flex min-h-8 min-w-0 flex-1 items-center rounded-s border border-erp-table-border bg-erp-table-bg py-0.5 ps-2 pe-1",
                  showPanel ? "border-e-0" : "rounded-e",
                  open && "border-erp-brand-third"
                )}
              >
                <button
                  type="button"
                  className="me-2 shrink-0 border-0 bg-transparent p-0 text-erp-muted"
                  aria-label={searchPlaceholder}
                  title={searchPlaceholder}
                  disabled={disabled}
                  onClick={() => {
                    inputRef.current?.focus();
                    if (!disabled && !readOnly) setOpen(true);
                  }}
                >
                  <Search className="h-3.5 w-3.5" aria-hidden />
                </button>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                  {chips.map((chip) => (
                    <SearchFacet
                      key={chip.id}
                      chip={chip}
                      disabled={disabled}
                      orLabel={t("searchFilter.or")}
                      removeLabel={t("searchFilter.remove")}
                    />
                  ))}
                  <input
                    ref={assignInputRef}
                    value={value}
                    disabled={disabled}
                    readOnly={readOnly}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className={cn(
                      "h-6 min-w-[5rem] flex-1 border-0 bg-transparent px-0.5 text-[13px] text-erp-text",
                      "placeholder:text-erp-placeholder",
                      "outline-none ring-0 focus:outline-none focus:ring-0",
                      "disabled:cursor-not-allowed"
                    )}
                    onFocus={() => {
                      if (!disabled && !readOnly) setOpen(true);
                    }}
                    onChange={(event) => {
                      const next = event.target.value;
                      onChange(next);
                      if (!disabled && !readOnly) setOpen(true);
                    }}
                  />
                </div>
              </div>
              {showPanel ? (
                <button
                  type="button"
                  disabled={disabled}
                  aria-expanded={open}
                  aria-controls={panelId}
                  title={
                    open ? t("searchFilter.closePanel") : t("searchFilter.openPanel")
                  }
                  aria-label={
                    open ? t("searchFilter.closePanel") : t("searchFilter.openPanel")
                  }
                  className={cn(
                    "grid w-8 shrink-0 place-items-center self-stretch rounded-e border border-erp-table-border bg-erp-table-bg text-erp-muted",
                    "hover:bg-erp-secondary hover:text-erp-text",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    open &&
                      "border-erp-brand-third bg-erp-brand-third-overlay text-erp-text"
                  )}
                  onClick={() => setOpen(!open)}
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-150",
                      open && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>
              ) : null}
            </div>
          </div>
          {panel}
        </div>
        {hasSideSlots ? (
          <div className="flex min-w-0 items-center justify-end gap-3">
            {columnsSlot ? (
              <div className="flex shrink-0 items-center">{columnsSlot}</div>
            ) : null}
            {endSlot}
          </div>
        ) : null}
      </div>
    );
  }
);

SearchFilter.displayName = "SearchFilter";
