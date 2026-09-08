/**
 * Loading packaged modules at runtime.
 *
 * `me.module_bundles` names the frontends the tenant's enabled packaged
 * modules ship (paths under the API root, versioned). For each one that
 * has not registered yet, this injects its stylesheet and its script; the
 * script is an IIFE built against `window.KaabeRuntime` and ends by
 * calling `KaabeRuntime.registerModule(manifest)`, which is what resolves
 * the load. A bundle that fails to load or never registers is reported
 * and not retried for that version: the rest of the app must not hang on
 * one module.
 */

import { apiUrl } from "@/lib/api-client";
import { getModules, whenRegistered } from "./registry";

export interface ModuleBundle {
  key: string;
  version: string;
  /** Path under the API root, e.g. `/v1/modules/pos/bundle/1.0.0/module.js`. */
  script: string;
  styles: string | null;
}

/** How long a bundle gets to register once its script has been asked for. */
export const REGISTER_TIMEOUT_MS = 20_000;

const attempts = new Map<string, Promise<void>>();

function attemptKey(bundle: ModuleBundle) {
  return `${bundle.key}@${bundle.version}`;
}

function injectStyles(bundle: ModuleBundle) {
  if (!bundle.styles) return;
  const href = apiUrl(bundle.styles);
  if (document.querySelector(`link[data-module="${bundle.key}"][href="${href}"]`)) return;
  for (const stale of document.querySelectorAll(`link[data-module="${bundle.key}"]`)) {
    stale.remove();
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.module = bundle.key;
  document.head.appendChild(link);
}

function injectScript(bundle: ModuleBundle): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = apiUrl(bundle.script);
    script.async = true;
    script.dataset.module = bundle.key;
    script.dataset.version = bundle.version;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`${bundle.key}: the bundle failed to load`));
    document.head.appendChild(script);
  });
}

/** Load one bundle: styles, script, then wait for its registration. */
export function loadModuleBundle(bundle: ModuleBundle): Promise<void> {
  const key = attemptKey(bundle);
  const existing = attempts.get(key);
  if (existing) return existing;

  const attempt = (async () => {
    if (getModules().some((module) => module.key === bundle.key)) return;
    injectStyles(bundle);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const registered = whenRegistered(bundle.key);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${bundle.key}: the bundle loaded but never registered`)),
        REGISTER_TIMEOUT_MS
      );
    });
    try {
      await injectScript(bundle);
      await Promise.race([registered, timeout]);
    } finally {
      clearTimeout(timer);
    }
  })();

  attempts.set(key, attempt);
  attempt.catch((error: unknown) => {
    console.error(error);
  });
  return attempt;
}

/** Load every bundle the session names; failures are logged, not thrown. */
export async function loadModuleBundles(bundles: readonly ModuleBundle[]): Promise<void> {
  await Promise.allSettled(bundles.map((bundle) => loadModuleBundle(bundle)));
}

/** Tests only. */
export function resetModuleLoader() {
  attempts.clear();
}
