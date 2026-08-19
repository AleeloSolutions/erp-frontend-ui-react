import { Settings } from "lucide-react";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../../primitives/Button";

export interface PageActionButton extends ButtonProps {
  key?: string;
}

export interface PageActionsProps {
  /** Active sub-view label shown after the title (e.g. the clicked submenu child) */
  breadcrumb?: string;
  /** Action buttons rendered to the left of the breadcrumb */
  buttons?: PageActionButton[];
  /** Shorthand for a single primary "New" button when `buttons` is omitted */
  onCreate?: () => void;
  /** Callback when the gear/actions menu is clicked */
  onActionsClick?: () => void;
  /** Hide the gear icon */
  hideActions?: boolean;
  className?: string;
}

export function PageActions({
  breadcrumb,
  buttons,
  onCreate,
  onActionsClick,
  hideActions = false,
  className,
}: PageActionsProps) {
  const actionButtons: PageActionButton[] =
    buttons ??
    (onCreate
      ? [{ children: "New", variant: "primary", size: "sm", onClick: onCreate }]
      : []);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {actionButtons.map((button, index) => {
        const {
          key,
          children = "New",
          variant = "primary",
          size = "sm",
          ...buttonProps
        } = button;
        return (
          <Button key={key ?? index} variant={variant} size={size} {...buttonProps}>
            {children}
          </Button>
        );
      })}
      {breadcrumb ? (
        <span className="text-[13px] font-normal text-erp-muted whitespace-nowrap truncate">
          {breadcrumb}
        </span>
      ) : null}
      {!hideActions ? (
        <button
          type="button"
          className=" grid h-7 w-7 place-items-center rounded border border-[#d8dadd] bg-transparent text-erp-muted hover:bg-black/[0.06]"
          aria-label="Actions menu"
          onClick={onActionsClick}
        >
          <Settings className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
