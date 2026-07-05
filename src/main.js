import { expansionBlueprints } from "./expansionBlueprints.js";
import { baseStats, characterSpecies, getSpeciesById } from "./characterCreation.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const ui = {
  zoneName: document.getElementById("zoneName"),
  clock: document.getElementById("clock"),
  weather: document.getElementById("weather"),
  hpText: document.getElementById("hpText"),
  spText: document.getElementById("spText"),
  xpText: document.getElementById("xpText"),
  hpBar: document.getElementById("hpBar"),
  spBar: document.getElementById("spBar"),
  xpBar: document.getElementById("xpBar"),
  levelText: document.getElementById("levelText"),
  formText: document.getElementById("formText"),
  moneyText: document.getElementById("moneyText"),
  objectivePanel: document.getElementById("objectivePanel"),
  actionPanel: document.getElementById("actionPanel"),
  log: document.getElementById("log"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  modalActions: document.getElementById("modalActions"),
};

const TILE = 32;
const SAVE_KEY = "dbh-rpg-save-v1";
const keys = new Set();
const pressed = new Set();
const gamepad = {
  index: null,
  previous: new Set(),
  current: new Set(),
  lx: 0,
  ly: 0,
  connected: false,
  name: "",
};

const inputMap = {
  interact: [" ", "Enter", "padA"],
  strike: ["j", "padX"],
  blast: ["k", "padB"],
  guard: ["l", "padLB"],
  form: ["f", "padY"],
  forge: ["m", "padLT"],
  courier: ["n", "padRT"],
  quest: ["q", "padStart"],
  roadmap: ["r"],
  species: ["e", "padLS"],
};

const palette = {
  road: "#5c6975",
  grass: "#2e7d4f",
  forest: "#185238",
  sand: "#a9864a",
  stone: "#747878",
  water: "#236b93",
  lava: "#90352a",
  snow: "#dbe9ef",
  city: "#414c58",
  shrine: "#6f6686",
  wall: "#252d36",
};

class Rng {
  constructor(seed = 123456789, count = 0) {
    this.seed = seed >>> 0;
    this.count = count >>> 0;
  }
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.count++;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(max) {
    return Math.floor(this.next() * max);
  }
  pick(list) {
    return list[this.int(list.length)];
  }
  fork(offset) {
    return new Rng((this.seed + offset + this.count * 1013904223) >>> 0, 0);
  }
  snap() {
    return { seed: this.seed, count: this.count };
  }
}

const objectives = [
  "Wake in Metro Crater",
  "Customize fighter",
  "Complete movement trial",
  "Learn basic strike combo",
  "Learn aura charge",
  "Visit first shop",
  "Help courier recover stolen capsule",
  "Fight alley patrol",
  "Choose first mentor lead",
  "Unlock Dust Barrens gate",
  "Clear rockslide with charged blast",
  "Rescue stranded scavenger",
  "Find first figurine spawn",
  "Win first figurine duel",
  "Locate buried training bell",
  "Defeat Ravik the Glass Fist",
  "Return to Metro Crater",
  "Choose faction contact",
  "Investigate forest disappearances",
  "Survive storm weather event",
  "Learn stealth approach at night",
  "Discover hidden forest mentor",
  "Unlock Flare Form",
  "Defeat Mara Coil",
  "Protect or abandon Mirror Lake convoy",
  "Open Mirror Lake shop district",
  "Complete fishing-focus minigame",
  "Gather shrine seals",
  "Unlock flight license",
  "Complete first flight route",
  "Chase sky raider",
  "Land on Thunder Plateau",
  "Train under lightning weather",
  "Unlock Storm Form",
  "Defeat Thunder Warden",
  "Choose tournament or secret shrine route",
  "Enter midgame tournament bracket",
  "Expose rigged match",
  "Recover forbidden scroll",
  "Unlock Iron Spirit",
  "Break Ashen Badlands siege",
  "Find Null Champion arena",
  "Defeat Null Champion without relying on forms",
  "Complete advanced figurine championship",
  "Unlock Sky Monastery",
  "Pass three mentor trials",
  "Choose whether to seal or use Eclipse technique",
  "Infiltrate Moonfall Citadel",
  "Defeat Crown Engine",
  "Face branch rival",
  "Unlock final route based on faction reputation",
  "Defeat Eclipse Heir",
  "Resolve faction ending",
  "Enter postgame sky rift",
  "Hunt legendary figurine spawns",
];

const forms = {
  Base: { drain: 0, color: "#62d6ff", power: 1 },
  Flare: { drain: 5, color: "#ffd166", power: 1.35 },
  Storm: { drain: 7, color: "#62d6ff", power: 1.55 },
  "Iron Spirit": { drain: 4, color: "#dbe9ef", power: 1.2, guard: 1.6 },
  "Solar Apex": { drain: 11, color: "#fff1a6", power: 2.1 },
  "Eclipse Break": { drain: 13, color: "#b185ff", power: 2.35 },
};

const skillTree = [
  { id: "dash", name: "Flash Step", cost: 1, desc: "Dash farther and spend less spirit." },
  { id: "blast", name: "Focused Blast", cost: 1, desc: "Charged blasts crack heavy terrain." },
  { id: "guard", name: "Iron Guard", cost: 1, desc: "Guard reduces more damage." },
  { id: "loot", name: "Scavenger Sense", cost: 1, desc: "Rare loot glints on the map." },
  { id: "commander", name: "Figurine Commander", cost: 1, desc: "Figurines start with bonus energy." },
  { id: "weather", name: "Storm Reader", cost: 2, desc: "Weather penalties become smaller." },
  { id: "hidden", name: "Quiet Pulse", cost: 2, desc: "Reveals hidden technique shrines." },
  { id: "form", name: "Aura Mastery", cost: 2, desc: "Forms drain slower." },
];

const techniques = [
  { id: "rush", name: "Meteor Rush", key: "1", sp: 10, power: 18, range: 2, objective: 3 },
  { id: "beam", name: "Comet Beam", key: "2", sp: 18, power: 30, range: 6, requires: "blast", objective: 4 },
  { id: "quake", name: "Ground Quake", key: "3", sp: 22, power: 20, range: 3, requires: "guard", area: true },
  { id: "pulse", name: "Quiet Pulse", key: "4", sp: 16, power: 8, range: 5, requires: "hidden", reveal: true },
];

const itemEffects = {
  "Rice Ball": { hp: 32, sp: 6 },
  "Spirit Tea": { hp: 8, sp: 42 },
  "Herb Bundle": { hp: 44, sp: 0 },
  "Weather Charm": { charm: "Weather Charm" },
  "Training Wraps": { gloves: "Training Wraps+", power: 1 },
  "Polished Aura Charm": { charm: "Polished Aura Charm", spMax: 12 },
  "Warm Charm": { charm: "Warm Charm", hpMax: 8 },
  "Forbidden Scroll": { form: "Eclipse Break" },
  "Storm Seal": { form: "Storm" },
  "Hidden Scroll": { skill: "hidden" },
};

const figurineDex = [
  { name: "Crater Kid", type: "Strike", hp: 18, atk: 5 },
  { name: "Bolt Monk", type: "Spirit", hp: 14, atk: 7 },
  { name: "Glass Fist", type: "Trick", hp: 12, atk: 8 },
  { name: "Iron Cook", type: "Guard", hp: 24, atk: 3 },
  { name: "Sky Raider", type: "Blast", hp: 15, atk: 6 },
  { name: "Eclipse Heir", type: "Spirit", hp: 22, atk: 9 },
];

