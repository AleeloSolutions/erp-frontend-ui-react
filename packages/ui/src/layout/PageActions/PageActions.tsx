import { Plus, Settings } from "lucide-react";
import { cn } from "../../utils";
import { Button } from "../../primitives/Button";

export interface PageActionsProps {
  /** Page/view title displayed next to the New button */
  title: string;
  /** Callback when the "New" button is clicked */
  onCreate?: () => void;
  /** Callback when the gear/actions menu is clicked */
  onActionsClick?: () => void;
  /** Hide the New button */
  hideCreate?: boolean;
  /** Hide the gear icon */
  hideActions?: boolean;
  className?: string;
}

export function PageActions({
  title,
  onCreate,
  onActionsClick,
  hideCreate = false,
  hideActions = false,
  className,
}: PageActionsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {!hideCreate && onCreate ? (
        <Button variant="primary" size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New
        </Button>
      ) : null}
      <span className="text-lg font-normal text-erp-text whitespace-nowrap truncate">
        {title}
      </span>
      {!hideActions ? (
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded border border-[#d8dadd] bg-transparent text-erp-muted hover:bg-black/[0.06]"
          aria-label="Actions menu"
          onClick={onActionsClick}
        >
          <Settings className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
