/**
 * Thin fetch wrapper for Django (or any JSON API).
 * Use this when replacing mock modules in src/api/*.
 *
 * Dev: Vite proxies `/api` → http://127.0.0.1:8000
 * Set VITE_API_BASE_URL in .env (default `/api`).
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  ""
);

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
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
  const finalHeaders = new Headers(headers);

  if (!rawBody && body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  // Django session auth: send CSRF token on unsafe methods when present
  const method = (rest.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf && !finalHeaders.has("X-CSRFToken")) {
      finalHeaders.set("X-CSRFToken", csrf);
    }
  }

  const response = await fetch(joinUrl(path), {
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

  const contentType = response.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "detail" in payload &&
        typeof (payload as { detail: unknown }).detail === "string" &&
        (payload as { detail: string }).detail) ||
      (typeof payload === "string" && payload) ||
      response.statusText ||
      "Request failed";
    throw new ApiError(String(message), response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
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