const zones = {
  metro: {
    name: "Metro Crater",
    theme: "city",
    music: "metro",
    size: [42, 32],
    exits: [{ x: 39, y: 16, to: "barrens", tx: 2, ty: 16 }],
    npcs: [
      { id: "mentor", name: "Mira", x: 12, y: 10, role: "mentor", text: "Breathe first. Power listens better when you stop shouting." },
      { id: "shop", name: "Capsule Clerk", x: 18, y: 12, role: "shop", text: "Fresh capsules, clean wraps, and snacks with suspicious labels." },
      { id: "collector", name: "Toma", x: 24, y: 14, role: "figurines", text: "Tiny warriors, big drama. Want to duel?" },
    ],
    enemies: [{ id: "patrol", name: "Alley Patrol", x: 30, y: 17, hp: 28, atk: 5, xp: 12, boss: false }],
    loot: [{ x: 8, y: 17, item: "Rice Ball" }, { x: 27, y: 9, item: "Crater Coin" }],
    destructibles: [{ x: 35, y: 16, hp: 2, kind: "crate" }],
  },
  barrens: {
    name: "Dust Barrens",
    theme: "sand",
    music: "barrens",
    size: [54, 34],
    exits: [{ x: 1, y: 16, to: "metro", tx: 38, ty: 16 }, { x: 51, y: 18, to: "forest", tx: 2, ty: 17 }],
    npcs: [{ id: "scavenger", name: "Kess", x: 15, y: 25, role: "quest", text: "I lost a capsule near the rock gate. I would prefer not to become a fossil today." }],
    enemies: [
      { id: "ravik", name: "Ravik the Glass Fist", x: 43, y: 18, hp: 70, atk: 9, xp: 55, boss: true },
      { id: "bandit-a", name: "Dust Bandit", x: 30, y: 11, hp: 34, atk: 6, xp: 16 },
      { id: "bandit-b", name: "Dust Bandit", x: 24, y: 24, hp: 34, atk: 6, xp: 16 },
    ],
    loot: [{ x: 20, y: 20, item: "Lost Capsule" }, { x: 38, y: 7, item: "Figurine: Glass Fist" }],
    destructibles: [{ x: 36, y: 18, hp: 5, kind: "rock" }, { x: 37, y: 18, hp: 5, kind: "rock" }],
  },
  forest: {
    name: "Green Crown Forest",
    theme: "forest",
    music: "forest",
    size: [48, 36],
    exits: [{ x: 1, y: 17, to: "barrens", tx: 50, ty: 18 }, { x: 45, y: 8, to: "lake", tx: 2, ty: 12 }],
    npcs: [{ id: "hidden-mentor", name: "Vey", x: 31, y: 25, role: "hidden", text: "Quiet feet find loud truths." }],
    enemies: [
      { id: "mara", name: "Mara Coil", x: 38, y: 11, hp: 92, atk: 11, xp: 70, boss: true },
      { id: "stalker", name: "Crown Stalker", x: 25, y: 16, hp: 42, atk: 7, xp: 22 },
    ],
    loot: [{ x: 17, y: 27, item: "Herb Bundle" }, { x: 33, y: 7, item: "Hidden Scroll" }],
    destructibles: [{ x: 20, y: 17, hp: 3, kind: "vine" }],
  },
  lake: {
    name: "Mirror Lake Village",
    theme: "water",
    music: "lake",
    size: [44, 30],
    exits: [{ x: 1, y: 12, to: "forest", tx: 44, ty: 8 }, { x: 40, y: 4, to: "flight", tx: 5, ty: 12 }],
    npcs: [
      { id: "faction", name: "Sera", x: 18, y: 18, role: "branch", text: "The convoy needs a fighter. Protection and ambition rarely walk apart." },
      { id: "food", name: "Lake Cook", x: 22, y: 20, role: "shop", text: "Soup for bruises. Tea for bad decisions." },
    ],
    enemies: [{ id: "raider", name: "Lake Raider", x: 32, y: 10, hp: 48, atk: 8, xp: 28 }],
    loot: [{ x: 28, y: 16, item: "Figurine: Iron Cook" }],
    destructibles: [{ x: 11, y: 19, hp: 3, kind: "barrel" }],
  },
  flight: {
    name: "Sky Route",
    theme: "sky",
    music: "sky",
    flight: true,
    size: [64, 22],
    exits: [{ x: 60, y: 12, to: "plateau", tx: 2, ty: 14 }, { x: 2, y: 12, to: "lake", tx: 39, ty: 4 }],
    npcs: [],
    enemies: [{ id: "sky-raider", name: "Sky Raider", x: 34, y: 8, hp: 52, atk: 9, xp: 35 }],
    loot: [{ x: 45, y: 6, item: "Figurine: Sky Raider" }],
    destructibles: [{ x: 28, y: 12, hp: 4, kind: "storm-mine" }],
  },
  plateau: {
    name: "Thunder Plateau",
    theme: "stone",
    music: "plateau",
    size: [46, 34],
    exits: [{ x: 1, y: 14, to: "flight", tx: 58, ty: 12 }, { x: 43, y: 25, to: "badlands", tx: 2, ty: 22 }],
    npcs: [{ id: "warden-initiate", name: "Rin", x: 18, y: 14, role: "training", text: "Lightning teaches posture quickly." }],
    enemies: [{ id: "warden", name: "Thunder Warden", x: 34, y: 20, hp: 120, atk: 13, xp: 95, boss: true }],
    loot: [{ x: 25, y: 11, item: "Storm Seal" }],
    destructibles: [{ x: 30, y: 20, hp: 6, kind: "pillar" }],
  },
  badlands: {
    name: "Ashen Badlands",
    theme: "lava",
    music: "badlands",
    size: [50, 34],
    exits: [{ x: 1, y: 22, to: "plateau", tx: 42, ty: 25 }, { x: 47, y: 17, to: "citadel", tx: 2, ty: 16 }],
    npcs: [{ id: "null", name: "Null Champion", x: 28, y: 17, role: "boss", text: "No aura. No borrowed thunder. Just you." }],
    enemies: [{ id: "ash-elite", name: "Ash Elite", x: 33, y: 24, hp: 74, atk: 12, xp: 50 }],
    loot: [{ x: 39, y: 12, item: "Forbidden Scroll" }],
    destructibles: [{ x: 22, y: 16, hp: 6, kind: "obsidian" }],
  },
  citadel: {
    name: "Moonfall Citadel",
    theme: "shrine",
    music: "citadel",
    size: [44, 32],
    exits: [{ x: 1, y: 16, to: "badlands", tx: 46, ty: 17 }],
    npcs: [{ id: "rival", name: "Eclipse Heir", x: 31, y: 13, role: "final", text: "Every ending is a form someone could not hold." }],
    enemies: [{ id: "engine", name: "Crown Engine", x: 28, y: 20, hp: 160, atk: 16, xp: 140, boss: true }],
    loot: [{ x: 35, y: 24, item: "Figurine: Eclipse Heir" }],
    destructibles: [{ x: 24, y: 20, hp: 8, kind: "core-shell" }],
  },
};

const state = makeWorld();
applySpeciesToPlayer("terran");
let lastTime = performance.now();
let camera = { x: 0, y: 0 };
let audio = null;
let encounter = null;
let minigame = null;
let weatherTimer = 0;
let autosaveTimer = 0;

function makeWorld(seed = Date.now() >>> 0) {
  return {
    schema: 1,
    rng: new Rng(seed, 0),
    zone: "metro",
    time: { day: 1, minute: 8 * 60 },
    weather: "Clear",
    branch: "Undeclared",
    flags: { activeBlueprint: 1, completedBlueprintStages: [] },
    log: ["Welcome to DBH RPG."],
    completed: new Set(),
    activeObjective: 0,
    player: {
      name: "Rookie",
      speciesId: "terran",
      speciesName: "Terran",
      origin: "Scavenger",
      style: "Striker",
      aura: "#62d6ff",
      x: 10,
      y: 14,
      px: 10 * TILE,
      py: 14 * TILE,
      hp: 100,
      maxHp: 100,
      sp: 80,
      maxSp: 80,
      xp: 0,
      level: 1,
      basePower: 1,
      guardStat: 1,
      speedStat: 1,
      focusStat: 1,
      luckStat: 1,
      xpRate: 1,
      speciesCooldown: 0,
      speciesTimers: {},
      money: 25,
      skillPoints: 0,
      form: "Base",
      forms: ["Base"],
      skills: [],
      inventory: ["Rice Ball"],
      figurines: ["Crater Kid"],
      equipment: { gloves: "Training Wraps", charm: "None" },
    },
    maps: {},
  };
}

function ensureMap(id) {
  if (state.maps[id]) return state.maps[id];
  const zone = zones[id];
  const [w, h] = zone.size;
  const rng = state.rng.fork(hash(id));
  const tiles = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      let t = zone.theme;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) t = "wall";
      if (zone.theme === "city" && (x % 9 === 0 || y % 7 === 0)) t = "road";
      if (zone.theme === "forest" && rng.next() < 0.18) t = "grass";
      if (zone.theme === "sand" && rng.next() < 0.08) t = "stone";
      if (zone.theme === "water" && y < 8 && x > 8) t = "water";
      if (zone.theme === "sky") t = "sky";
      row.push(t);
    }
    tiles.push(row);
  }
  const map = {
    tiles,
    npcs: structuredClone(zone.npcs),
    enemies: structuredClone(zone.enemies).map((e) => ({ ...e, alive: true, maxHp: e.hp, flash: 0 })),
    loot: structuredClone(zone.loot),
    destructibles: structuredClone(zone.destructibles),
  };
  state.maps[id] = map;
  return map;
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

addEventListener("resize", resize);
resize();

addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  if (!keys.has(e.key)) pressed.add(e.key);
  keys.add(e.key);
  unlockAudio();
});

addEventListener("keyup", (e) => {
  keys.delete(e.key);
});

addEventListener("gamepadconnected", (e) => {
  gamepad.index = e.gamepad.index;
  gamepad.connected = true;
  gamepad.name = e.gamepad.id;
  unlockAudio();
  log(`Controller connected: ${e.gamepad.id}`);
});

addEventListener("gamepaddisconnected", (e) => {
  if (gamepad.index === e.gamepad.index) {
    gamepad.index = null;
    gamepad.connected = false;
    gamepad.name = "";
    gamepad.current.clear();
    gamepad.previous.clear();
    log("Controller disconnected.");
  }
});

