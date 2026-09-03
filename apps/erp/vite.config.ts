import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@erp/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        // Keep the ORIGINAL Host header: the backend resolves the tenant
        // from the subdomain (hodan-store.localhost -> Client). Vite 7
        // already accepts *.localhost hosts by default.
        changeOrigin: false,
        secure: false,
      },
      // Uploaded files (e.g. the document-layout logo) come back as URLs
      // on the app's own origin; Django serves them in DEBUG.
      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: false,
        secure: false,
      },
    },
  },
});
