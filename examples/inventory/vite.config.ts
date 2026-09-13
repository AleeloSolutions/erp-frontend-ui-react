/**
 * Inventory module kit: Vite IIFE for the package zip.
 * Mechanics copied from examples/pos; POS itself is not shipped.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
      entry: path.resolve(dirname, "modules/inventory/index.tsx"),
      name: "KaabeModuleInventory",
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
