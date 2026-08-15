import { spawnSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status) {
    process.exit(result.status ?? 1);
  }
}

run("npm", ["run", "build", "-w", "@erp/app"]);
run("npm", ["run", "build-storybook", "-w", "@erp/ui"], {
  STORYBOOK_BASE: "/storybook/",
});

const from = resolve("packages/ui/storybook-static");
const to = resolve("apps/erp/dist/storybook");
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });

console.log("Copied Storybook to apps/erp/dist/storybook");
