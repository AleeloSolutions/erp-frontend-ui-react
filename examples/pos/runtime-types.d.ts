/**
 * The types of `@kaabe/runtime`, which is not a package: at build time it
 * is an external resolved to `window.KaabeRuntime` (vite.config.ts), the
 * object the host SPA installs before it renders. tsconfig.json maps the
 * specifier to this file, taken from the host's own declaration so a
 * module is checked against exactly what it will get.
 */

import type { KaabeRuntime } from "../../apps/erp/src/lib/runtime";

export declare const version: KaabeRuntime["version"];
/** The host's API client: envelope handling, JWT refresh, the tenant header. */
export declare const api: KaabeRuntime["api"];
/** The host's shell and session, so a module's pages look like the rest. */
export declare const app: KaabeRuntime["app"];
/** What a bundle calls, once, as its last statement. */
export declare const registerModule: KaabeRuntime["registerModule"];
