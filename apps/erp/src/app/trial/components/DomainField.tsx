import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { checkSlugAvailability } from "@/app/auth/api";
import { rootDomain } from "@/lib/tenant";
import { slugify } from "@/lib/slug";
import { TrialFloatingInput } from "./TrialFloatingField";

// The apex this SPA is served from (erpeast.com) -- the same base domain
// the live tenant resolver uses, never a hardcoded copy.
const BASE_DOMAIN =
  typeof window !== "undefined" ? rootDomain(window.location.hostname) : "";

const CHECK_DEBOUNCE_MS = 450;
/** Odoo-style floor: shorter picks get a generated suffix up to this length. */
export const MIN_DOMAIN_LENGTH = 4;

type CheckStatus = "idle" | "checking" | "free" | "taken";

export interface DomainFieldProps {
  /** Live value of the Company Name field -- drives the preview until
   * the user edits the domain by hand. */
  companyName: string;
  /**
   * Reports the slug that should actually be submitted, whether it is
   * blocked (empty / taken-while-editing / still checking), and whether an
   * availability request is in flight (debounce or network).
   */
  onChange: (slug: string, blocked: boolean, checking: boolean) => void;
  error?: string | null;
}

export function DomainField({ companyName, onChange, error }: DomainFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Behaviour 1: instant preview on every Company Name keystroke, until
  // the user has edited the domain input by hand.
  useEffect(() => {
    if (manuallyEdited) return;
    setSlug(slugify(companyName));
    setStatus("idle");
    setSuggestion(null);
  }, [companyName, manuallyEdited]);

  // Behaviour 2: debounced availability check, cancelled/superseded the
  // moment `slug` changes again. Short picks (1–3 chars) still hit the
  // API — the backend returns a padded suggestion (ab -> ab11) so we can
  // keep the typed stem and generate the rest, same UI as a taken name.
  useEffect(() => {
    if (!slug) {
      setStatus("idle");
      setSuggestion(null);
      return;
    }
    setStatus("checking");
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      checkSlugAvailability(slug, controller.signal)
        .then((result) => {
          setStatus(result.available ? "free" : "taken");
          setSuggestion(result.available ? null : result.suggestion);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setStatus("idle"); // network hiccup -- the server re-checks on submit regardless
        });
    }, CHECK_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [slug]);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  // Auto-suffix when:
  // - company-driven pick is taken (existing design), or
  // - the typed stem is shorter than MIN_DOMAIN_LENGTH and the API padded it
  //   (user insists on 2 chars -> we generate the other two).
  const isShort = slug.length > 0 && slug.length < MIN_DOMAIN_LENGTH;
  const isAutoSuffixed =
    suggestion !== null &&
    suggestion !== slug &&
    suggestion.startsWith(slug) &&
    ((!manuallyEdited && status === "taken") || (isShort && status === "taken"));
  const suffixText = isAutoSuffixed
    ? suggestion!.slice(Math.min(slug.length, suggestion!.length))
    : null;
  const effectiveSlug = isAutoSuffixed ? suggestion! : slug;
  const checking = Boolean(slug) && status === "checking" && !isAutoSuffixed;
  const blocked =
    !effectiveSlug ||
    checking ||
    (manuallyEdited && status === "taken" && !isAutoSuffixed) ||
    // Short stem still waiting on its padded suggestion
    (isShort && status !== "taken" && status !== "free");

  useEffect(() => {
    onChange(effectiveSlug, blocked, checking);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSlug, blocked, checking]);

  function handleManualChange(event: ChangeEvent<HTMLInputElement>) {
    const filtered = event.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 63);
    setManuallyEdited(true);
    setSlug(filtered);
    setStatus("idle");
    setSuggestion(null);
  }

  // Nothing to preview yet -> the row stays out of the way entirely
  // (still mounted, so it can transition in once a slug exists).
  const visible = expanded || slug.length > 0;

  if (expanded) {
    return (
      <div className="trial-domain-row">
        <TrialFloatingInput
          ref={inputRef}
          id="trial-domain"
          label="Domain"
          className="field-domain"
          value={slug}
          onChange={handleManualChange}
          autoComplete="off"
          addon={
            <span className="trial-domain-addon-content">
              .{BASE_DOMAIN}
              {status === "taken" && !isAutoSuffixed ? (
                <AlertTriangle
                  className="trial-domain-warning-icon"
                  role="img"
                  aria-label="This domain is unavailable."
                >
                  <title>This domain is unavailable.</title>
                </AlertTriangle>
              ) : null}
              {status === "checking" ? (
                <span className="trial-domain-checking">checking…</span>
              ) : null}
            </span>
          }
        />
        {isAutoSuffixed ? (
          <p className="trial-field-hint">
            Will use <strong>{effectiveSlug}</strong>.{BASE_DOMAIN}
          </p>
        ) : null}
        {error ? <p className="trial-field-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div
      className={`trial-domain-row${visible ? "" : " is-hidden"}`}
      aria-hidden={visible ? undefined : true}
    >
      <div className="trial-domain-collapsed">
        <span className="trial-domain-preview">
          {isAutoSuffixed ? (
            <>
              <AlertTriangle
                className="trial-domain-warning-icon"
                role="img"
                aria-label="The domain name will be different from the one you asked"
              >
                <title>The domain name will be different from the one you asked</title>
              </AlertTriangle>
              {slug}
              <span className="trial-domain-suffix">{suffixText}</span>
            </>
          ) : (
            slug
          )}
          <b className="trial-domain-suffix-static">.{BASE_DOMAIN}</b>
        </span>
        <button
          type="button"
          className="trial-domain-edit-btn"
          onClick={() => setExpanded(true)}
          aria-label="Edit domain"
          tabIndex={visible ? undefined : -1}
        >
          <Pencil className="h-3 w-3" />
        </button>
        {status === "checking" ? (
          <span className="trial-domain-checking">checking…</span>
        ) : null}
      </div>
      {error ? <p className="trial-field-error">{error}</p> : null}
    </div>
  );
}
