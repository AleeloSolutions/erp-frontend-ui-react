/**
 * The chrome every signed-out screen shares: a workspace badge, a title,
 * and one contained card on a light page.
 *
 * `AuthField` is local rather than `FormInput` on purpose. The shared
 * field primitive is built for dense ERP forms -- bottom border only, and
 * it sets `box-shadow: none` inline, which no class can beat, so the soft
 * focus ring this design asks for cannot come from it. Everything here
 * still resolves to design tokens; nothing is a literal colour.
 */

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, cn } from "@erp/ui";
import { currentTenantSlug } from "@/lib/tenant";

/** The workspace's initial, when the page is served from its subdomain. */
function workspaceInitial(): string | null {
  const slug = currentTenantSlug();
  return slug ? slug.charAt(0).toUpperCase() : null;
}

export interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Small print under the card. */
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  const initial = workspaceInitial();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-erp-bg px-4 py-8 text-erp-text">
      <main className="w-full max-w-[420px]">
        <Card className="rounded-xl border-erp-border bg-white p-7 shadow-sm sm:p-8">
          <CardContent className="p-0">
            <header className="mb-6">
              {initial ? <div className="mb-5"></div> : null}
              <h1 className="m-0 mb-1.5 text-xl font-semibold tracking-tight text-erp-text">
                {title}
              </h1>
              {subtitle ? (
                <p className="m-0 text-sm font-normal leading-relaxed text-erp-muted">
                  {subtitle}
                </p>
              ) : null}
            </header>
            {children}
          </CardContent>
        </Card>
        {footer ? (
          <div className="mt-5 text-center text-xs text-erp-muted">{footer}</div>
        ) : null}
      </main>
    </div>
  );
}

export interface AuthFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className"
> {
  label: string;
  /** Adds the show/hide control and starts masked. */
  revealable?: boolean;
  helper?: string;
  id?: string;
}

export function AuthField({
  label,
  revealable = false,
  helper,
  required,
  id,
  type = "text",
  ...props
}: AuthFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helperId = `${fieldId}-helper`;
  const [revealed, setRevealed] = useState(false);
  const Reveal = revealed ? EyeOff : Eye;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="block select-none text-sm font-medium text-erp-form-label"
      >
        {label}
        {required ? (
          <span className="ms-1 font-medium text-[var(--brand-primary)]" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <div className="relative flex items-center">
        <input
          {...props}
          id={fieldId}
          required={required}
          type={revealable && revealed ? "text" : type}
          aria-describedby={helper ? helperId : undefined}
          className={cn(
            "h-[42px] w-full rounded-lg border border-erp-border-control bg-white py-2 ps-3.5 text-sm text-erp-text outline-none transition-all",
            "placeholder:text-erp-placeholder",
            "focus:border-[var(--brand-third)] focus:ring-2 focus:ring-[var(--brand-third-halo)]",
            "disabled:cursor-not-allowed disabled:bg-erp-surface disabled:text-erp-muted",
            revealable ? "pe-10" : "pe-3.5"
          )}
        />
        {revealable ? (
          <button
            type="button"
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            onClick={() => setRevealed((shown) => !shown)}
            className="absolute end-3 rounded p-0.5 text-erp-subtle transition-colors hover:text-erp-text focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-third-halo)]"
          >
            <Reveal className="h-[19px] w-[19px]" aria-hidden />
          </button>
        ) : null}
      </div>
      {helper ? (
        <p id={helperId} className="m-0 pt-0.5 text-xs text-erp-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

/** The card's primary action: full width, brand primary. */
export const AUTH_SUBMIT_CLASS =
  "h-[42px] w-full rounded-lg border-[var(--brand-primary)] bg-[var(--brand-primary)] text-sm font-medium text-white shadow-sm hover:border-[var(--brand-primary-hover)] hover:bg-[var(--brand-primary-hover)]";
