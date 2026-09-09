import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      "@erp/ui/fixtures": path.resolve(
        dirname,
        "../../packages/ui/src/fixtures/index.ts"
      ),
      "@erp/ui": path.resolve(dirname, "../../packages/ui/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    // Testing Library unmounts between tests only when afterEach is global.
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
