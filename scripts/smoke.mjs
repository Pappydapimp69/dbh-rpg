import { readFileSync, existsSync } from "node:fs";

const requiredFiles = ["index.html", "styles.css", "src/main.js", "BLUEPRINT.md", "README.md"];
const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) fail(`Missing files: ${missing.join(", ")}`);

const main = readFileSync("src/main.js", "utf8");
const expansions = readFileSync("src/expansionBlueprints.js", "utf8");
const blueprint = readFileSync("BLUEPRINT.md", "utf8");

check(/class Rng/.test(main), "deterministic RNG class exists");
check(/snap\(\)\s*{\s*return { seed: this\.seed, count: this\.count }/.test(main), "RNG save snapshot stores seed and count");
check((main.match(/"[^"]+",/g) || []).filter((m) => blueprint.includes(m.slice(1, -2))).length >= 20, "objective text overlaps blueprint");
check((main.match(/const objectives = \[/) && objectiveCount(main) >= 45), "at least 45 objectives are implemented");
check(/Figurine Tactics/.test(main) || /startFigurineBattle/.test(main), "figurine tactics minigame exists");
check(/startAuraForge/.test(main), "aura forge minigame exists");
check(/startSkyCourier/.test(main), "sky courier minigame exists");
check(/function updateFlightHazards/.test(main), "flight hazards exist");
check(/function sfx/.test(main) && /function updateMusic/.test(main), "procedural audio exists");
check(/function saveGame/.test(main) && /function loadGame/.test(main), "save and load exist");
check(/destructibles/.test(main), "destructible environments exist");
check(/weatherDamageModifier/.test(main), "weather combat modifier exists");
check(/addEventListener\("gamepadconnected"/.test(main) && /function pollGamepad/.test(main), "controller support exists");
check((expansions.match(/^  blueprint\(/gm) || []).length === 20, "20 expansion blueprints exist");
check((expansions.match(/\["/g) || []).length === 100, "each expansion blueprint has five stages");
check(/showExpansionBlueprints/.test(main), "expansion blueprint UI exists");

console.log("Smoke checks passed.");

function objectiveCount(source) {
  const block = source.match(/const objectives = \[([\s\S]*?)\];/);
  if (!block) return 0;
  return (block[1].match(/^\s*"/gm) || []).length;
}

function check(condition, message) {
  if (!condition) fail(message);
}

function fail(message) {
  console.error(`Smoke check failed: ${message}`);
  process.exit(1);
}
