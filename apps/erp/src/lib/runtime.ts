/**
 * `window.KaabeRuntime` -- what a packaged module's bundle links against.
 *
 * A module built with the module kit (`examples/pos`) treats React, React
 * Router, React Query, `@erp/ui` and the app's own client as externals
 * resolved from this object, so it shares the host's single React and
 * renders inside the host's providers. It ends by calling
 * `registerModule(manifest)`, the same manifest shape a compiled-in module
 * declares, and from then on the sidebar and the routes treat it like one.
 *
 * Installed once, at boot, before anything renders (main.tsx).
 */

import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as ReactRouterDOM from "react-router-dom";
import * as ReactQuery from "@tanstack/react-query";
import * as ReactHookForm from "react-hook-form";
import * as zod from "zod";
import * as hookformZod from "@hookform/resolvers/zod";
import * as ui from "@erp/ui";
import * as api from "@/lib/api-client";
import { AppShell } from "@/app/AppShell";
import { useNavbarDefaults } from "@/app/useNavbarDefaults";
import { refreshSession, useSession } from "@/app/session";
import { registerRuntimeModule } from "@/modules/registry";
import type { ModuleManifest } from "@/modules/types";

export interface KaabeRuntime {
  /** Bumped when the shape below changes incompatibly. */
  version: 1;
  React: typeof React;
  jsxRuntime: typeof jsxRuntime;
  ReactDOM: typeof ReactDOM;
  ReactDOMClient: typeof ReactDOMClient;
  ReactRouterDOM: typeof ReactRouterDOM;
  ReactQuery: typeof ReactQuery;
  ReactHookForm: typeof ReactHookForm;
  zod: typeof zod;
  hookformZod: typeof hookformZod;
  ui: typeof ui;
  /** The host's API client: envelope handling, JWT refresh, the tenant header. */
  api: typeof api;
  /** The host's shell and session, so a module's pages look and behave like the rest. */
  app: {
    AppShell: typeof AppShell;
    useNavbarDefaults: typeof useNavbarDefaults;
    useSession: typeof useSession;
    refreshSession: typeof refreshSession;
  };
  registerModule: (manifest: ModuleManifest) => ModuleManifest;
}

declare global {
  interface Window {
    KaabeRuntime?: KaabeRuntime;
  }
}

export const runtime: KaabeRuntime = {
  version: 1,
  React,
  jsxRuntime,
  ReactDOM,
  ReactDOMClient,
  ReactRouterDOM,
  ReactQuery,
  ReactHookForm,
  zod,
  hookformZod,
  ui,
  api,
  app: { AppShell, useNavbarDefaults, useSession, refreshSession },
  registerModule: registerRuntimeModule,
};

/** Expose the runtime; safe to call more than once. */
export function installRuntime(): KaabeRuntime {
  if (typeof window !== "undefined") window.KaabeRuntime = runtime;
  return runtime;
}
