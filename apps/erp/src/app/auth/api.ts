/** Auth + account API for the Django backend (`/api/v1/auth/`, `/api/v1/users/`). */

import { apiGet, apiPost } from "@/lib/api-client";
import type { TokenPair } from "@/lib/auth";

export interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  status: "trial" | "active" | "suspended";
  trial_ends_at: string | null;
}

export interface Me {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_owner: boolean;
  /** false → the dashboard shows the pending-verification banner. */
  email_verified: boolean;
  client: ClientSummary | null;
}

export interface SignupPayload {
  full_name: string;
  company_name: string;
  /** The domain picker's final slug -- <slug>.erpeast.com. */
  slug: string;
  email: string;
  phone_number: string;
  country: string;
  language: string;
  company_size: string;
  primary_interest: string;
  accept_terms: boolean;
}

export interface SignupResult {
  client: ClientSummary;
  user: Me;
  tenant_url: string;
  auto_login_token: string;
}

export function signup(payload: SignupPayload) {
  return apiPost<SignupResult>("/v1/auth/signup/", payload);
}

export function login(email: string, password: string) {
  return apiPost<TokenPair>("/v1/auth/token/", { email, password });
}

/** Redeem the single-use token from signup / handoff for a JWT pair. */
export function exchangeAutoLoginToken(token: string) {
  return apiPost<TokenPair>("/v1/auth/token/exchange/", { token });
}

/** The email link: verify the address AND set the password in one step. */
export function verifyEmail(token: string, password: string) {
  return apiPost<TokenPair>("/v1/auth/verify/", { token, password });
}

export function resendVerification() {
  return apiPost<void>("/v1/auth/resend-verification/");
}

/** Single-use token to carry this session onto the tenant subdomain
 * (JWTs are per-origin and never cross by themselves). */
export function requestWorkspaceHandoff() {
  return apiPost<{ token: string }>("/v1/auth/handoff/");
}

export function fetchMe() {
  return apiGet<Me>("/v1/users/me/");
}

export interface SlugAvailability {
  available: boolean;
  suggestion: string | null;
}

/** The signup form's domain picker, checked once on idle (never on
 * every keystroke). Pass an AbortSignal so a stale in-flight check can
 * be cancelled the moment the user resumes typing. */
export function checkSlugAvailability(slug: string, signal?: AbortSignal) {
  return apiGet<SlugAvailability>(
    `/v1/clients/slug-availability/?slug=${encodeURIComponent(slug)}`,
    { signal }
  );
}

export interface TenantPublic {
  name: string;
  slug: string;
}

/** Public probe: does the current subdomain map to a real tenant?
 * Rejects with a 404 ApiError when it doesn't. */
export function resolveTenant() {
  return apiGet<TenantPublic>("/v1/clients/resolve/");
}
