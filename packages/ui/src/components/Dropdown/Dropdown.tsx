import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import {
  cn,
  fieldChromeClasses,
  fieldSizeClasses,
  type FieldChrome,
  type FieldChromeEdge,
  type FieldSize,
} from "../../utils";
import { Button, type ButtonProps } from "../../primitives/Button";
import { Input } from "../../primitives/Input";
import { useUiTranslation } from "../../i18n";

export interface DropdownItem {
  key: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  /** Overrides the default text/hover classes (including the `danger` red) for this item. */
  className?: string;
}

export interface DropdownProps {
  items: DropdownItem[];
  align?: "left" | "right";
  /**
   * Field = same chrome as Input/Select (default).
   * Button = compact Button trigger for icon/toolbar menus (DataTable row actions).
   */
  trigger?: "field" | "button";
  /** Searchable combobox — only when `trigger="field"`. */
  searchable?: boolean;
  /**
   * When `searchable`, accept typed text that doesn't match any item as the
   * value itself (quick-create style) instead of reverting to the last
   * selection on dismiss. Fires `onChange(text, { key: text, label: text })`.
   */
  allowFreeText?: boolean;
  /** Button trigger label, or static field label when not using value/onChange. */
  label?: ReactNode;
  placeholder?: string;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (key: string | null, item: DropdownItem | null) => void;
  onSearchMore?: () => void;
  size?: FieldSize;
  error?: boolean;
  disabled?: boolean;
  /** Show a clear (×) control to reset the value when one is selected. Field trigger only. */
  clearable?: boolean;
  id?: string;
  /** Field border treatment. Used when `trigger="field"`. Defaults to `corner`. */
  chrome?: FieldChrome;
  /** Side for `corner` / `tick`. Ignored by `underline`. Defaults to `end`. */
  chromeEdge?: FieldChromeEdge;
  buttonProps?: Omit<ButtonProps, "children">;
  /** Hide the chevron/caret (e.g. icon-only row action triggers). */
  hideChevron?: boolean;
  className?: string;
}

function useButtonTrigger(
  trigger: DropdownProps["trigger"],
  buttonProps?: DropdownProps["buttonProps"]
) {
  if (trigger === "button") return true;
  if (trigger === "field") return false;
  return (
    buttonProps?.size === "icon" ||
    buttonProps?.variant === "ghost" ||
    buttonProps?.variant === "primary" ||
    buttonProps?.variant === "danger" ||
    buttonProps?.variant === "teal"
  );
}

function useDismiss(
  open: boolean,
  onClose: () => void,
  rootRef: RefObject<HTMLElement | null>,
  menuRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef?.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, rootRef, menuRef]);
}