document.getElementById("newGameBtn").addEventListener("click", () => showCharacterCreator());
document.getElementById("saveBtn").addEventListener("click", saveGame);
document.getElementById("loadBtn").addEventListener("click", loadGame);
document.getElementById("skillsBtn").addEventListener("click", showSkills);
document.getElementById("inventoryBtn").addEventListener("click", showInventory);
document.getElementById("figurinesBtn").addEventListener("click", () => startFigurineBattle("Toma"));
document.getElementById("questBtn").addEventListener("click", showQuestLog);
document.getElementById("blueprintsBtn").addEventListener("click", showExpansionBlueprints);

showCharacterCreator();
requestAnimationFrame(loop);

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  pollGamepad();
  update(dt);
  draw();
  pressed.clear();
  requestAnimationFrame(loop);
}

function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = gamepad.index !== null ? pads[gamepad.index] : [...pads].find(Boolean);
  gamepad.previous = new Set(gamepad.current);
  gamepad.current.clear();
  gamepad.lx = 0;
  gamepad.ly = 0;
  if (!pad) return;
  gamepad.index = pad.index;
  gamepad.connected = true;
  gamepad.name = pad.id;
  const names = ["padA", "padB", "padX", "padY", "padLB", "padRB", "padLT", "padRT", "padBack", "padStart", "padLS", "padRS", "padUp", "padDown", "padLeft", "padRight"];
  pad.buttons.forEach((button, index) => {
    if (button.pressed && names[index]) gamepad.current.add(names[index]);
  });
  const dead = 0.22;
  const lx = pad.axes[0] || 0;
  const ly = pad.axes[1] || 0;
  gamepad.lx = Math.abs(lx) > dead ? lx : 0;
  gamepad.ly = Math.abs(ly) > dead ? ly : 0;
}

function update(dt) {
  if (ui.modal.open && minigame) {
    updateMinigame(dt);
    updateHud();
    return;
  }
  if (ui.modal.open) {
    handleModalInput();
    updateHud();
    return;
  }
  ensureMap(state.zone);
  if (encounter) updateEncounter(dt);
  else if (minigame) updateMinigame(dt);
  else updateExploration(dt);
  updateTime(dt);
  updateHud();
  updateMusic();
}

function updateExploration(dt) {
  const p = state.player;
  const z = zones[state.zone];
  const speed = (z.flight ? 190 : 128) * (p.form === "Flare" ? 1.18 : 1) * p.speedStat * weatherMoveModifier();
  const move = movementVector();
  let dx = move.x;
  let dy = move.y;
  const len = Math.hypot(dx, dy) || 1;
  const oldX = p.px;
  const oldY = p.py;
  p.px += (dx / len) * speed * dt;
  p.py += (dy / len) * speed * dt;
  if (blocked(pixelToTile(p.px), pixelToTile(p.py))) {
    p.px = oldX;
    p.py = oldY;
  }
  p.x = pixelToTile(p.px);
  p.y = pixelToTile(p.py);
  if (dx || dy) {
    maybeFootstep();
    maybeRandomEncounter(dt);
  }
  if (actionPressed("interact")) interact();
  if (actionPressed("strike")) strike();
  if (actionPressed("blast")) blast();
  for (const tech of techniques) if (techPressed(tech)) useTechnique(tech);
  if (actionPressed("form")) cycleForm();
  if (actionPressed("forge")) startAuraForge();
  if (actionPressed("courier")) startSkyCourier();
  if (actionPressed("quest")) showQuestLog();
  if (actionPressed("roadmap")) showExpansionBlueprints();
  if (actionPressed("species")) useSpeciesAbility();
  checkPickups();
  checkExits();
  updateFlightHazards(dt);
  drainForm(dt);
  updateSpeciesPassives(dt);
  autosaveTimer += dt;
  if (autosaveTimer > 30) {
    autosaveTimer = 0;
    persist();
  }
}

function movementVector() {
  let x = gamepad.lx;
  let y = gamepad.ly;
  if (keys.has("ArrowLeft") || keys.has("a") || gamepad.current.has("padLeft")) x -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || gamepad.current.has("padRight")) x += 1;
  if (keys.has("ArrowUp") || keys.has("w") || gamepad.current.has("padUp")) y -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || gamepad.current.has("padDown")) y += 1;
  return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
}

function actionPressed(action) {
  return (inputMap[action] || []).some((code) => pressed.has(code) || (gamepad.current.has(code) && !gamepad.previous.has(code)));
}

function gamepadPressed(code) {
  return gamepad.current.has(code) && !gamepad.previous.has(code);
}

function techPressed(tech) {
  if (pressed.has(tech.key)) return true;
  const index = Number(tech.key);
  if (index === 1) return gamepad.current.has("padRB") && !gamepad.previous.has("padRB");
  if (index === 2) return gamepad.current.has("padLB") && !gamepad.previous.has("padLB");
  if (index === 3) return gamepad.current.has("padBack") && !gamepad.previous.has("padBack");
  if (index === 4) return gamepad.current.has("padRS") && !gamepad.previous.has("padRS");
  return false;
}

function handleModalInput() {
  if (!gamepad.connected) return;
  const buttons = [...ui.modal.querySelectorAll("button:not(:disabled)")];
  if (!buttons.length) return;
  const active = document.activeElement;
  let index = buttons.includes(active) ? buttons.indexOf(active) : 0;
  if (gamepadPressed("padDown") || gamepadPressed("padRight")) {
    index = (index + 1) % buttons.length;
    buttons[index].focus();
  }
  if (gamepadPressed("padUp") || gamepadPressed("padLeft")) {
    index = (index - 1 + buttons.length) % buttons.length;
    buttons[index].focus();
  }
  if (actionPressed("interact")) {
    buttons[index].focus();
    buttons[index].click();
  }
  if (gamepadPressed("padB") && ui.modal.open) ui.modal.close();
}

function pixelToTile(v) {
  return Math.max(0, Math.floor((v + TILE / 2) / TILE));
}

function blocked(x, y) {
  const map = ensureMap(state.zone);
  const t = map.tiles[y]?.[x] || "wall";
  if (["wall", "water"].includes(t) && !zones[state.zone].flight) return true;
  return map.destructibles.some((d) => d.x === x && d.y === y && d.hp > 0);
}

function interact() {
  const map = ensureMap(state.zone);
  const nearNpc = activeNpcs(map).find((n) => dist(n, state.player) < 2);
  if (nearNpc) return talk(nearNpc);
  const nearEnemy = map.enemies.find((e) => e.alive && dist(e, state.player) < 2);
  if (nearEnemy) return startEncounter(nearEnemy);
  const nearBreakable = map.destructibles.find((d) => d.hp > 0 && dist(d, state.player) < 2);
  if (nearBreakable) return damageDestructible(nearBreakable, 1);
  log("No one is close enough.");
}

function talk(npc) {
  sfx("talk");
  log(`${npc.name}: ${npc.text}`);
  if (npc.role === "mentor" || npc.role === "training" || npc.role === "hidden") train(npc);
  if (npc.role === "shop") showShop(npc);
  if (npc.role === "figurines") startFigurineBattle(npc.name);
  if (npc.role === "branch") chooseBranch();
  if (npc.role === "quest") completeObjective(11);
  if (npc.role === "final") completeObjective(49);
  if (npc.role === "hidden") {
    state.flags.foundHiddenMentor = true;
    completeObjective(21);
  }
}

function train(npc) {
  if (state.player.money >= 5) {
    state.player.money -= 5;
    grantXp(12, "training");
    state.player.sp = state.player.maxSp;
    log(`${npc.name} trains you. Spirit restored.`);
    sfx("level");
    completeObjective(3);
    levelCheck();
  }
}

function showShop(npc) {
  const regional = zones[state.zone].theme === "water" ? ["Rice Ball", "Spirit Tea", "Weather Charm", "Figurine: Iron Cook"] : ["Rice Ball", "Spirit Tea", "Training Wraps", "Weather Charm"];
  openModal(npc.name, `<p>${npc.text}</p><div class="grid">
    ${regional.map((item, i) => `<button class="choice" data-buy="${item}" data-cost="${10 + i * 8}">${item}<br><span class="tiny">${10 + i * 8} crater coins</span></button>`).join("")}
  </div>`);
  ui.modalBody.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cost = Number(btn.dataset.cost);
      if (state.player.money < cost) return log("Not enough crater coins.");
      state.player.money -= cost;
      if (btn.dataset.buy.startsWith("Figurine:")) {
        const name = btn.dataset.buy.replace("Figurine: ", "");
        if (!state.player.figurines.includes(name)) state.player.figurines.push(name);
      } else {
        state.player.inventory.push(btn.dataset.buy);
      }
      log(`Bought ${btn.dataset.buy}.`);
      sfx("shop");
      completeObjective(5);
      updateHud();
    });
  });
}

