import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
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
  /**
   * Custom row content for the field menu list (`trigger="field"`) — e.g. the
   * matched substring in bold plus a muted secondary line. Receives the item
   * and the current search text.
   */
  renderItem?: (
    item: DropdownItem,
    ctx: { selected: boolean; query: string }
  ) => ReactNode;
  /**
   * Searchable combobox only. Fires whenever the search text changes: `typed` is
   * false when the component seeded the box itself (opening pre-fills it with
   * the current selection) rather than the user typing.
   */
  onQueryChange?: (query: string, meta: { typed: boolean }) => void;
  /** Fires when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Filter `items` against the search text in the browser. Turn this off when
   * the list already comes back filtered from a server search. Defaults to true.
   */
  filterItems?: boolean;
  /**
   * Message row above the options — an async search's loading / failed / empty
   * state. Replaces the built-in "no results" row while it is set.
   */
  statusContent?: ReactNode;
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
      // Sit tight under the underline — Odoo many2one style.
      setCoords({
        top: openUp ? undefined : rect.bottom + 1,
        bottom: openUp ? window.innerHeight - rect.top + 1 : undefined,
        left: rect.left,
        width: Math.max(rect.width, 160),
        maxHeight: Math.min(280, Math.max(80, openUp ? spaceAbove : spaceBelow)),
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
  selectedKey,
  search,
  renderItem,
  statusContent,
  activeIndex = -1,
  optionIdPrefix,
  query = "",
}: {
  items: DropdownItem[];
  listId: string;
  emptyLabel: string;
  onSelect: (item: DropdownItem) => void;
  onSearchMore?: () => void;
  searchMoreLabel?: string;
  anchorRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  renderItem?: DropdownProps["renderItem"];
  statusContent?: ReactNode;
  /** Keyboard-highlighted row in `items`, or -1 for none. */
  activeIndex?: number;
  /** Prefix for per-option element ids (`aria-activedescendant`). */
  optionIdPrefix?: string;
  /** Current search text — passed through to `renderItem`. */
  query?: string;
  /** Currently committed value — rendered bold in the list (Odoo many2one). */
  selectedKey?: string | null;
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
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // `scrollIntoView` does not exist in jsdom — optional call keeps tests quiet.
    activeRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "z-[70] flex flex-col overflow-hidden",
        "rounded-sm border border-black/[0.06] bg-white text-[0.875rem] text-erp-text",
        "shadow-[0_1px_4px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.08)]"
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
        <div className="shrink-0 border-b border-black/[0.06] px-2 py-1.5">
          <input
            type="text"
            autoFocus
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder}
            className="w-full border-0 bg-transparent py-1 text-[0.875rem] text-erp-text outline-none placeholder:text-erp-placeholder"
          />
        </div>
      ) : null}
      {statusContent ? (
        <div role="status" className="shrink-0 px-5 py-1.5 text-[0.875rem]">
          {statusContent}
        </div>
      ) : null}
      <ul
        id={listId}
        role="listbox"
        className="m-0 min-h-0 flex-1 list-none overflow-y-auto py-1 [scrollbar-width:thin]"
      >
        {items.length === 0 && !statusContent ? (
          <li className="px-5 py-1.5 text-erp-muted">{emptyLabel}</li>
        ) : (
          items.map((item, index) => {
            const isSelected = selectedKey != null && item.key === selectedKey;
            const isActive = index === activeIndex;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  ref={isActive ? activeRef : undefined}
                  id={optionIdPrefix ? `${optionIdPrefix}-${index}` : undefined}
                  role="option"
                  aria-selected={isSelected}
                  // Custom content can split the text across elements (bolded
                  // match, muted secondary); `label` stays the announced name.
                  aria-label={renderItem ? item.label : undefined}
                  disabled={item.disabled}
                  className={cn(
                    "block w-full border-0 bg-transparent px-5 py-1.5 text-start text-[0.875rem] text-erp-text",
                    "hover:bg-erp-menu-hover disabled:text-erp-muted",
                    renderItem ? "min-w-0" : "truncate",
                    isActive && "bg-erp-menu-hover"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(item)}
                >
                  {renderItem
                    ? renderItem(item, { selected: isSelected, query })
                    : item.label}
                </button>
              </li>
            );
          })
        )}
        {onSearchMore ? (
          <li>
            <button
              type="button"
              className="block w-full truncate border-0 bg-transparent px-5 py-1.5 text-start text-[0.875rem] text-erp-text hover:bg-erp-menu-hover"
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
    renderItem,
    onQueryChange,
    onOpenChange,
    filterItems = true,
    statusContent,
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
  // Keyboard-highlighted row in the combobox list. -1 = nothing highlighted:
  // Enter then never picks a row the user did not deliberately move onto,
  // which matters when a server search keeps replacing the list underneath.
  const [activeIndex, setActiveIndex] = useState(-1);
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

  function setOpenState(next: boolean) {
    if (next === isOpen) return;
    setIsOpen(next);
    if (!next) setActiveIndex(-1);
    onOpenChange?.(next);
  }

  const close = () => setOpenState(false);

  /** Search text changes, mirrored to the consumer. */
  function updateQuery(next: string, typed: boolean) {
    setQuery(next);
    onQueryChange?.(next, { typed });
  }

  function commitItem(item: DropdownItem) {
    if (!isControlledValue) setInnerValue(item.key);
    onChange?.(item.key, item);
  }

  // Dismissing (outside click / Escape) never commits — it closes, and the
  // display falls back to the last selection. Turning typed text into a value
  // is an explicit act: Enter here, or a Create row in a composed picker.
  useDismiss(isOpen, close, rootRef, menuRef);

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
      updateQuery("", false);
      setSearchTouched(false);
      setActiveIndex(-1);
    }
  }

  // Only filter once the user has actually typed in this open session — a
  // reopened combobox pre-fills `query` with the current selection's label
  // (so it can be edited), but that shouldn't hide every other option.
  const applySearchFilter =
    filterItems && (isFieldSelect || (searchable && searchTouched));
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
    const toggle = () => setOpenState(!isOpen);
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

    function openSearchMenu() {
      if (isDisabled) return;
      updateQuery(displayLabel, false);
      setSearchTouched(false);
      setActiveIndex(-1);
      setOpenState(true);
    }

    function moveActive(delta: number) {
      const enabled = visibleItems
        .map((item, index) => (item.disabled ? -1 : index))
        .filter((index) => index >= 0);
      if (enabled.length === 0) return;
      const position = enabled.indexOf(activeIndex);
      const next =
        position === -1
          ? delta > 0
            ? 0
            : enabled.length - 1
          : (position + delta + enabled.length) % enabled.length;
      setActiveIndex(enabled[next]);
    }

    function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
      if (isDisabled) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen) {
          openSearchMenu();
          return;
        }
        moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (event.key === "Escape") {
        if (!isOpen) return;
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Tab") {
        // Leaving the field is a dismissal, not a commit.
        if (isOpen) close();
        return;
      }
      if (event.key !== "Enter" || !isOpen) return;
      const active = activeIndex >= 0 ? visibleItems[activeIndex] : undefined;
      if (active && !active.disabled) {
        event.preventDefault();
        pickItem(active);
        return;
      }
      // Nothing highlighted: take the typed text when the field accepts free
      // text, otherwise just close. Either way Enter must not submit the form.
      event.preventDefault();
      if (allowFreeText) {
        const typed = query.trim();
        if (typed && typed !== (selected?.label ?? "")) {
          commitItem({ key: typed, label: typed });
        }
      }
      close();
    }

    return (
      <div ref={rootRef} className={cn("relative min-w-0 max-w-full", className)}>
        <Input
          ref={ref}
          id={id}
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
          }
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
            !showClear && "pe-7",
            isOpen &&
              !error &&
              "border-b-erp-input-border-focus hover:border-b-erp-input-border-focus focus:border-b-erp-input-border-focus focus-visible:border-b-erp-input-border-focus"
          )}
          onFocus={openSearchMenu}
          onClick={() => {
            // After a pick the input often keeps focus, so onFocus won't fire
            // again — reopen from click while already focused.
            if (!isOpen) openSearchMenu();
          }}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            updateQuery(event.target.value, true);
            setSearchTouched(true);
            setActiveIndex(-1);
            setOpenState(true);
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
        {hideChevron ? null : (
          <button
            type="button"
            tabIndex={-1}
            aria-label={isOpen ? t("dropdown.close") : t("dropdown.open")}
            disabled={isDisabled}
            className="absolute end-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center border-0 bg-transparent p-0"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (isDisabled) return;
              if (isOpen) {
                close();
                return;
              }
              openSearchMenu();
            }}
          >
            <span
              aria-hidden
              className={cn(
                "size-0 border-x-[4px] border-x-transparent border-t-[5px] border-solid",
                isOpen ? "border-t-erp-input-border-focus" : "border-t-erp-subtle"
              )}
            />
          </button>
        )}
        {isOpen ? (
          <FieldMenu
            items={visibleItems}
            listId={listId}
            emptyLabel={emptyLabel}
            selectedKey={selectedValue}
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
            renderItem={renderItem}
            statusContent={statusContent}
            activeIndex={activeIndex}
            optionIdPrefix={`${listId}-opt`}
            query={query}
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
      selectedKey={selectedValue}
      onSelect={pickItem}
      anchorRef={rootRef}
      menuRef={menuRef}
      renderItem={renderItem}
      statusContent={statusContent}
      query={query}
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
          isOpen &&
            !error &&
            "border-b-erp-input-border-focus hover:border-b-erp-input-border-focus focus-within:border-b-erp-input-border-focus",
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
              isOpen ? "border-t-erp-input-border-focus" : "border-t-erp-subtle"
            )}
          />
        )}
      </div>
      {menu}
    </div>
  );
});

Dropdown.displayName = "Dropdown";