function useFieldMenuCoords(anchorRef: RefObject<HTMLElement | null>) {
  const [coords, setCoords] = useState({
    top: 0 as number | undefined,
    bottom: undefined as number | undefined,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  useLayoutEffect(() => {
    function update() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      setCoords({
        top: openUp ? undefined : rect.bottom + 4,
        bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(240, Math.max(80, openUp ? spaceAbove : spaceBelow)),
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  return coords;
}

function DropdownCaret({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute end-2 top-1/2 size-0 -translate-y-1/2",
        "border-x-[4px] border-x-transparent border-t-[5px] border-solid",
        open ? "border-t-erp-teal" : "border-t-erp-subtle"
      )}
    />
  );
}

function useButtonMenuCoords(
  anchorRef: RefObject<HTMLElement | null>,
  align: "left" | "right",
  open: boolean
) {
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    minWidth: 160,
  });

  useLayoutEffect(() => {
    if (!open) return;

    function update() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const pad = 8;
      const minWidth = Math.max(160, rect.width);
      let left = align === "right" ? rect.right - minWidth : rect.left;
      left = Math.max(pad, Math.min(left, window.innerWidth - minWidth - pad));
      setCoords({
        top: rect.bottom + 4,
        left,
        minWidth,
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, align, open]);

  return coords;
}

function ButtonMenu({
  items,
  align,
  menuId,
  onSelect,
  anchorRef,
  menuRef,
  open,
}: {
  items: DropdownItem[];
  align: "left" | "right";
  menuId: string;
  onSelect: (item: DropdownItem) => void;
  anchorRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  open: boolean;
}) {
  const coords = useButtonMenuCoords(anchorRef, align, open);

  return createPortal(
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      className={cn(
        "z-[70] min-w-[160px] overflow-hidden rounded-md border border-erp-border bg-erp-surface py-1 shadow-lg"
      )}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        minWidth: coords.minWidth,
      }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          className={cn(
            "flex w-full items-center px-2.5 py-1.5 text-left text-[11px] font-semibold text-erp-text hover:bg-erp-blue-50",
            item.danger && !item.className && "text-erp-error hover:bg-erp-error-bg",
            item.className,
            item.disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={() => onSelect(item)}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

function FieldMenu({
  items,
  listId,
  emptyLabel,
  onSelect,
  onSearchMore,
  searchMoreLabel,
  anchorRef,
  menuRef,
  search,
}: {
  items: DropdownItem[];
  listId: string;
  emptyLabel: string;
  onSelect: (item: DropdownItem) => void;
  onSearchMore?: () => void;
  searchMoreLabel?: string;
  anchorRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  /** Renders a live-filter search input above the list — used by the plain
   * (non-combobox) field trigger so search is available immediately on open,
   * without changing that trigger's own closed-state look. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}) {
  const coords = useFieldMenuCoords(anchorRef);

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "z-[70] flex flex-col overflow-hidden",
        "rounded border border-erp-table-border bg-erp-table-bg text-[0.875rem] text-erp-text",
        "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)]"
      )}
      style={{
        position: "fixed",
        top: coords.top,
        bottom: coords.bottom,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
      }}
    >
      {search ? (
        <div className="shrink-0 border-b border-erp-table-border p-1.5">
          <input
            type="text"
            autoFocus
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder}
            className="w-full border-0 bg-transparent px-2 py-1 text-[0.875rem] text-erp-text outline-none placeholder:text-erp-placeholder"
          />
        </div>
      ) : null}
      <ul
        id={listId}
        role="listbox"
        className="m-0 min-h-0 flex-1 list-none overflow-y-auto py-2 [scrollbar-width:thin]"
      >
        {items.length === 0 ? (
          <li className="px-5 py-[3px] text-erp-muted">{emptyLabel}</li>
        ) : (
          items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                role="option"
                disabled={item.disabled}
                className="block w-full truncate border-0 bg-transparent px-5 py-[3px] text-start text-erp-text hover:bg-erp-menu-hover disabled:text-erp-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(item)}
              >
                {item.label}
              </button>
            </li>
          ))
        )}
        {onSearchMore ? (
          <li>
            <button
              type="button"
              className="block w-full truncate border-0 bg-transparent px-5 py-[3px] text-start text-erp-text hover:bg-erp-menu-hover"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onSearchMore}
            >
              {searchMoreLabel}
            </button>
          </li>
        ) : null}
      </ul>
    </div>,
    document.body
  );
}

export const Dropdown = forwardRef<HTMLInputElement, DropdownProps>(function Dropdown(
  {
    label,
    items,
    align = "left",
    trigger,
    searchable = false,
    allowFreeText = false,
    placeholder,
    value,
    defaultValue = null,
    onChange,
    onSearchMore,
    size = "sm",
    error = false,
    disabled,
    clearable = false,
    id,
    chrome,
    chromeEdge,
    buttonProps,
    hideChevron = false,
    className,
  },
  ref
) {
  const { t } = useUiTranslation("ui");
  const [isOpen, setIsOpen] = useState(false);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  // Tracks whether the user has typed since the combobox was last opened, so
  // reopening on an existing selection shows the full list instead of
  // filtering it down to just that selection's text.
  const [searchTouched, setSearchTouched] = useState(false);
  const menuId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isButtonTrigger = useButtonTrigger(trigger, buttonProps);
  const isFieldSelect = !isButtonTrigger && !searchable;
  const isControlledValue = value !== undefined;
  const selectedValue = isControlledValue ? value : innerValue;
  const selected = items.find((item) => item.key === selectedValue);
  // Falls back to the raw value when it's a free-text entry not present in `items`.
  const displayLabel = selected?.label ?? (allowFreeText ? (selectedValue ?? "") : "");

  const {
    className: buttonClassName,
    disabled: buttonDisabled,
    variant: _variant,
    size: _buttonSize,
    loading: _loading,
    ...restButtonProps
  } = buttonProps ?? {};

  const isDisabled = disabled ?? buttonDisabled;

  const close = () => setIsOpen(false);

  function commitItem(item: DropdownItem) {
    if (!isControlledValue) setInnerValue(item.key);
    onChange?.(item.key, item);
  }

  // Dismissing (outside click / Escape) without picking a list item: if the
  // typed text doesn't match the current selection, either commit it as a
  // free-text value (allowFreeText) or just close — the display falls back
  // to the last selection either way.
  function dismiss() {
    if (searchable && allowFreeText && isOpen) {
      const typed = query.trim();
      if (typed && typed !== (selected?.label ?? "")) {
        commitItem({ key: typed, label: typed });
      }
    }
    close();
  }
  useDismiss(isOpen, dismiss, rootRef, menuRef);

  function pickItem(item: DropdownItem) {
    if (isFieldSelect || searchable) {
      commitItem(item);
    }
    item.onClick?.();
    close();
  }

  function clear(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!isControlledValue) setInnerValue(null);
    onChange?.(null, null);
    if (searchable) {
      setQuery("");
      setSearchTouched(false);
    }
  }

  // Only filter once the user has actually typed in this open session — a
  // reopened combobox pre-fills `query` with the current selection's label
  // (so it can be edited), but that shouldn't hide every other option.
  const applySearchFilter = isFieldSelect || (searchable && searchTouched);
  const needle = query.trim().toLowerCase();
  const visibleItems =
    applySearchFilter && needle
      ? items.filter((item) => item.label.toLowerCase().includes(needle))
      : items;

  useEffect(() => {
    if (!searchable || isOpen) return;
    setQuery(displayLabel);
  }, [searchable, isOpen, displayLabel]);

  if (isButtonTrigger) {
    const toggle = () => setIsOpen((open) => !open);
    const menu = isOpen ? (
      <ButtonMenu
        items={items}
        align={align}
        menuId={menuId}
        onSelect={pickItem}
        anchorRef={rootRef}
        menuRef={menuRef}
        open={isOpen}
      />
    ) : null;

    return (
      <div ref={rootRef} className={cn("relative inline-flex", className)}>
        <Button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          disabled={isDisabled}
          onClick={toggle}
          className={buttonClassName}
          {...restButtonProps}
        >
          {label}
          {hideChevron ? null : (
            <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
          )}
        </Button>
        {menu}
      </div>
    );
  }

  if (searchable) {
    const emptyLabel = t("dropdown.noResults");
    const searchMoreLabel = t("dropdown.searchMore");

    const showClear = clearable && !isDisabled && !!selectedValue;

    return (
      <div ref={rootRef} className={cn("relative min-w-0 max-w-full", className)}>
        <Input
          ref={ref}
          id={id}
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={listId}
          disabled={isDisabled}
          error={error}
          size={size}
          chrome={chrome}
          chromeEdge={chromeEdge}
          placeholder={placeholder}
          value={isOpen ? query : displayLabel}
          className={cn(
            "w-full truncate",
            showClear && !hideChevron && "pe-12",
            showClear && hideChevron && "pe-7",
            !showClear && "pe-7"
          )}
          onFocus={() => {
            if (isDisabled) return;
            setQuery(displayLabel);
            setSearchTouched(false);
            setIsOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchTouched(true);
            setIsOpen(true);
          }}
        />
        {showClear ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("dropdown.clear")}
            className={cn(
              "absolute top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-erp-muted hover:bg-erp-surface-muted hover:text-erp-text",
              hideChevron ? "end-2" : "end-6"
            )}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        ) : null}
        {hideChevron ? null : <DropdownCaret open={isOpen} />}
        {isOpen ? (
          <FieldMenu
            items={visibleItems}
            listId={listId}
            emptyLabel={emptyLabel}
            onSelect={pickItem}
            onSearchMore={
              onSearchMore
                ? () => {
                    onSearchMore();
                    close();
                  }
                : undefined
            }
            searchMoreLabel={searchMoreLabel}
            anchorRef={rootRef}
            menuRef={menuRef}
          />
        ) : null}
      </div>
    );
  }

  const fieldLabel =
    selected?.label ??
    placeholder ??
    (typeof label === "string" || typeof label === "number" ? String(label) : null);

  const toggle = () => {
    if (isDisabled) return;
    setIsOpen((open) => {
      const next = !open;
      // Start every open with a blank search box rather than leftover text.
      if (next) setQuery("");
      return next;
    });
  };

  const menu = isOpen ? (
    <FieldMenu
      items={visibleItems}
      listId={listId}
      emptyLabel={t("dropdown.noResults")}
      onSelect={pickItem}
      anchorRef={rootRef}
      menuRef={menuRef}
      search={{
        value: query,
        onChange: setQuery,
        placeholder: t("dropdown.search"),
      }}
    />
  ) : null;

  const showClear = clearable && !isDisabled && !!selected;

  return (
    <div ref={rootRef} className={cn("relative min-w-0 max-w-full", className)}>
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-1",
          fieldChromeClasses({
            error,
            within: true,
            active: isOpen,
            disabled: isDisabled,
            chrome,
            chromeEdge,
          }),
          fieldSizeClasses[size],
          buttonClassName
        )}
      >
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listId}
          disabled={isDisabled}
          onClick={toggle}
          style={{ outline: "none", boxShadow: "none" }}
          className={cn(
            "flex min-w-0 flex-1 items-center text-start font-normal outline-none",
            !selected && placeholder ? "text-erp-placeholder" : "text-erp-text"
          )}
          {...(restButtonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          <span className="min-w-0 flex-1 truncate">{fieldLabel}</span>
        </button>
        {showClear ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("dropdown.clear")}
            disabled={isDisabled}
            className="grid size-5 shrink-0 place-items-center rounded text-erp-muted hover:bg-erp-surface-muted hover:text-erp-text"
            onClick={clear}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        ) : null}
        {hideChevron ? null : (
          <span
            aria-hidden
            className={cn(
              "size-0 shrink-0 border-x-[4px] border-x-transparent border-t-[5px] border-solid",
              isOpen ? "border-t-erp-teal" : "border-t-erp-subtle"
            )}
          />
        )}
      </div>
      {menu}
    </div>
  );
});

Dropdown.displayName = "Dropdown";
