/**
 * Thin fetch wrapper for the Django API.
 *
 * - Dev: Vite proxies `/api` → http://127.0.0.1:8000 and PRESERVES the
 *   Host header — the backend resolves the tenant from the subdomain.
 * - Success envelope `{"data": ...}` is unwrapped automatically.
 * - Error envelope `{"error": {code, message, fields}}` becomes ApiError.
 * - JWT: Authorization comes from lib/auth; a 401 redeems the refresh
 *   token once (single-flight) and retries the request.
 *
 * Set VITE_API_BASE_URL in .env (default `/api`).
 */

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type TokenPair,
} from "./auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  /** Backend error code, e.g. "validation_error", "conflict", "invalid_token". */
  code: string | null;
  /** Field-level messages for validation errors: {"email": ["..."]}. */
  fields: Record<string, string[]> | null;
  body: unknown;

  constructor(
    message: string,
    status: number,
    options: {
      code?: string | null;
      fields?: Record<string, string[]> | null;
      body?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code ?? null;
    this.fields = options.fields ?? null;
    this.body = options.body;
  }
}

function joinUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

type ErrorEnvelope = {
  error?: { code?: string; message?: string; fields?: Record<string, string[]> };
  detail?: string;
};

function toApiError(status: number, payload: unknown, fallback: string): ApiError {
  if (payload && typeof payload === "object") {
    const { error, detail } = payload as ErrorEnvelope;
    const message =
      error?.message ?? (typeof detail === "string" ? detail : null) ?? fallback;
    return new ApiError(message, status, {
      code: error?.code ?? null,
      fields: error?.fields ?? null,
      body: payload,
    });
  }
  const message = (typeof payload === "string" && payload) || fallback;
  return new ApiError(message, status, { body: payload });
}

/** Single-flight refresh: concurrent 401s share one refresh request. */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(joinUrl("/v1/auth/token/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const pair =
        payload && typeof payload === "object" && "data" in payload
          ? ((payload as { data: Partial<TokenPair> }).data ?? null)
          : (payload as Partial<TokenPair> | null);
      if (!response.ok || !pair?.access) {
        clearTokens();
        return false;
      }
      // Rotation: the backend returns a new refresh token on every use.
      setTokens({ access: pair.access, refresh: pair.refresh ?? refresh });
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Skip JSON Content-Type (e.g. FormData uploads). */
  rawBody?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, rawBody, headers, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();
  // Auth endpoints authenticate by credentials/token in the body — a 401
  // there is a real answer, never something a refresh could fix.
  const isAuthEndpoint = path.includes("/auth/");

  const doFetch = () => {
    const finalHeaders = new Headers(headers);
    if (!rawBody && body !== undefined && !finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
    const access = getAccessToken();
    if (access && !finalHeaders.has("Authorization")) {
      finalHeaders.set("Authorization", `Bearer ${access}`);
    }
    // Proxies between browser and backend (Vercel, Traefik) rewrite the
    // Host header, so the tenant subdomain travels in an explicit header;
    // the backend only trusts it after checking membership.
    if (typeof window !== "undefined" && !finalHeaders.has("X-Tenant-Host")) {
      finalHeaders.set("X-Tenant-Host", window.location.host);
    }
    // Django session auth fallback: send CSRF token on unsafe methods
    if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
      const csrf = getCookie("csrftoken");
      if (csrf && !finalHeaders.has("X-CSRFToken")) {
        finalHeaders.set("X-CSRFToken", csrf);
      }
    }
    return fetch(joinUrl(path), {
      credentials: "include",
      ...rest,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : rawBody
            ? (body as BodyInit)
            : JSON.stringify(body),
    });
  };

  let response = await doFetch();
  if (response.status === 401 && !isAuthEndpoint && getRefreshToken()) {
    if (await tryRefresh()) {
      response = await doFetch();
    }
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload: unknown = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw toApiError(response.status, payload, response.statusText || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function apiGet<T>(path: string, init?: ApiFetchOptions) {
  return apiFetch<T>(path, { ...init, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, init?: ApiFetchOptions) {
  return apiFetch<T>(path, { ...init, method: "POST", body });
}

export function apiPut<T>(path: string, body?: unknown, init?: ApiFetchOptions) {
  return apiFetch<T>(path, { ...init, method: "PUT", body });
}

export function apiPatch<T>(path: string, body?: unknown, init?: ApiFetchOptions) {
  return apiFetch<T>(path, { ...init, method: "PATCH", body });
}

export function apiDelete<T>(path: string, init?: ApiFetchOptions) {
  return apiFetch<T>(path, { ...init, method: "DELETE" });
}