function chooseBranch() {
  openModal("Choose a faction contact", `<div class="grid">
    <button class="choice" data-branch="Ember League">Ember League<br><span class="tiny">Public tournaments and bold power.</span></button>
    <button class="choice" data-branch="Quiet Shrine">Quiet Shrine<br><span class="tiny">Discipline, hidden forms, restraint.</span></button>
    <button class="choice" data-branch="Rift Syndicate">Rift Syndicate<br><span class="tiny">Forbidden shortcuts and risky techniques.</span></button>
  </div>`);
  ui.modalBody.querySelectorAll("[data-branch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.branch = btn.dataset.branch;
      log(`You chose ${state.branch}.`);
      applyBranchBonus();
      completeObjective(17);
      ui.modal.close();
    });
  });
}

function applyBranchBonus() {
  if (state.flags.branchBonusApplied) return;
  state.flags.branchBonusApplied = true;
  if (state.branch === "Ember League") {
    state.player.basePower += 2;
    state.player.inventory.push("Tournament Pass");
  }
  if (state.branch === "Quiet Shrine") {
    if (!state.player.skills.includes("hidden")) state.player.skills.push("hidden");
    state.player.inventory.push("Shrine Seal");
  }
  if (state.branch === "Rift Syndicate") {
    state.player.inventory.push("Forbidden Scroll");
    state.player.maxSp += 10;
  }
}

function strike() {
  const target = nearestEnemy(1.8);
  sfx("swing");
  if (target) hitEnemy(target, 10 * forms[state.player.form].power);
}

function blast() {
  const cost = getCurrentSpecies().id === "bioarc" ? 7 : 8;
  if (state.player.sp < cost) return log("Not enough spirit.");
  state.player.sp -= cost;
  sfx("blast");
  const target = nearestEnemy(5);
  if (target) hitEnemy(target, 16 * forms[state.player.form].power);
  const breakable = ensureMap(state.zone).destructibles.find((d) => d.hp > 0 && dist(d, state.player) < 4);
  if (breakable) damageDestructible(breakable, state.player.skills.includes("blast") ? 3 : 2);
  completeObjective(4);
}

function useTechnique(tech) {
  if (tech.requires && !state.player.skills.includes(tech.requires)) return log(`${tech.name} needs ${skillName(tech.requires)}.`);
  if (state.player.sp < tech.sp) return log("Not enough spirit.");
  state.player.sp -= tech.sp;
  sfx(tech.id === "beam" ? "blast" : "swing");
  const map = ensureMap(state.zone);
  const targets = map.enemies.filter((e) => e.alive && dist(e, state.player) <= tech.range);
  if (targets.length) {
    for (const target of tech.area ? targets : [targets.sort((a, b) => dist(a, state.player) - dist(b, state.player))[0]]) {
      hitEnemy(target, (tech.power + state.player.basePower * 2) * forms[state.player.form].power);
    }
  }
  if (tech.reveal) revealHiddenLoot();
  completeObjective(tech.objective ?? state.activeObjective);
}

function skillName(id) {
  return skillTree.find((s) => s.id === id)?.name || id;
}

function revealHiddenLoot() {
  const map = ensureMap(state.zone);
  if (!map.loot.some((l) => l.item === "Secret Technique Fragment")) {
    map.loot.push({ x: state.player.x + 2, y: state.player.y, item: "Secret Technique Fragment" });
    log("A hidden technique fragment answers your pulse.");
  }
}

function nearestEnemy(range) {
  return ensureMap(state.zone).enemies.filter((e) => e.alive && dist(e, state.player) <= range).sort((a, b) => dist(a, state.player) - dist(b, state.player))[0];
}

function hitEnemy(enemy, dmg) {
  const p = state.player;
  let finalDamage = dmg * weatherDamageModifier();
  if (getCurrentSpecies().id === "starforged" && p.hp / p.maxHp < 0.4) finalDamage *= 1.12;
  if (p.speciesTimers.battleSurge > 0) {
    finalDamage *= 1.35;
    p.speciesTimers.battleSurge = 0;
  }
  enemy.hp -= Math.round(finalDamage);
  enemy.flash = 0.15;
  sfx("hit");
  if (enemy.hp <= 0) defeatEnemy(enemy);
  else if (enemy.boss || state.rng.next() < 0.25) startEncounter(enemy);
}

function defeatEnemy(enemy) {
  enemy.alive = false;
    grantXp(enemy.xp, enemy.boss ? "boss" : "combat");
  state.player.money += enemy.boss ? 40 : 8;
  log(`Defeated ${enemy.name}.`);
  sfx(enemy.boss ? "bossWin" : "pickup");
  if (enemy.id === "patrol") completeObjective(7);
  if (enemy.id === "ravik") {
    completeObjective(15);
    unlockForm("Flare");
  }
  if (enemy.id === "mara") {
    completeObjective(23);
    unlockForm("Storm");
  }
  if (enemy.id === "sky-raider") completeObjective(30);
  if (enemy.id === "warden") {
    completeObjective(34);
    unlockForm("Iron Spirit");
  }
  if (enemy.id === "engine") completeObjective(48);
  levelCheck();
}

function damageDestructible(d, dmg) {
  d.hp -= dmg;
  sfx("break");
  if (d.hp <= 0) {
    log(`Destroyed ${d.kind}.`);
    grantXp(4, "destruction");
    const speciesLoot = getCurrentSpecies().id === "majinite" ? 0.18 : 0;
    if (state.rng.next() < (state.player.skills.includes("loot") ? 0.7 : 0.35) + speciesLoot) {
      const drop = state.rng.pick(["Crater Coin", "Herb Bundle", "Spirit Tea"]);
      ensureMap(state.zone).loot.push({ x: d.x, y: d.y, item: drop });
      log(`${drop} fell out.`);
    }
    completeObjective(10);
    levelCheck();
  }
}

function startEncounter(enemy) {
  encounter = { enemy, turn: 0, timer: 0, boss: enemy.boss };
  sfx(enemy.boss ? "boss" : "encounter");
  log(enemy.boss ? `${enemy.name} challenges you!` : `${enemy.name} attacks!`);
}

function updateEncounter(dt) {
  const e = encounter.enemy;
  encounter.timer += dt;
  if (actionPressed("strike")) hitEnemy(e, 13 * forms[state.player.form].power);
  if (actionPressed("blast")) blast();
  if (actionPressed("guard")) guard();
  if (encounter.timer > 1.2 && e.alive) {
    encounter.timer = 0;
    const guardBoost = (forms[state.player.form].guard || 1) * state.player.guardStat * (state.player.speciesTimers.rootguard > 0 ? 1.8 : 1);
    const dmg = Math.max(1, Math.round(e.atk / guardBoost));
    state.player.hp -= dmg;
    sfx("hurt");
    log(`${e.name} hits for ${dmg}.`);
    if (state.player.hp <= 0) {
      state.player.hp = Math.ceil(state.player.maxHp * 0.45);
      state.player.px -= TILE * 2;
      log("You collapse, then crawl back up. Pride hurts more than ribs.");
      sfx("down");
      encounter = null;
    }
  }
  if (!e.alive) encounter = null;
}

function guard() {
  state.player.sp = Math.min(state.player.maxSp, state.player.sp + (getCurrentSpecies().id === "android" ? 8 : 4));
  sfx("guard");
}

function useSpeciesAbility() {
  const p = state.player;
  const species = getCurrentSpecies();
  if (p.speciesCooldown > 0) return log(`${species.active.name} is cooling down.`);
  if (p.sp < species.active.cost) return log("Not enough spirit.");
  p.sp -= species.active.cost;
  p.speciesCooldown = species.id === "android" ? 5 : 12;
  if (species.id === "terran") {
    p.sp = Math.min(p.maxSp, p.sp + 28);
    p.speciesTimers.focus = 6;
  }
  if (species.id === "starforged") p.speciesTimers.battleSurge = 8;
  if (species.id === "verdant") {
    p.hp = Math.min(p.maxHp, p.hp + 18);
    p.speciesTimers.rootguard = 5;
  }
  if (species.id === "bioarc") {
    const target = nearestEnemy(6);
    if (target) hitEnemy(target, 24 + p.focusStat * 4);
    const breakable = ensureMap(state.zone).destructibles.find((d) => d.hp > 0 && dist(d, p) < 5);
    if (breakable) damageDestructible(breakable, 2);
  }
  if (species.id === "majinite") {
    p.hp = Math.min(p.maxHp, p.hp + 14);
    p.px -= TILE;
  }
  if (species.id === "android") {
    p.sp = Math.min(p.maxSp, p.sp + 24);
    p.speciesCooldown = 4;
  }
  if (species.id === "celestial") p.speciesTimers.noFormDrain = 5;
  log(`${species.name} ability: ${species.active.name}.`);
  sfx("skill");
}

function updateSpeciesPassives(dt) {
  const p = state.player;
  p.speciesCooldown = Math.max(0, p.speciesCooldown - dt);
  for (const key of Object.keys(p.speciesTimers)) p.speciesTimers[key] = Math.max(0, p.speciesTimers[key] - dt);
  if (getCurrentSpecies().id === "verdant" && !encounter && p.hp < p.maxHp) {
    p.hp = Math.min(p.maxHp, p.hp + dt * 1.2);
  }
}

