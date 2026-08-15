import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@erp/ui": path.resolve(dirname, "./src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
