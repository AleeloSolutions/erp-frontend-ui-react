/**
 * Loading packaged modules at runtime.
 *
 * `me.module_bundles` names the frontends the tenant's enabled packaged
 * modules ship (paths under the API root, versioned). For each one that
 * has not registered yet, this fetches its stylesheet and its script
 * through the API client -- the bundle sits behind the session like every
 * other tenant resource, and a bare `<script src>` carries no bearer
 * token -- and injects them inline. The script is an IIFE built against
 * `window.KaabeRuntime` that ends by calling
 * `KaabeRuntime.registerModule(manifest)`, which is what resolves the
 * load. A bundle that fails to fetch or never registers is reported and
 * not retried for that version: the rest of the app must not hang on one
 * module.
 */

import { apiFetch } from "@/lib/api-client";
import { getModules, whenRegistered } from "./registry";
import type { ModuleManifest } from "./types";

export interface ModuleBundle {
  key: string;
  version: string;
  /** Path under the API root, e.g. `/v1/modules/pos/bundle/1.0.0/module.js`. */
  script: string;
  styles: string | null;
}

/** How long a bundle gets to register once its script has run. */
export const REGISTER_TIMEOUT_MS = 20_000;

const attempts = new Map<string, Promise<void>>();
const failures = new Set<string>();

function attemptKey(bundle: ModuleBundle) {
  return `${bundle.key}@${bundle.version}`;
}

/** The asset's text, fetched with the session's credentials. */
function fetchAsset(path: string): Promise<string> {
  return apiFetch<string>(path, {
    method: "GET",
    headers: { Accept: "*/*" },
    unwrap: false,
  });
}

function injectStyles(bundle: ModuleBundle, css: string) {
  for (const stale of document.querySelectorAll(`style[data-module="${bundle.key}"]`)) {
    stale.remove();
  }
  const style = document.createElement("style");
  style.dataset.module = bundle.key;
  style.dataset.version = bundle.version;
  style.textContent = css;
  document.head.appendChild(style);
}

function injectScript(bundle: ModuleBundle, code: string) {
  const script = document.createElement("script");
  script.dataset.module = bundle.key;
  script.dataset.version = bundle.version;
  script.textContent = `${code}\n//# sourceURL=kaabe-module-${bundle.key}-${bundle.version}.js`;
  // An inline script runs synchronously on append, so a sound bundle has
  // registered by the time this returns.
  document.head.appendChild(script);
}

/** Load one bundle: styles, script, then wait for its registration. */
export function loadModuleBundle(bundle: ModuleBundle): Promise<void> {
  const key = attemptKey(bundle);
  const existing = attempts.get(key);
  if (existing) return existing;

  const attempt = (async () => {
    if (getModules().some((module) => module.key === bundle.key)) return;
    const [css, code] = await Promise.all([
      bundle.styles ? fetchAsset(bundle.styles) : Promise.resolve(null),
      fetchAsset(bundle.script),
    ]);
    if (typeof code !== "string" || code.length === 0) {
      throw new Error(`${bundle.key}: the bundle came back empty`);
    }
    if (typeof css === "string" && css.length > 0) injectStyles(bundle, css);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const registered = whenRegistered(bundle.key);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${bundle.key}: the bundle ran but never registered`)),
        REGISTER_TIMEOUT_MS
      );
    });
    try {
      injectScript(bundle, code);
      await Promise.race([registered, timeout]);
    } finally {
      clearTimeout(timer);
    }
  })();

  attempts.set(key, attempt);
  attempt.catch((error: unknown) => {
    failures.add(key);
    console.error(error);
  });
  return attempt;
}

/** Load every bundle the session names; failures are logged, not thrown. */
export async function loadModuleBundles(bundles: readonly ModuleBundle[]): Promise<void> {
  await Promise.allSettled(bundles.map((bundle) => loadModuleBundle(bundle)));
}

/**
 * The bundles still on their way: named by the session, not registered,
 * and not given up on. While this is non-empty a URL the route table does
 * not know yet may well belong to one of them, so the app waits instead
 * of treating it as not found.
 */
export function pendingBundles(
  bundles: readonly ModuleBundle[],
  modules: readonly ModuleManifest[] = getModules()
): ModuleBundle[] {
  const registered = new Set(modules.map((module) => module.key));
  return bundles.filter(
    (bundle) => !registered.has(bundle.key) && !failures.has(attemptKey(bundle))
  );
}

/** Tests only. */
export function resetModuleLoader() {
  attempts.clear();
  failures.clear();
}