function maybeRandomEncounter(dt) {
  const z = zones[state.zone];
  if (z.name === "Metro Crater" || state.rng.next() > dt * 0.16) return;
  const map = ensureMap(state.zone);
  const living = map.enemies.filter((e) => e.alive && !e.boss);
  const weatherPressure = ["Dust Storm", "Thunderstorm"].includes(state.weather) ? 1.8 : 1;
  const nightPressure = isNight() ? 1.35 : 1;
  if (living.length && state.rng.next() < 0.015 * weatherPressure * nightPressure) startEncounter(state.rng.pick(living));
}

function checkPickups() {
  const map = ensureMap(state.zone);
  const index = map.loot.findIndex((l) => dist(l, state.player) < 1);
  if (index === -1) return;
  const [loot] = map.loot.splice(index, 1);
  if (loot.item.startsWith("Figurine:")) {
    const name = loot.item.replace("Figurine: ", "");
    if (!state.player.figurines.includes(name)) state.player.figurines.push(name);
  } else {
    state.player.inventory.push(loot.item);
  }
  state.player.money += loot.item.includes("Coin") ? 20 : 0;
  log(`Picked up ${loot.item}.`);
  sfx("pickup");
  if (loot.item === "Lost Capsule") completeObjective(6);
  if (loot.item.startsWith("Figurine")) completeObjective(12);
}

function checkExits() {
  const z = zones[state.zone];
  const exit = z.exits.find((ex) => state.player.x === ex.x && state.player.y === ex.y);
  if (!exit) return;
  state.zone = exit.to;
  state.player.px = exit.tx * TILE;
  state.player.py = exit.ty * TILE;
  state.player.x = exit.tx;
  state.player.y = exit.ty;
  sfx("travel");
  log(`Entered ${zones[state.zone].name}.`);
  if (state.zone === "barrens") completeObjective(9);
  if (state.zone === "flight") completeObjective(28);
  if (state.zone === "plateau") completeObjective(31);
}

function updateFlightHazards(dt) {
  if (!zones[state.zone].flight) return;
  const p = state.player;
  p.sp = Math.min(p.maxSp, p.sp + dt * 9);
  const map = ensureMap(state.zone);
  const mine = map.destructibles.find((d) => d.hp > 0 && d.kind === "storm-mine" && dist(d, p) < 2.2);
  if (mine) {
    p.hp -= dt * 10;
    if (state.rng.next() < dt * 4) sfx("hurt");
    if (p.hp <= 0) {
      p.hp = Math.ceil(p.maxHp * 0.4);
      p.px = 5 * TILE;
      p.py = 12 * TILE;
      log("A storm mine throws you back to the route start.");
    }
  }
  if (state.weather === "Wind" && state.rng.next() < dt * 0.4) {
    p.sp = Math.min(p.maxSp, p.sp + 2);
  }
}

function unlockForm(name) {
  if (state.player.forms.includes(name)) return;
  state.player.forms.push(name);
  log(`Unlocked ${name} transformation.`);
  sfx("transform");
  if (name === "Flare") completeObjective(22);
  if (name === "Storm") completeObjective(33);
  if (name === "Iron Spirit") completeObjective(39);
}

function cycleForm() {
  const list = state.player.forms;
  const i = list.indexOf(state.player.form);
  state.player.form = list[(i + 1) % list.length];
  sfx("transform");
}

function drainForm(dt) {
  const form = forms[state.player.form];
  if (!form.drain) {
    state.player.sp = Math.min(state.player.maxSp, state.player.sp + dt * 6);
    return;
  }
  if (state.player.speciesTimers.noFormDrain > 0) return;
  let mastery = state.player.skills.includes("form") ? 0.65 : 1;
  if (getCurrentSpecies().id === "celestial") mastery *= 0.9;
  if (getCurrentSpecies().id === "starforged" && state.player.form === "Flare") mastery *= 0.85;
  state.player.sp -= form.drain * mastery * dt;
  if (state.player.sp <= 0) {
    state.player.sp = 0;
    state.player.form = "Base";
    log("Your transformation drops.");
  }
}

function levelCheck() {
  const p = state.player;
  const needed = xpToNextLevel();
  if (p.xp < needed) return;
  p.xp -= needed;
  p.level++;
  p.skillPoints++;
  const species = getCurrentSpecies();
  p.maxHp += species.growth.hp;
  p.maxSp += species.growth.sp;
  if (p.level % species.growth.powerEvery === 0) p.basePower++;
  p.hp = p.maxHp;
  p.sp = p.maxSp;
  log(`Level up! You are now level ${p.level}.`);
  sfx("level");
}

function grantXp(amount, reason = "general") {
  const species = getCurrentSpecies();
  let multiplier = 1;
  if (species.id === "terran" && reason === "training") multiplier += 0.15;
  if (species.id === "starforged" && reason === "boss") multiplier += 0.2;
  state.player.xp += Math.max(1, Math.round(amount * multiplier));
}

function xpToNextLevel() {
  const rate = getCurrentSpecies().growth.xpRate || 1;
  return Math.max(12, Math.round((state.player.level * 45) / rate));
}

function getCurrentSpecies() {
  ensurePlayerCharacterDefaults();
  return getSpeciesById(state.player.speciesId);
}

function applySpeciesToPlayer(speciesId, resetVitals = true) {
  const species = getSpeciesById(speciesId);
  const p = state.player;
  p.speciesId = species.id;
  p.speciesName = species.name;
  p.maxHp = baseStats.hp + species.stats.hp;
  p.maxSp = baseStats.sp + species.stats.sp;
  p.basePower = Math.max(1, baseStats.power + species.stats.power);
  p.guardStat = Math.max(0.5, baseStats.guard + species.stats.guard * 0.12);
  p.speedStat = Math.max(0.7, baseStats.speed + species.stats.speed * 0.08);
  p.focusStat = Math.max(0.5, baseStats.focus + species.stats.focus * 0.15);
  p.luckStat = Math.max(0.5, baseStats.luck + species.stats.luck * 0.15);
  p.xpRate = species.growth.xpRate;
  p.aura = species.auraBias;
  p.inventory = [...new Set([...p.inventory, ...species.startingItems])];
  if (resetVitals) {
    p.hp = p.maxHp;
    p.sp = p.maxSp;
  }
}

function ensurePlayerCharacterDefaults() {
  const p = state.player;
  p.speciesId ||= "terran";
  p.speciesName ||= getSpeciesById(p.speciesId).name;
  p.guardStat ||= 1;
  p.speedStat ||= 1;
  p.focusStat ||= 1;
  p.luckStat ||= 1;
  p.xpRate ||= getSpeciesById(p.speciesId).growth.xpRate;
  p.speciesCooldown ||= 0;
  p.speciesTimers ||= {};
}

function completeObjective(index) {
  if (state.completed.has(index)) return;
  state.completed.add(index);
  while (state.completed.has(state.activeObjective)) state.activeObjective++;
  log(`Objective complete: ${objectives[index]}`);
  sfx("quest");
}

function updateTime(dt) {
  state.time.minute += dt * 2.5;
  if (state.time.minute >= 1440) {
    state.time.minute -= 1440;
    state.time.day++;
  }
  weatherTimer += dt;
  if (weatherTimer > 40) {
    weatherTimer = 0;
    const table = ["Clear", "Rain", "Wind", "Dust Storm", "Thunderstorm", "Snow"];
    state.weather = state.rng.pick(table);
    log(`Weather changed: ${state.weather}.`);
    sfx(state.weather === "Thunderstorm" ? "boss" : "travel");
    if (state.weather === "Thunderstorm") completeObjective(19);
  }
}

function isNight() {
  const h = Math.floor(state.time.minute / 60);
  return h < 6 || h >= 20;
}

function weatherMoveModifier() {
  if (state.player.skills.includes("weather") || state.player.equipment.charm.includes("Weather")) return 1;
  if (getCurrentSpecies().id === "android" && ["Snow", "Dust Storm"].includes(state.weather)) return 0.96;
  if (state.weather === "Snow") return 0.82;
  if (state.weather === "Dust Storm") return 0.9;
  if (state.weather === "Wind" && zones[state.zone].flight) return 1.12;
  return 1;
}

function weatherDamageModifier() {
  if (state.weather === "Rain" && state.player.form === "Flare") return 0.82;
  if (state.weather === "Thunderstorm" && state.player.form === "Storm") return getCurrentSpecies().id === "bioarc" ? 1.35 : 1.25;
  if (state.weather === "Dust Storm" && state.player.style === "Trickster") return 1.15;
  return 1;
}

function activeNpcs(map) {
  return map.npcs.filter((npc) => {
    if (npc.role === "hidden" && !isNight() && !state.player.skills.includes("hidden")) return false;
    if (npc.role === "shop" && isNight() && state.zone !== "lake") return false;
    return true;
  });
}

