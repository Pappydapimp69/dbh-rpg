import { spawnSync } from "node:child_process";

run("node", ["--check", "src/main.js"]);
run("node", ["scripts/smoke.mjs"]);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status || 1);
}
