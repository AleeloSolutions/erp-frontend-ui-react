import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: false,
    // Avoid indexer/docgen crashes on forwardRef components (e.g. DatePicker).
    reactDocgen: false,
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    return mergeConfig(config, {
      // Set STORYBOOK_BASE=/storybook/ for the Vercel-hosted static build.
      base: process.env.STORYBOOK_BASE ?? config.base ?? "/",
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          "@erp/ui": path.resolve(dirname, "../src/index.ts"),
        },
      },
    });
  },
};

export default config;