function showCharacterCreator() {
  openModal("Create Your Fighter", `<h3>Species</h3><div class="grid">
    ${characterSpecies.map((species) => `<button class="choice" data-species="${species.id}" style="border-color:${species.auraBias}">${species.name}<br><span class="tiny">${species.archetype}<br>HP ${signed(species.stats.hp)} SP ${signed(species.stats.sp)} Power ${signed(species.stats.power)} Speed ${signed(species.stats.speed)} XP x${species.growth.xpRate}<br>${species.active.name}: ${species.active.effect}</span></button>`).join("")}
  </div>
  <h3>Origin</h3><div class="grid">
    ${["Exile", "Prodigy", "Scavenger", "Shrine Student"].map((origin) => `<button class="choice" data-origin="${origin}">${origin}<br><span class="tiny">Origin path</span></button>`).join("")}
  </div>
  <h3>Style</h3>
  <div class="grid">
    ${["Striker", "Blaster", "Guardian", "Trickster"].map((style) => `<button class="choice" data-style="${style}">${style}<br><span class="tiny">Starting combat style</span></button>`).join("")}
  </div>
  <h3>Aura</h3>
  <div class="grid">
    ${["#62d6ff", "#ffd166", "#64e690", "#ff5a66", "#b185ff", "#f4f7fb"].map((color) => `<button class="choice" data-aura="${color}" style="border-color:${color}">Aura<br><span class="tiny">${color}</span></button>`).join("")}
  </div>
  <p class="tiny">Move with WASD/arrows or controller stick/D-pad. Space/A talks. E/LS uses species ability. J/X strikes. K/B blasts. F/Y transforms.</p>`);
  const chosen = { species: state.player.speciesId, origin: state.player.origin, style: state.player.style, aura: state.player.aura };
  ui.modalBody.querySelectorAll("[data-species]").forEach((b) => b.addEventListener("click", () => {
    chosen.species = b.dataset.species;
    applySpeciesToPlayer(chosen.species);
    log(`Species selected: ${getCurrentSpecies().name}.`);
    completeObjective(1);
    updateHud();
  }));
  ui.modalBody.querySelectorAll("[data-origin]").forEach((b) => b.addEventListener("click", () => {
    chosen.origin = b.dataset.origin;
    state.player.origin = chosen.origin;
    completeObjective(1);
  }));
  ui.modalBody.querySelectorAll("[data-style]").forEach((b) => b.addEventListener("click", () => {
    chosen.style = b.dataset.style;
    state.player.style = chosen.style;
  }));
  ui.modalBody.querySelectorAll("[data-aura]").forEach((b) => b.addEventListener("click", () => {
    chosen.aura = b.dataset.aura;
    state.player.aura = chosen.aura;
  }));
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function showSkills() {
  openModal("Skill Tree", `<p>Skill points: ${state.player.skillPoints}</p><div class="grid">
    ${skillTree.map((s) => `<button class="choice" data-skill="${s.id}" ${state.player.skills.includes(s.id) ? "disabled" : ""}>${s.name}<br><span class="tiny">${s.cost} point${s.cost > 1 ? "s" : ""}. ${s.desc}</span></button>`).join("")}
  </div>`);
  ui.modalBody.querySelectorAll("[data-skill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const skill = skillTree.find((s) => s.id === btn.dataset.skill);
      if (state.player.skillPoints < skill.cost) return log("Need more skill points.");
      state.player.skillPoints -= skill.cost;
      state.player.skills.push(skill.id);
      log(`Unlocked ${skill.name}.`);
      sfx("skill");
      ui.modal.close();
    });
  });
}

function showInventory() {
  openModal("Inventory", `<p>Gear: ${state.player.equipment.gloves}, charm ${state.player.equipment.charm}</p><div class="grid">
    ${state.player.inventory.map((item, i) => `<button class="choice" data-use="${i}">${item}<br><span class="tiny">Use item</span></button>`).join("") || "<p>Empty.</p>"}
  </div>`);
  ui.modalBody.querySelectorAll("[data-use]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = state.player.inventory.splice(Number(btn.dataset.use), 1)[0];
      applyItem(item);
      log(`Used ${item}.`);
      sfx("pickup");
      ui.modal.close();
    });
  });
}

function showQuestLog() {
  const done = [...state.completed].sort((a, b) => a - b);
  const next = objectives.slice(state.activeObjective, state.activeObjective + 8);
  openModal("Quest Log", `<p>Branch: ${state.branch}. Completed ${done.length}/${objectives.length} objectives.</p>
    <h3>Current Arc</h3>
    ${next.map((o, i) => `<p>${state.activeObjective + i + 1}. ${o}</p>`).join("")}
    <h3>Completed</h3>
    <p class="tiny">${done.slice(-18).map((i) => objectives[i]).join(" | ") || "None yet"}</p>`);
}

function showExpansionBlueprints() {
  ensureBlueprintFlags();
  const active = expansionBlueprints.find((b) => b.cycle === state.flags.activeBlueprint) || expansionBlueprints[0];
  openModal("Expansion Blueprints", `<p>Active cycle: ${active.cycle}. ${active.title}</p>
    <div class="grid">
      ${expansionBlueprints.map((b) => {
        const count = completedBlueprintStages(b.cycle).length;
        return `<button class="choice" data-blueprint="${b.cycle}">${String(b.cycle).padStart(2, "0")}. ${b.title}<br><span class="tiny">${count}/5 stages. ${b.focus}</span></button>`;
      }).join("")}
    </div>`);
  ui.modalBody.querySelectorAll("[data-blueprint]").forEach((btn) => {
    btn.addEventListener("click", () => showBlueprintDetail(Number(btn.dataset.blueprint)));
  });
}

function showBlueprintDetail(cycle) {
  ensureBlueprintFlags();
  const blueprint = expansionBlueprints.find((b) => b.cycle === cycle) || expansionBlueprints[0];
  state.flags.activeBlueprint = blueprint.cycle;
  const done = completedBlueprintStages(blueprint.cycle);
  openModal(`${String(blueprint.cycle).padStart(2, "0")}. ${blueprint.title}`, `<p>${blueprint.focus}</p>
    <div class="grid">
      ${blueprint.stages.map((stage) => {
        const complete = done.includes(stage.index);
        return `<button class="choice" data-stage="${stage.index}" ${complete ? "disabled" : ""}>Stage ${stage.index}: ${stage.name}<br><span class="tiny">${stage.work}<br>Reward: ${stage.reward}${complete ? " (done)" : ""}</span></button>`;
      }).join("")}
    </div>
    <p class="tiny">Brain query topic: ${blueprint.stages[Math.min(done.length, 4)].query}</p>`);
  ui.modalBody.querySelectorAll("[data-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      completeBlueprintStage(blueprint.cycle, Number(btn.dataset.stage));
      showBlueprintDetail(blueprint.cycle);
    });
  });
}

function completeBlueprintStage(cycle, stageIndex) {
  ensureBlueprintFlags();
  const key = `${cycle}:${stageIndex}`;
  if (state.flags.completedBlueprintStages.includes(key)) return;
  const blueprint = expansionBlueprints.find((b) => b.cycle === cycle);
  const stage = blueprint?.stages.find((s) => s.index === stageIndex);
  if (!stage) return;
  state.flags.completedBlueprintStages.push(key);
  grantXp(10 + cycle + stageIndex, "blueprint");
  state.player.money += 3 + stageIndex;
  state.player.inventory.push(stage.reward);
  log(`Blueprint stage complete: ${blueprint.title} / ${stage.name}.`);
  sfx("quest");
  levelCheck();
  persist();
}

function completedBlueprintStages(cycle) {
  ensureBlueprintFlags();
  return state.flags.completedBlueprintStages
    .filter((key) => key.startsWith(`${cycle}:`))
    .map((key) => Number(key.split(":")[1]));
}

function ensureBlueprintFlags() {
  state.flags ||= {};
  state.flags.activeBlueprint ||= 1;
  state.flags.completedBlueprintStages ||= [];
}

function applyItem(item) {
  const effect = itemEffects[item] || {};
  const itemBoost = getCurrentSpecies().id === "terran" ? 1.1 : 1;
  if (effect.hp) state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.round(effect.hp * itemBoost));
  if (effect.sp) state.player.sp = Math.min(state.player.maxSp, state.player.sp + Math.round(effect.sp * itemBoost));
  if (effect.hpMax) {
    state.player.maxHp += effect.hpMax;
    state.player.hp += effect.hpMax;
  }
  if (effect.spMax) {
    state.player.maxSp += effect.spMax;
    state.player.sp += effect.spMax;
  }
  if (effect.power) state.player.basePower += effect.power;
  if (effect.gloves) state.player.equipment.gloves = effect.gloves;
  if (effect.charm) state.player.equipment.charm = effect.charm;
  if (effect.form) unlockForm(effect.form);
  if (effect.skill && !state.player.skills.includes(effect.skill)) state.player.skills.push(effect.skill);
}

function startFigurineBattle(opponent) {
  const team = state.player.figurines.slice(0, 3).map((name) => ({ ...figurineDex.find((f) => f.name === name), hpNow: figurineDex.find((f) => f.name === name).hp }));
  const enemy = [state.rng.pick(figurineDex), state.rng.pick(figurineDex), state.rng.pick(figurineDex)].map((f) => ({ ...f, hpNow: f.hp }));
  minigame = { type: "figurines", opponent, team, enemy, turn: "player", energy: state.player.skills.includes("commander") ? 4 : 3 };
  sfx("figurine");
  renderFigurineModal();
}

