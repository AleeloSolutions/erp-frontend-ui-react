/**
 * JWT storage. Tokens are per-origin by design: each tenant subdomain
 * (hodan-store.localhost / hodan-store.erpeast.com) keeps its own
 * session. Crossing origins goes through the backend's single-use
 * auto-login tokens (`/auth/handoff/` + `/welcome?token=`), never by
 * copying JWTs around.
 */

const ACCESS_KEY = "erp.auth.access";
const REFRESH_KEY = "erp.auth.refresh";

export interface TokenPair {
  access: string;
  refresh: string;
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens(pair: TokenPair): void {
  try {
    localStorage.setItem(ACCESS_KEY, pair.access);
    localStorage.setItem(REFRESH_KEY, pair.refresh);
  } catch {
    // Private mode / blocked storage: the session just won't survive reload.
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
