import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({
  content,
  children,
  side = "top",
  className,
  ...props
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      {...props}
    >
      <div aria-describedby={visible ? tooltipId : undefined}>{children}</div>
      {visible ? (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-nav px-2 py-1 text-[10px] font-semibold text-white shadow-md",
            side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
          )}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