function renderFigurineModal() {
  const g = minigame;
  openModal(`Figurine Tactics vs ${g.opponent}`, `<p>Energy: ${g.energy}. Choose a living figurine to attack.</p>
  <h3>Your Team</h3><div class="grid">${g.team.map((f, i) => `<button class="choice" data-fig="${i}" ${f.hpNow <= 0 ? "disabled" : ""}>${f.name}<br><span class="tiny">${f.type} HP ${f.hpNow}/${f.hp}</span></button>`).join("")}</div>
  <h3>Opponent</h3><div class="grid">${g.enemy.map((f) => `<p>${f.name}<br><span class="tiny">${f.type} HP ${f.hpNow}/${f.hp}</span></p>`).join("")}</div>`);
  ui.modalBody.querySelectorAll("[data-fig]").forEach((btn) => {
    btn.addEventListener("click", () => figurineAttack(Number(btn.dataset.fig)));
  });
}

function figurineAttack(index) {
  const g = minigame;
  const attacker = g.team[index];
  const target = g.enemy.find((f) => f.hpNow > 0);
  if (!target || !attacker || attacker.hpNow <= 0) return;
  target.hpNow -= attacker.atk + g.energy;
  sfx("figurineHit");
  if (!g.enemy.some((f) => f.hpNow > 0)) {
    state.player.money += 22;
    grantXp(18, "figurines");
    completeObjective(13);
    log(`Won figurine duel against ${g.opponent}.`);
    minigame = null;
    ui.modal.close();
    levelCheck();
    return;
  }
  const enemy = g.enemy.find((f) => f.hpNow > 0);
  const defender = g.team.find((f) => f.hpNow > 0);
  defender.hpNow -= enemy.atk;
  if (!g.team.some((f) => f.hpNow > 0)) {
    log("Lost the figurine duel.");
    minigame = null;
    ui.modal.close();
    return;
  }
  renderFigurineModal();
}

function startAuraForge() {
  minigame = { type: "forge", pulse: 0, score: 0, tries: 5 };
  openModal("Aura Forge", `<p>Press Space when the ring is near the bright center. Five tries.</p><canvas id="forgeCanvas" width="320" height="180"></canvas>`);
}

function startSkyCourier() {
  minigame = { type: "courier", x: 30, y: 80, cargo: 100, score: 0, t: 0 };
  openModal("Sky Courier", `<p>Use arrows for altitude lanes. Survive the delivery run.</p><canvas id="courierCanvas" width="420" height="200"></canvas>`);
}

function updateMinigame(dt) {
  if (!minigame) return;
  if (minigame.type === "forge") {
    minigame.pulse += dt * 2.5;
    if (actionPressed("interact")) {
      const accuracy = 1 - Math.abs(Math.sin(minigame.pulse));
      minigame.score += Math.round(accuracy * 20);
      minigame.tries--;
      sfx(accuracy > 0.7 ? "success" : "fail");
      if (minigame.tries <= 0) {
        const reward = minigame.score > 55 ? "Polished Aura Charm" : "Warm Charm";
        state.player.inventory.push(reward);
        completeObjective(26);
        log(`Aura Forge produced ${reward}.`);
        minigame = null;
        ui.modal.close();
      }
    }
    drawForge();
  }
  if (minigame?.type === "courier") {
    minigame.t += dt;
    const move = movementVector();
    if (move.y < 0) minigame.y -= 90 * dt;
    if (move.y > 0) minigame.y += 90 * dt;
    minigame.y = Math.max(20, Math.min(170, minigame.y));
    minigame.cargo -= dt * (state.weather === "Wind" ? 5 : 2);
    minigame.score += dt * 10;
    if (minigame.t > 16 || minigame.cargo <= 0) {
      if (minigame.cargo > 0) {
        state.player.money += 35;
        state.player.inventory.push("Courier Token");
        completeObjective(29);
        log("Sky Courier delivery complete.");
      } else {
        log("The cargo destabilized.");
      }
      minigame = null;
      ui.modal.close();
    }
    drawCourier();
  }
}

function drawForge() {
  const c = document.getElementById("forgeCanvas");
  if (!c) return;
  const g = c.getContext("2d");
  g.fillStyle = "#090d12";
  g.fillRect(0, 0, c.width, c.height);
  const r = 22 + Math.abs(Math.sin(minigame.pulse)) * 92;
  g.strokeStyle = state.player.aura;
  g.lineWidth = 8;
  g.beginPath();
  g.arc(160, 90, r, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#ffd166";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(160, 90, 36, 0, Math.PI * 2);
  g.stroke();
}

function drawCourier() {
  const c = document.getElementById("courierCanvas");
  if (!c) return;
  const g = c.getContext("2d");
  g.fillStyle = "#102435";
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "#bfe7ff" : "#ffffff";
    g.fillRect((i * 70 - minigame.t * 50) % 480, 30 + (i * 37) % 140, 44, 12);
  }
  g.fillStyle = state.player.aura;
  g.fillRect(40, minigame.y, 22, 12);
  g.fillStyle = "#ffd166";
  g.fillText(`Cargo ${Math.round(minigame.cargo)}%`, 12, 18);
}

function openModal(title, html) {
  ui.modalTitle.textContent = title;
  ui.modalBody.innerHTML = html;
  if (!ui.modal.open) ui.modal.showModal();
}

function draw() {
  const p = state.player;
  const z = zones[state.zone];
  const map = ensureMap(state.zone);
  camera.x = clamp(p.px - innerWidth / 2, 0, map.tiles[0].length * TILE - innerWidth);
  camera.y = clamp(p.py - innerHeight / 2, 0, map.tiles.length * TILE - innerHeight);
  drawMap(map, z);
  drawEntities(map);
  drawWeather();
  if (encounter) drawEncounterBanner();
}

function drawMap(map, z) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const sx = Math.floor(camera.x / TILE);
  const sy = Math.floor(camera.y / TILE);
  const ex = sx + Math.ceil(innerWidth / TILE) + 2;
  const ey = sy + Math.ceil(innerHeight / TILE) + 2;
  for (let y = sy; y < ey; y++) {
    for (let x = sx; x < ex; x++) {
      const t = map.tiles[y]?.[x] || "wall";
      ctx.fillStyle = palette[t] || "#5aa9d6";
      ctx.fillRect(x * TILE - camera.x, y * TILE - camera.y, TILE, TILE);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(x * TILE - camera.x, y * TILE - camera.y, TILE, 1);
      ctx.fillRect(x * TILE - camera.x, y * TILE - camera.y, 1, TILE);
      if (z.flight && x % 5 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.24)";
        ctx.fillRect(x * TILE - camera.x, ((y * TILE + state.time.minute) % (map.tiles.length * TILE)) - camera.y, TILE * 2, 4);
      }
    }
  }
}

function drawEntities(map) {
  for (const loot of map.loot) drawDiamond(loot.x, loot.y, loot.item.startsWith("Figurine") ? "#ffd166" : "#64e690");
  for (const d of map.destructibles) if (d.hp > 0) drawBlock(d.x, d.y, d.kind);
  for (const npc of activeNpcs(map)) drawPerson(npc.x, npc.y, npc.role === "hidden" ? "#b185ff" : "#ffd166", npc.name);
  for (const e of map.enemies) if (e.alive) drawEnemy(e);
  drawPlayer();
}

function drawPlayer() {
  const p = state.player;
  const x = p.px - camera.x;
  const y = p.py - camera.y;
  const form = forms[p.form];
  const flying = zones[state.zone].flight;
  const bob = flying ? Math.sin(performance.now() / 130) * 4 : 0;
  if (flying) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 18, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = form.color;
  ctx.lineWidth = p.form === "Base" ? 2 : 5;
  ctx.beginPath();
  ctx.arc(x, y + bob, p.form === "Base" ? 14 : 20 + Math.sin(performance.now() / 90) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f0c49a";
  ctx.fillRect(x - 7, y - 14 + bob, 14, 14);
  ctx.fillStyle = p.aura;
  ctx.fillRect(x - 10, y + bob, 20, 16);
  ctx.fillStyle = "#141820";
  ctx.fillRect(x - 9, y - 18 + bob, 18, 5);
  if (flying) {
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 8 + bob);
    ctx.lineTo(x - 48, y + 18 + bob);
    ctx.moveTo(x + 18, y + 8 + bob);
    ctx.lineTo(x + 48, y + 18 + bob);
    ctx.stroke();
  }
}

function drawEnemy(e) {
  const x = e.x * TILE - camera.x;
  const y = e.y * TILE - camera.y;
  ctx.fillStyle = e.flash > 0 ? "#fff" : e.boss ? "#ff5a66" : "#d96b4f";
  e.flash = Math.max(0, e.flash - 0.016);
  ctx.fillRect(x - 12, y - 12, 24, 24);
  ctx.fillStyle = "#000";
  ctx.fillRect(x - 8, y - 20, 16, 3);
  ctx.fillStyle = "#64e690";
  ctx.fillRect(x - 8, y - 20, 16 * Math.max(0, e.hp / e.maxHp), 3);
  label(e.name, x, y - 26);
}

