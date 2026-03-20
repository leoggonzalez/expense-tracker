import { spawnSync } from "node:child_process";

const checks = [
  { label: "ESLint", command: "yarn", args: ["lint:eslint"] },
  { label: "Repo Rules", command: "yarn", args: ["lint:repo"] },
  { label: "TypeScript", command: "yarn", args: ["lint:types"] },
];

let hasFailures = false;

for (const check of checks) {
  console.log(`\n== ${check.label} ==`);

  const result = spawnSync(check.command, check.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exitCode = 1;
}
