import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Filter, Layers, Search, Star, X } from "lucide-react";
import { cn } from "../../utils";

export type SearchFilterChip = {
  id: string;
  label: string;
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
  /** When false, hides the Filters / Group By / Favorites panel toggle. Default true. */
  showPanel?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

function PanelColumn({
  title,
  icon,
  items,
  emptyLabel,
}: {
  title: string;
  icon: ReactNode;
  items: SearchFilterItem[];
  emptyLabel?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-center gap-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.4px] text-erp-muted">
        {icon}
        {title}
      </div>
      <ul className="m-0 list-none p-0">
        {items.length === 0 ? (
          <li className="px-2 py-1.5 text-[11px] text-erp-subtle">
            {emptyLabel ?? "No options"}
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              {item.dividerBefore ? (
                <div className="mx-2 my-1 border-t border-erp-border-soft" />
              ) : null}
              <button
                type="button"
                disabled={item.disabled}
                onClick={item.onSelect}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[11px] text-erp-text",
                  "hover:bg-erp-surface-muted",
                  item.active && "bg-erp-surface-muted font-semibold",
                  item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                )}
              >
                <span className="grid h-3.5 w-3.5 shrink-0 place-items-center">
                  {item.checked ? (
                    <Check className="h-3 w-3 text-erp-primary" aria-hidden />
                  ) : null}
                </span>
                <span className="min-w-0 truncate">{item.label}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export const SearchFilter = forwardRef<HTMLInputElement, SearchFilterProps>(
  function SearchFilter(
    {
      value,
      onChange,
      placeholder = "Search...",
      chips = [],
      filters = [],
      groupBy = [],
      favorites,
      panelOpen: controlledOpen,
      defaultPanelOpen = false,
      onPanelOpenChange,
      columnsSlot,
      showPanel = true,
      disabled = false,
      readOnly = false,
      className,
    },
    ref
  ) {
    const panelId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultPanelOpen);
    const isControlled = controlledOpen !== undefined;
    const open = showPanel && (isControlled ? controlledOpen : uncontrolledOpen);

    function setOpen(next: boolean) {
      if (!showPanel) return;
      if (!isControlled) setUncontrolledOpen(next);
      onPanelOpenChange?.(next);
    }

    const favoriteItems =
      favorites ??
      ([
        {
          id: "save-current",
          label: "Save current search",
          disabled: true,
        },
      ] satisfies SearchFilterItem[]);

    useEffect(() => {
      if (!open || !showPanel) return;

      function onPointerDown(event: MouseEvent) {
        const target = event.target as Node;
        if (rootRef.current && !rootRef.current.contains(target)) {
          if (!isControlled) setUncontrolledOpen(false);
          onPanelOpenChange?.(false);
        }
      }

      function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          if (!isControlled) setUncontrolledOpen(false);
          onPanelOpenChange?.(false);
        }
      }

      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [open, showPanel, isControlled, onPanelOpenChange]);

    return (
      <div ref={rootRef} className={cn("relative mx-auto w-full max-w-2xl", className)}>
        <div className="flex w-full items-stretch gap-2">
          <div
            className={cn(
              "flex min-h-9 min-w-0 flex-1 items-stretch overflow-hidden rounded-md border border-erp-border-soft/70 bg-white",
              "transition-[border-color,box-shadow] duration-150",
              "hover:border-erp-border-soft",
              "focus-within:border-erp-primary focus-within:shadow-none",
              open && "border-erp-primary",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 px-2.5 py-1">
              <Search className="h-3.5 w-3.5 shrink-0 text-erp-subtle" aria-hidden />
              {chips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex max-w-full items-center gap-0.5 rounded-sm border border-erp-border-chip bg-erp-primary-50 px-1 py-px text-[10px] font-semibold text-erp-primary"
                >
                  <Filter className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 truncate">{chip.label}</span>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Remove ${chip.label}`}
                    className="grid h-3.5 w-3.5 place-items-center rounded-sm text-erp-primary/70 hover:bg-erp-primary/10 hover:text-erp-primary"
                    onClick={chip.onRemove}
                  >
                    <X className="h-2.5 w-2.5" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                ref={ref}
                value={value}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={chips.length ? "" : placeholder}
                aria-label="Search"
                className={cn(
                  "h-7 min-w-[6rem] flex-1 border-0 bg-transparent px-0.5 text-xs text-erp-text",
                  "placeholder:text-erp-placeholder",
                  "outline-none ring-0 focus:outline-none focus:ring-0",
                  "disabled:cursor-not-allowed"
                )}
                onChange={(event) => onChange(event.target.value)}
              />
            </div>
            {showPanel ? (
              <button
                type="button"
                disabled={disabled}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={open ? "Close search filters" : "Open search filters"}
                className={cn(
                  "grid w-9 shrink-0 place-items-center self-stretch border-s border-erp-border-soft text-erp-muted",
                  "hover:bg-erp-surface-muted hover:text-erp-text",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  open && "bg-erp-primary-50/70 text-erp-primary"
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
          {columnsSlot ? (
            <div className="flex shrink-0 items-center">{columnsSlot}</div>
          ) : null}
        </div>

        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-label="Search filters"
            className="absolute start-0 end-0 z-50 mt-1 overflow-hidden rounded-lg border border-erp-border bg-white shadow-lg"
          >
            <div className="grid grid-cols-1 gap-0 divide-y divide-erp-border-soft p-2 min-[721px]:grid-cols-3 min-[721px]:divide-x min-[721px]:divide-y-0">
              <PanelColumn
                title="Filters"
                icon={<Filter className="h-3 w-3 text-erp-primary" aria-hidden />}
                items={filters}
                emptyLabel="No filters"
              />
              <PanelColumn
                title="Group By"
                icon={<Layers className="h-3 w-3 text-erp-teal" aria-hidden />}
                items={groupBy}
                emptyLabel="No groupings"
              />
              <PanelColumn
                title="Favorites"
                icon={<Star className="h-3 w-3 text-erp-warning" aria-hidden />}
                items={favoriteItems}
                emptyLabel="No favorites"
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

SearchFilter.displayName = "SearchFilter";