function drawPerson(tx, ty, color, name) {
  const x = tx * TILE - camera.x;
  const y = ty * TILE - camera.y;
  ctx.fillStyle = color;
  ctx.fillRect(x - 8, y - 14, 16, 24);
  ctx.fillStyle = "#f0c49a";
  ctx.fillRect(x - 6, y - 22, 12, 10);
  label(name, x, y - 28);
}

function drawDiamond(tx, ty, color) {
  const x = tx * TILE - camera.x;
  const y = ty * TILE - camera.y;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x, y + 10);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.fill();
}

function drawBlock(tx, ty, kind) {
  const x = tx * TILE - camera.x;
  const y = ty * TILE - camera.y;
  ctx.fillStyle = kind.includes("rock") || kind.includes("obsidian") ? "#4b5058" : "#7a5637";
  ctx.fillRect(x - 14, y - 14, 28, 28);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.strokeRect(x - 14, y - 14, 28, 28);
}

function label(text, x, y) {
  ctx.font = "11px sans-serif";
  const w = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x - w / 2 - 4, y - 9, w + 8, 13);
  ctx.fillStyle = "#f4f7fb";
  ctx.fillText(text, x - w / 2, y);
}

function drawWeather() {
  if (state.weather === "Clear") return;
  const t = performance.now() / 1000;
  if (state.weather === "Rain" || state.weather === "Thunderstorm") {
    ctx.strokeStyle = "rgba(170,210,255,0.5)";
    for (let i = 0; i < 80; i++) {
      const x = (i * 97 + t * 260) % innerWidth;
      const y = (i * 47 + t * 480) % innerHeight;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y + 18);
      ctx.stroke();
    }
  }
  if (state.weather === "Dust Storm") {
    ctx.fillStyle = "rgba(188,142,80,0.22)";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
  if (state.weather === "Snow") {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 50; i++) ctx.fillRect((i * 53 + t * 30) % innerWidth, (i * 89 + t * 34) % innerHeight, 3, 3);
  }
}

function drawEncounterBanner() {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(innerWidth / 2 - 180, 92, 360, 56);
  ctx.fillStyle = encounter.boss ? "#ff5a66" : "#ffd166";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(encounter.enemy.name, innerWidth / 2, 126);
  ctx.textAlign = "left";
}

function updateHud() {
  ensurePlayerCharacterDefaults();
  const p = state.player;
  const hour = Math.floor(state.time.minute / 60);
  const minute = Math.floor(state.time.minute % 60);
  ui.zoneName.textContent = zones[state.zone].name;
  ui.clock.textContent = `Day ${state.time.day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  ui.weather.textContent = state.weather;
  ui.hpText.textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  ui.spText.textContent = `${Math.ceil(p.sp)}/${p.maxSp}`;
  ui.xpText.textContent = `${p.xp}/${xpToNextLevel()}`;
  ui.hpBar.style.width = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
  ui.spBar.style.width = `${clamp((p.sp / p.maxSp) * 100, 0, 100)}%`;
  ui.xpBar.style.width = `${clamp((p.xp / xpToNextLevel()) * 100, 0, 100)}%`;
  ui.levelText.textContent = `Lv ${p.level} ${p.speciesName || "Terran"} ${p.style}`;
  ui.formText.textContent = p.form;
  ui.moneyText.textContent = `${p.money}c`;
  ensureBlueprintFlags();
  const activeBlueprint = expansionBlueprints.find((b) => b.cycle === state.flags.activeBlueprint) || expansionBlueprints[0];
  ui.objectivePanel.innerHTML = `<h3>Objective ${state.activeObjective + 1}/${objectives.length}</h3><p>${objectives[state.activeObjective] || "Postgame complete"}</p><p>Branch: ${state.branch}. ${isNight() ? "Night routes active." : "Day routes active."}</p><p>Blueprint ${activeBlueprint.cycle}: ${completedBlueprintStages(activeBlueprint.cycle).length}/5 ${activeBlueprint.title}</p>`;
  ui.actionPanel.innerHTML = `<h3>Actions</h3><p>Space/A interact. E/LS ${getCurrentSpecies().active.name}. J/X strike. K/B blast. F/Y form. M/LT forge. N/RT courier. R opens blueprints.</p><p>${techniques.map((t) => `${t.key}: ${t.name}${t.requires && !p.skills.includes(t.requires) ? " (locked)" : ""}`).join(" | ")}</p><p>Controller: ${gamepad.connected ? "connected" : "not connected"}. Weather effects: ${weatherSummary()}</p>`;
  ui.log.innerHTML = `<h3>Log</h3>${state.log.slice(-7).map((l) => `<p>${escapeHtml(l)}</p>`).join("")}`;
}

function weatherSummary() {
  if (state.weather === "Rain") return "rain softens Flare damage";
  if (state.weather === "Thunderstorm") return "storms empower Storm form";
  if (state.weather === "Dust Storm") return "ambush odds rise";
  if (state.weather === "Snow") return "movement slows without protection";
  if (state.weather === "Wind") return "flight routes speed up";
  return "clear conditions";
}

function saveGame() {
  persist();
  log("Saved.");
  sfx("shop");
}

function persist() {
  const serializable = {
    ...state,
    rng: state.rng.snap(),
    completed: [...state.completed],
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(serializable));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return log("No save found.");
  const data = JSON.parse(raw);
  Object.assign(state, data);
  state.rng = new Rng(data.rng.seed, data.rng.count);
  state.completed = new Set(data.completed);
  state.flags ||= {};
  ensureBlueprintFlags();
  ensurePlayerCharacterDefaults();
  log("Loaded.");
  sfx("travel");
}

function log(text) {
  state.log.push(text);
  if (state.log.length > 50) state.log.shift();
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function unlockAudio() {
  if (audio) return;
  const ac = new AudioContext();
  const master = ac.createGain();
  master.gain.value = 0.18;
  master.connect(ac.destination);
  audio = { ac, master, music: null, theme: "" };
}

function tone(freq, dur, type = "sine", gain = 0.12) {
  if (!audio) return;
  const osc = audio.ac.createOscillator();
  const g = audio.ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, audio.ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.ac.currentTime + dur);
  osc.connect(g);
  g.connect(audio.master);
  osc.start();
  osc.stop(audio.ac.currentTime + dur);
}

function sfx(kind) {
  const table = {
    swing: [180, 0.06, "sawtooth"],
    hit: [90, 0.09, "square"],
    hurt: [70, 0.12, "sawtooth"],
    blast: [420, 0.18, "triangle"],
    guard: [220, 0.08, "sine"],
    break: [55, 0.22, "square"],
    pickup: [660, 0.1, "sine"],
    shop: [520, 0.08, "triangle"],
    quest: [740, 0.18, "sine"],
    level: [880, 0.24, "triangle"],
    skill: [990, 0.16, "sine"],
    transform: [130, 0.42, "sawtooth"],
    travel: [300, 0.2, "triangle"],
    talk: [360, 0.05, "sine"],
    encounter: [160, 0.28, "square"],
    boss: [80, 0.6, "sawtooth"],
    bossWin: [1040, 0.4, "triangle"],
    down: [45, 0.5, "sawtooth"],
    figurine: [610, 0.12, "square"],
    figurineHit: [460, 0.09, "square"],
    success: [900, 0.13, "sine"],
    fail: [110, 0.22, "sawtooth"],
  };
  const spec = table[kind] || [440, 0.1, "sine"];
  tone(...spec);
}

function updateMusic() {
  if (!audio) return;
  const theme = encounter?.boss ? "boss" : encounter ? "encounter" : zones[state.zone].music;
  if (audio.theme === theme) return;
  audio.theme = theme;
  if (audio.music) {
    audio.music.osc.stop();
    audio.music.harmony.stop();
    audio.music.gain.disconnect();
  }
  const base = {
    metro: 174,
    barrens: 122,
    forest: 196,
    lake: 247,
    sky: 330,
    plateau: 146,
    badlands: 92,
    citadel: 110,
    encounter: 220,
    boss: 73,
  }[theme] || 180;
  const osc = audio.ac.createOscillator();
  const harmony = audio.ac.createOscillator();
  const gain = audio.ac.createGain();
  osc.type = theme === "boss" ? "sawtooth" : "triangle";
  harmony.type = theme === "encounter" ? "square" : "sine";
  osc.frequency.value = base;
  harmony.frequency.value = base * (theme === "boss" ? 1.5 : 2);
  gain.gain.value = theme === "boss" ? 0.035 : 0.025;
  osc.connect(gain);
  harmony.connect(gain);
  gain.connect(audio.master);
  osc.start();
  harmony.start();
  audio.music = { osc, harmony, gain };
}

let lastFootstep = 0;
function maybeFootstep() {
  const now = performance.now();
  if (now - lastFootstep < 280) return;
  lastFootstep = now;
  sfx("guard");
}
