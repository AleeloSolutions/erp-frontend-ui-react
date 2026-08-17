import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../utils";

function getTooltipText(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

/** Truncate + ellipsis on plain text and link/button cell content. */
const truncateDescendantClasses = [
  "[&_button]:block [&_button]:max-w-full [&_button]:min-w-0 [&_button]:truncate [&_button]:text-start",
  "[&_a]:block [&_a]:max-w-full [&_a]:min-w-0 [&_a]:truncate",
  "[&>*]:min-w-0 [&>*]:max-w-full",
];

export interface DataTableTruncatedCellProps {
  children: ReactNode;
  /** Row value — used for tooltip when present. */
  value?: unknown;
  className?: string;
}

function getMeasureTarget(node: HTMLElement): HTMLElement {
  const interactive = node.querySelector("button, a");
  if (interactive instanceof HTMLElement) return interactive;
  const first = node.firstElementChild;
  if (first instanceof HTMLElement) return first;
  return node;
}

function isOverflowing(node: HTMLElement): boolean {
  const target = getMeasureTarget(node);
  if (target.scrollWidth > target.clientWidth + 1) return true;
  if (target !== node && node.scrollWidth > node.clientWidth + 1) return true;
  return false;
}

function resolveTooltipLabel(node: HTMLElement, value?: unknown): string | undefined {
  const fromValue = getTooltipText(value);
  if (fromValue) return fromValue;
  const text = node.textContent?.replace(/\s+/g, " ").trim();
  return text && text.length > 0 ? text : undefined;
}

/** Ellipsis wrapper; native title on any overflowed cell (all column types). */
export function DataTableTruncatedCell({
  children,
  value,
  className,
}: DataTableTruncatedCellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState<string | undefined>();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    function update() {
      if (!isOverflowing(node!)) {
        setTitle(undefined);
        return;
      }
      setTitle(resolveTooltipLabel(node!, value));
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    const target = getMeasureTarget(node);
    if (target !== node) observer.observe(target);
    return () => observer.disconnect();
  }, [children, value]);

  return (
    <div
      ref={ref}
      title={title}
      className={cn(
        "min-w-0 max-w-full truncate whitespace-nowrap",
        truncateDescendantClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

export { getTooltipText };
