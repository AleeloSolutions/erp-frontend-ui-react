/**
 * The live module registry: the modules compiled into this build plus
 * the ones that registered at runtime -- packaged modules whose bundle
 * the loader fetched and which called `KaabeRuntime.registerModule`.
 *
 * A store rather than a constant, because a bundle can land after the
 * app has rendered: `useModules()` subscribes, so the sidebar and the
 * route table pick a new module up the moment it registers. A compiled-in
 * module always wins over a runtime one with the same key.
 */

import { useSyncExternalStore } from "react";
import { moduleRegistry as compiledModules } from "./index";
import type { ModuleManifest } from "./types";

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

let runtimeModules: ModuleManifest[] = [];
let snapshot: ModuleManifest[] = [...compiledModules];
const listeners = new Set<() => void>();
const waiters = new Map<string, Set<(manifest: ModuleManifest) => void>>();

function rebuild() {
  const compiledKeys = new Set(compiledModules.map((module) => module.key));
  snapshot = [
    ...compiledModules,
    ...runtimeModules.filter((module) => !compiledKeys.has(module.key)),
  ];
  for (const listener of listeners) listener();
}

/** Every module this app can show right now, compiled-in first. */
export function getModules(): ModuleManifest[] {
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The registry as React state: re-renders when a module registers. */
export function useModules(): ModuleManifest[] {
  return useSyncExternalStore(subscribe, getModules, getModules);
}

/**
 * What a packaged module's bundle calls, once, as its last statement.
 * Registering the same key again replaces the earlier manifest (a newer
 * version of the bundle); an invalid manifest is refused loudly, because
 * a module that half-registers is worse than one that does not.
 */
export function registerRuntimeModule(manifest: ModuleManifest): ModuleManifest {
  if (!manifest || typeof manifest !== "object") {
    throw new TypeError("registerModule: a manifest object is required");
  }
  if (typeof manifest.key !== "string" || !KEY_PATTERN.test(manifest.key)) {
    throw new TypeError(`registerModule: invalid key ${JSON.stringify(manifest.key)}`);
  }
  if (typeof manifest.path !== "string" || !manifest.path.startsWith("/")) {
    throw new TypeError(`registerModule(${manifest.key}): path must start with "/"`);
  }
  if (!manifest.nav || typeof manifest.nav.key !== "string") {
    throw new TypeError(`registerModule(${manifest.key}): nav.key is required`);
  }
  if (typeof manifest.Routes !== "function" && typeof manifest.Routes !== "object") {
    throw new TypeError(`registerModule(${manifest.key}): Routes must be a component`);
  }
  runtimeModules = [
    ...runtimeModules.filter((module) => module.key !== manifest.key),
    manifest,
  ];
  rebuild();
  const pending = waiters.get(manifest.key);
  if (pending) {
    waiters.delete(manifest.key);
    for (const resolve of pending) resolve(manifest);
  }
  return manifest;
}

/** Resolves once `key` has registered (at once if it already has). */
export function whenRegistered(key: string): Promise<ModuleManifest> {
  const existing = snapshot.find((module) => module.key === key);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const pending = waiters.get(key) ?? new Set();
    pending.add(resolve);
    waiters.set(key, pending);
  });
}

/** Tests only: back to the compiled-in modules. */
export function resetRuntimeModules() {
  runtimeModules = [];
  waiters.clear();
  rebuild();
}
