/**
 * The module kit: how a packaged module's frontend is built.
 *
 * Source lives under `modules/pos/` — the same folder conventions as
 * `apps/erp/src/modules/sales` (manifest, entity folders, pages, api).
 * One IIFE, `dist/module.js`, plus `dist/module.css`. Everything the host
 * SPA provides — React, React Router, React Query, `@erp/ui`, the API
 * client and the app shell — is an external resolved from
 * `window.KaabeRuntime`, so the module shares the host's single React and
 * renders inside the host's providers. Copy this config for a new module
 * and change the entry, the name and nothing else.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** Bare specifier -> the runtime member that stands in for it. */
export const RUNTIME_GLOBALS: Record<string, string> = {
  react: "KaabeRuntime.React",
  "react/jsx-runtime": "KaabeRuntime.jsxRuntime",
  "react-dom": "KaabeRuntime.ReactDOM",
  "react-dom/client": "KaabeRuntime.ReactDOMClient",
  "react-router-dom": "KaabeRuntime.ReactRouterDOM",
  "@tanstack/react-query": "KaabeRuntime.ReactQuery",
  "react-hook-form": "KaabeRuntime.ReactHookForm",
  zod: "KaabeRuntime.zod",
  "@hookform/resolvers/zod": "KaabeRuntime.hookformZod",
  "@erp/ui": "KaabeRuntime.ui",
  "@kaabe/runtime": "KaabeRuntime",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(dirname, "dist"),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(dirname, "modules/pos/index.tsx"),
      name: "KaabeModulePos",
      formats: ["iife"],
      fileName: () => "module.js",
    },
    rollupOptions: {
      external: Object.keys(RUNTIME_GLOBALS),
      output: {
        globals: RUNTIME_GLOBALS,
        assetFileNames: "module.[ext]",
      },
    },
  },
});
