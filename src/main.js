import { baseStats, characterSpecies, getSpeciesById } from "./characterCreation.js";
import { forms, getFormMasteryRank, nextFormMasteryTarget } from "./formMastery.js";

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
  dodge: ["Shift", "padRT"],
  form: ["f", "padY"],
  forge: ["m", "padLT"],
  quest: ["q", "padStart"],
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
  "Use your first aura blast",
  "Visit first shop",
  "Recover training capsule",
  "Win first sparring encounter",
  "Choose first mentor lead",
  "Unlock Dust Barrens gate",
  "Clear rockslide with charged blast",
  "Rescue stranded scavenger",
  "Recover rare training capsule",
  "Complete Barrens sparring drill",
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
  "Cross first flight route",
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
  "Complete advanced mentor gauntlet",
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
  "Clear legendary rift trials",
];

const questArcs = [
  { name: "Opening Training", start: 0, end: 8, summary: "Learn movement, interaction, combat, shopping, and your first technique." },
  { name: "Dust Barrens", start: 9, end: 17, summary: "Open the first wild route, rescue Kess, and defeat Ravik." },
  { name: "Forest And Lake", start: 18, end: 28, summary: "Track disappearances, unlock Flare, and choose your faction direction." },
  { name: "Flight And Plateau", start: 29, end: 39, summary: "Earn flight routes, master storms, and recover forbidden techniques." },
  { name: "Badlands And Monastery", start: 40, end: 47, summary: "Break the siege, survive form trials, and decide the Eclipse path." },
  { name: "Moonfall Endgame", start: 48, end: 54, summary: "Infiltrate the citadel, face the branch rival, and enter the postgame rift." },
];

const objectiveTargets = {
  9: { zone: "barrens", x: 2, y: 16, label: "Dust Barrens gate", action: "Travel east from Metro Crater." },
  10: { zone: "barrens", x: 36, y: 18, label: "Rockslide gate", action: "Break the rockslide with blasts." },
  11: { zone: "barrens", x: 15, y: 25, label: "Kess", action: "Talk to the stranded scavenger." },
  12: { zone: "barrens", x: 38, y: 7, label: "Rare training capsule", action: "Pick up the training cache." },
  13: { zone: "barrens", x: 30, y: 11, label: "Barrens sparring drill", action: "Defeat a Dust Bandit sparring target." },
  14: { zone: "barrens", x: 22, y: 22, label: "Buried training bell", action: "Search the inner barrens for the buried bell." },
  15: { zone: "barrens", x: 43, y: 18, label: "Ravik", action: "Defeat Ravik the Glass Fist." },
  16: { zone: "metro", x: 39, y: 16, label: "Metro return gate", action: "Return to Metro Crater through the western route." },
  17: { zone: "lake", x: 18, y: 18, label: "Faction contact", action: "Choose a faction contact when the lake route opens." },
  18: { zone: "forest", x: 2, y: 17, label: "Green Crown trail", action: "Travel through Dust Barrens to the forest." },
  19: { zone: "forest", x: 25, y: 16, label: "Storm watch", action: "Keep moving until dangerous weather rolls in." },
  20: { zone: "forest", x: 31, y: 25, label: "Night approach", action: "Wait for night or learn Quiet Pulse routes." },
  21: { zone: "forest", x: 31, y: 25, label: "Hidden mentor", action: "Find Vey at night or with Quiet Pulse." },
  22: { zone: "forest", x: 38, y: 11, label: "Flare Form lead", action: "Pressure Mara Coil to unlock Flare." },
  23: { zone: "forest", x: 38, y: 11, label: "Mara Coil", action: "Defeat Mara Coil." },
  24: { zone: "lake", x: 18, y: 18, label: "Mirror Lake convoy", action: "Reach the convoy choice at Mirror Lake." },
  25: { zone: "lake", x: 22, y: 20, label: "Lake shop district", action: "Talk to the Lake Cook and restock." },
  26: { zone: "lake", x: 22, y: 20, label: "Fishing-focus drill", action: "Use Aura Forge as the focus drill." },
  27: { zone: "lake", x: 28, y: 16, label: "Shrine seal cache", action: "Gather the lake shrine seal." },
  28: { zone: "lake", x: 40, y: 4, label: "Flight launch", action: "Reach Mirror Lake's launch route." },
  29: { zone: "flight", x: 60, y: 12, label: "Sky route crossing", action: "Cross the sky route while avoiding storm mines." },
  30: { zone: "flight", x: 34, y: 8, label: "Sky Raider", action: "Chase and defeat the Sky Raider." },
  31: { zone: "plateau", x: 2, y: 14, label: "Thunder Plateau", action: "Complete the sky route." },
  32: { zone: "plateau", x: 18, y: 14, label: "Lightning mentor", action: "Train with Rin during harsh weather." },
  33: { zone: "plateau", x: 25, y: 11, label: "Storm Seal", action: "Recover the Storm Seal." },
  34: { zone: "plateau", x: 34, y: 20, label: "Thunder Warden", action: "Defeat the Thunder Warden." },
  35: { zone: "lake", x: 18, y: 18, label: "Route choice", action: "Return to faction contacts and choose a path." },
  36: { zone: "lake", x: 18, y: 18, label: "Tournament bracket", action: "Use your faction lead to enter the bracket." },
  37: { zone: "lake", x: 18, y: 18, label: "Rigged match lead", action: "Follow faction clues around Mirror Lake." },
  38: { zone: "badlands", x: 39, y: 12, label: "Forbidden scroll", action: "Recover the forbidden scroll in Ashen Badlands." },
  39: { zone: "plateau", x: 34, y: 20, label: "Iron Spirit trial", action: "Break the Warden's pressure and unlock Iron Spirit." },
  40: { zone: "badlands", x: 2, y: 22, label: "Ashen Badlands", action: "Push beyond Thunder Plateau." },
  41: { zone: "badlands", x: 28, y: 17, label: "Null arena", action: "Find the Null Champion arena." },
  42: { zone: "badlands", x: 28, y: 17, label: "Null Champion", action: "Defeat the Null Champion without leaning on forms." },
  43: { zone: "badlands", x: 33, y: 24, label: "Mentor gauntlet", action: "Clear the advanced sparring gauntlet." },
  44: { zone: "plateau", x: 43, y: 25, label: "Sky Monastery route", action: "Unlock the monastery path beyond the plateau." },
  45: { zone: "plateau", x: 18, y: 14, label: "Mentor trials", action: "Pass three mentor trials." },
  46: { zone: "badlands", x: 39, y: 12, label: "Eclipse choice", action: "Decide whether to seal or use Eclipse technique." },
  47: { zone: "citadel", x: 2, y: 16, label: "Moonfall Citadel", action: "Enter the final route." },
  48: { zone: "citadel", x: 28, y: 20, label: "Crown Engine", action: "Infiltrate and reach the citadel core." },
  49: { zone: "citadel", x: 28, y: 20, label: "Crown Engine", action: "Defeat the Crown Engine." },
  50: { zone: "citadel", x: 31, y: 13, label: "Final route seal", action: "Resolve your faction reputation route." },
  51: { zone: "citadel", x: 31, y: 13, label: "Eclipse Heir", action: "Defeat the Eclipse Heir." },
  52: { zone: "citadel", x: 31, y: 13, label: "Eclipse Heir", action: "Face the branch rival." },
  53: { zone: "citadel", x: 35, y: 24, label: "Sky rift", action: "Enter the postgame sky rift." },
  54: { zone: "citadel", x: 35, y: 24, label: "Legendary rift trials", action: "Clear the legendary rift trials." },
};

const codex = {
  factions: [
    { name: "Ember League", note: "Public tournaments, visible strength, and civic protection through spectacle." },
    { name: "Quiet Shrine", note: "Discipline, hidden forms, restraint, and training traditions older than Metro Crater." },
    { name: "Rift Syndicate", note: "Forbidden shortcuts, unstable techniques, and power borrowed before it is understood." },
  ],
  regions: [
    { name: "Metro Crater", note: "A rebuilt impact city where shops, mentors, and first rivals gather." },
    { name: "Dust Barrens", note: "Glass-scarred wasteland routes hiding capsules, sparring drills, and Ravik's challenge." },
    { name: "Green Crown Forest", note: "A night-sensitive forest where hidden mentors test quiet movement." },
    { name: "Mirror Lake Village", note: "A reflective trade hub where faction choices begin to matter." },
    { name: "Thunder Plateau", note: "Storm training grounds for lightning weather, flight routes, and Storm form." },
    { name: "Moonfall Citadel", note: "The final pressure point where branch reputation and Eclipse choices converge." },
  ],
  techniques: [
    { name: "Meteor Rush", note: "A close pressure technique for learning strike rhythm." },
    { name: "Comet Beam", note: "A focused ranged blast path that cracks heavy routes." },
    { name: "Ground Quake", note: "A guard-oriented area technique for crowded fights." },
    { name: "Quiet Pulse", note: "A perception technique that reveals hidden shrines and mentors." },
  ],
  bosses: [
    { name: "Ravik the Glass Fist", note: "A counter lesson wrapped in an early Barrens rivalry." },
    { name: "Mara Coil", note: "A forest ambusher whose defeat opens the road toward Flare mastery." },
    { name: "Thunder Warden", note: "A storm trial that teaches weather pressure and Storm form." },
    { name: "Crown Engine", note: "A destructible citadel core that turns arena damage into story stakes." },
    { name: "Eclipse Heir", note: "A branch rival testing whether borrowed power can become an ending." },
  ],
};

const skillTree = [
  { id: "dash", name: "Flash Step", cost: 1, desc: "Dash farther and spend less spirit." },
  { id: "blast", name: "Focused Blast", cost: 1, desc: "Charged blasts crack heavy terrain." },
  { id: "guard", name: "Iron Guard", cost: 1, desc: "Guard reduces more damage." },
  { id: "loot", name: "Scavenger Sense", cost: 1, desc: "Rare loot glints on the map." },
  { id: "sparring", name: "Sparring Focus", cost: 1, desc: "Training and sparring rewards grant a small bonus." },
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
  "Training Capsule": { hp: 18, sp: 18 },
  "Weather Charm": { charm: "Weather Charm" },
  "Training Wraps": { gloves: "Training Wraps+", power: 1 },
  "Polished Aura Charm": { charm: "Polished Aura Charm", spMax: 12 },
  "Warm Charm": { charm: "Warm Charm", hpMax: 8 },
  "Forbidden Scroll": { form: "Eclipse Break" },
  "Storm Seal": { form: "Storm" },
  "Hidden Scroll": { skill: "hidden" },
};

const openingArcDefaults = {
  started: false,
  metMira: false,
  moved: false,
  movementPixels: 0,
  crateBroken: false,
  capsuleFound: false,
  shopVisited: false,
  droneDefeated: false,
  starterChosen: "",
  bossSpawned: false,
  bossDefeated: false,
  saved: false,
  complete: false,
};

const starterTechniques = [
  { skill: "dash", name: "Flash Step", desc: "A fast reposition that makes exploration and dodging feel sharper." },
  { skill: "blast", name: "Focused Blast", desc: "A stronger aura blast path that cracks heavier terrain." },
  { skill: "guard", name: "Iron Guard", desc: "A steadier defensive path for surviving boss pressure." },
];

const combatStatsDefaults = {
  bestCombo: 0,
  perfectGuards: 0,
  cleanDodges: 0,
  flowBonuses: 0,
};

const zones = {
  metro: {
    name: "Metro Crater",
    landmark: "Crater Clocktower",
    theme: "city",
    music: "metro",
    size: [42, 32],
    exits: [{ x: 39, y: 16, to: "barrens", tx: 2, ty: 16 }],
    npcs: [
      { id: "mentor", name: "Mira", x: 12, y: 10, role: "mentor", text: "Breathe first. Power listens better when you stop shouting." },
      { id: "shop", name: "Capsule Clerk", x: 18, y: 12, role: "shop", text: "Fresh capsules, clean wraps, and snacks with suspicious labels." },
      { id: "sparring-coach", name: "Toma", x: 24, y: 14, role: "training", text: "Footwork first. If your stance is wrong, your aura is just noise." },
    ],
    enemies: [
      { id: "sparring-drone", name: "Sparring Drone", x: 15, y: 13, hp: 30, atk: 3, xp: 32, boss: false },
      { id: "patrol", name: "Alley Patrol", x: 30, y: 17, hp: 28, atk: 5, xp: 12, boss: false },
    ],
    loot: [{ x: 8, y: 17, item: "Rice Ball" }, { x: 13, y: 14, item: "Training Capsule" }, { x: 27, y: 9, item: "Crater Coin" }],
    destructibles: [{ x: 12, y: 14, hp: 2, kind: "training-crate" }, { x: 35, y: 16, hp: 2, kind: "crate" }],
  },
  barrens: {
    name: "Dust Barrens",
    landmark: "Glass Rock Gate",
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
    loot: [{ x: 20, y: 20, item: "Lost Capsule" }, { x: 38, y: 7, item: "Rare Training Capsule" }],
    destructibles: [{ x: 36, y: 18, hp: 5, kind: "rock" }, { x: 37, y: 18, hp: 5, kind: "rock" }],
  },
  forest: {
    name: "Green Crown Forest",
    landmark: "Crownroot Hollow",
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
    landmark: "Silver Dock",
    theme: "water",
    music: "lake",
    size: [44, 30],
    exits: [{ x: 1, y: 12, to: "forest", tx: 44, ty: 8 }, { x: 40, y: 4, to: "flight", tx: 5, ty: 12 }],
    npcs: [
      { id: "faction", name: "Sera", x: 18, y: 18, role: "branch", text: "The convoy needs a fighter. Protection and ambition rarely walk apart." },
      { id: "food", name: "Lake Cook", x: 22, y: 20, role: "shop", text: "Soup for bruises. Tea for bad decisions." },
    ],
    enemies: [{ id: "raider", name: "Lake Raider", x: 32, y: 10, hp: 48, atk: 8, xp: 28 }],
    loot: [{ x: 28, y: 16, item: "Spirit Tea" }],
    destructibles: [{ x: 11, y: 19, hp: 3, kind: "barrel" }],
  },
  flight: {
    name: "Sky Route",
    landmark: "Highwind Lane",
    theme: "sky",
    music: "sky",
    flight: true,
    size: [64, 22],
    exits: [{ x: 60, y: 12, to: "plateau", tx: 2, ty: 14 }, { x: 2, y: 12, to: "lake", tx: 39, ty: 4 }],
    npcs: [],
    enemies: [{ id: "sky-raider", name: "Sky Raider", x: 34, y: 8, hp: 52, atk: 9, xp: 35 }],
    loot: [{ x: 45, y: 6, item: "Training Capsule" }],
    destructibles: [{ x: 28, y: 12, hp: 4, kind: "storm-mine" }],
  },
  plateau: {
    name: "Thunder Plateau",
    landmark: "Stormneedle Tower",
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
    landmark: "Obsidian Breach",
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
    landmark: "Eclipse Gate",
    theme: "shrine",
    music: "citadel",
    size: [44, 32],
    exits: [{ x: 1, y: 16, to: "badlands", tx: 46, ty: 17 }],
    npcs: [{ id: "rival", name: "Eclipse Heir", x: 31, y: 13, role: "final", text: "Every ending is a form someone could not hold." }],
    enemies: [{ id: "engine", name: "Crown Engine", x: 28, y: 20, hp: 160, atk: 16, xp: 140, boss: true }],
    loot: [{ x: 35, y: 24, item: "Polished Aura Charm" }],
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
let floaters = [];
let screenShake = 0;

function makeWorld(seed = Date.now() >>> 0) {
  return {
    schema: 1,
    rng: new Rng(seed, 0),
    zone: "metro",
    time: { day: 1, minute: 8 * 60 },
    weather: "Clear",
    audioSettings: { master: 0.18, music: 0.55, sfx: 0.9, weather: 0.55 },
    branch: "Undeclared",
    flags: {
      openingArc: {
        started: false,
        metMira: false,
        moved: false,
        movementPixels: 0,
        crateBroken: false,
        capsuleFound: false,
        shopVisited: false,
        droneDefeated: false,
        starterChosen: "",
        bossSpawned: false,
        bossDefeated: false,
        saved: false,
        complete: false,
      },
      pendingStarterChoice: false,
      pendingOpeningCompleteModal: false,
      combatStats: {
        bestCombo: 0,
        perfectGuards: 0,
        cleanDodges: 0,
        flowBonuses: 0,
      },
    },
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
      formMastery: { Base: 0 },
      skills: [],
      inventory: ["Rice Ball"],
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

document.getElementById("newGameBtn").addEventListener("click", startNewGame);
document.getElementById("saveBtn").addEventListener("click", saveGame);
document.getElementById("loadBtn").addEventListener("click", loadGame);
document.getElementById("exportBtn").addEventListener("click", showExportSave);
document.getElementById("importBtn").addEventListener("click", showImportSave);
document.getElementById("skillsBtn").addEventListener("click", showSkills);
document.getElementById("formsBtn").addEventListener("click", showForms);
document.getElementById("audioBtn").addEventListener("click", showAudioSettings);
document.getElementById("inventoryBtn").addEventListener("click", showInventory);
document.getElementById("questBtn").addEventListener("click", showQuestLog);
document.getElementById("codexBtn").addEventListener("click", showCodex);

showStartScreen();
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
  updateOpeningArc(dt);
  updateFloaters(dt);
  updateScreenEffects(dt);
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
  trackOpeningMovement(Math.hypot(p.px - oldX, p.py - oldY));
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
  if (actionPressed("quest")) showQuestLog();
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

function trackOpeningMovement(distancePixels) {
  ensureOpeningArcFlags();
  const arc = state.flags.openingArc;
  if (!arc.started || arc.moved || state.zone !== "metro" || distancePixels <= 0) return;
  arc.movementPixels += distancePixels;
  if (arc.movementPixels >= TILE * 2.5) {
    arc.moved = true;
    completeObjective(2);
    log("Movement trial complete. Mira watches your footwork.");
    sfx("success");
  }
}

function updateOpeningArc() {
  ensureOpeningArcFlags();
  const arc = state.flags.openingArc;
  if (arc.starterChosen && !arc.bossSpawned && !arc.bossDefeated) spawnOpeningBoss();
  if (state.flags.pendingStarterChoice && !ui.modal.open && !encounter && !minigame) showStarterTechniqueChoice();
  if (state.flags.pendingOpeningCompleteModal && !ui.modal.open && !encounter && !minigame) showOpeningCompleteModal();
}

function openingArcLine() {
  ensureOpeningArcFlags();
  const arc = state.flags.openingArc;
  if (!arc.started) return "Opening Arc: create a fighter, then begin training.";
  if (!arc.moved) return "Opening Arc: move through the yard toward Mira.";
  if (!arc.metMira) return "Opening Arc: talk with Mira for your first lesson.";
  if (!arc.crateBroken) return "Opening Arc: break the training crate with an aura blast.";
  if (!arc.capsuleFound) return "Opening Arc: pick up the training capsule.";
  if (!arc.shopVisited) return "Opening Arc: buy one supply from the Capsule Clerk.";
  if (!arc.droneDefeated) return "Opening Arc: defeat the Sparring Drone.";
  if (!arc.starterChosen) return "Opening Arc: choose your starter technique.";
  if (!arc.bossDefeated) return "Opening Arc: defeat Mira's Trial Echo.";
  if (!arc.saved) return "Opening Arc: saving your training result.";
  return "Opening Arc complete: the Dust Barrens gate is open.";
}

function openingArcTarget() {
  ensureOpeningArcFlags();
  const arc = state.flags.openingArc;
  const map = ensureMap(state.zone);
  if (state.zone !== "metro") return null;
  if (!arc.started || !arc.moved || !arc.metMira) return activeNpcs(map).find((n) => n.id === "mentor");
  if (!arc.crateBroken) return map.destructibles.find((d) => d.kind === "training-crate" && d.hp > 0);
  if (!arc.capsuleFound) return map.loot.find((l) => l.item === "Training Capsule");
  if (!arc.shopVisited) return activeNpcs(map).find((n) => n.id === "shop");
  if (!arc.droneDefeated) return map.enemies.find((e) => e.id === "sparring-drone" && e.alive);
  if (!arc.starterChosen) return activeNpcs(map).find((n) => n.id === "mentor");
  if (!arc.bossDefeated) return map.enemies.find((e) => e.id === "mira-trial" && e.alive);
  return zones.metro.exits[0];
}

function currentQuestArc() {
  return questArcs.find((arc) => state.activeObjective >= arc.start && state.activeObjective <= arc.end) || questArcs[questArcs.length - 1];
}

function currentQuestTarget() {
  const openingTarget = openingArcTarget();
  if (openingTarget) {
    return {
      zone: state.zone,
      x: openingTarget.x,
      y: openingTarget.y,
      label: openingTarget.name || openingTarget.kind || openingTarget.item || "Training target",
      action: openingArcLine().replace("Opening Arc: ", ""),
    };
  }
  const target = objectiveTargets[state.activeObjective];
  if (target) return target;
  const arc = currentQuestArc();
  return {
    zone: state.zone,
    x: state.player.x,
    y: state.player.y,
    label: arc.name,
    action: arc.summary,
  };
}

function currentQuestWaypoint() {
  const target = currentQuestTarget();
  if (!target || target.zone === state.zone) return target;
  const nextZone = nextZoneToward(target.zone);
  const exit = zones[state.zone].exits.find((entry) => entry.to === nextZone) || zones[state.zone].exits[0];
  if (!exit) return target;
  return {
    ...target,
    zone: state.zone,
    x: exit.x,
    y: exit.y,
    label: `Route to ${zones[target.zone]?.name || target.zone}`,
    action: `Take the ${zones[nextZone]?.name || nextZone} route toward ${target.label}.`,
    finalTarget: target,
  };
}

function nextZoneToward(targetZone) {
  if (targetZone === state.zone) return state.zone;
  const queue = [{ zone: state.zone, path: [] }];
  const seen = new Set([state.zone]);
  while (queue.length) {
    const current = queue.shift();
    for (const exit of zones[current.zone].exits || []) {
      if (seen.has(exit.to)) continue;
      const path = [...current.path, exit.to];
      if (exit.to === targetZone) return path[0];
      seen.add(exit.to);
      queue.push({ zone: exit.to, path });
    }
  }
  return zones[state.zone].exits[0]?.to || state.zone;
}

function questCompassLine() {
  const target = currentQuestTarget();
  const waypoint = currentQuestWaypoint();
  const arc = currentQuestArc();
  if (target.zone !== state.zone) {
    const steps = Math.round(Math.hypot(waypoint.x - state.player.x, waypoint.y - state.player.y));
    return `Compass: ${waypoint.label}, ${steps} tile${steps === 1 ? "" : "s"} away. ${waypoint.action} Arc: ${arc.name}.`;
  }
  const steps = Math.round(Math.hypot(target.x - state.player.x, target.y - state.player.y));
  return `Compass: ${target.label}, ${steps} tile${steps === 1 ? "" : "s"} away. ${target.action} Arc: ${arc.name}.`;
}

function finalRouteStatus() {
  if (state.branch === "Undeclared") return "Final route: choose a faction before Moonfall.";
  const rep = state.flags.factionReputation?.[state.branch] || 0;
  const engine = state.flags.bossOutcomes?.engine ? "Crown Engine outcome recorded" : "Crown Engine unresolved";
  return `Final route: ${state.branch} reputation ${rep}. ${engine}.`;
}

function spawnOpeningBoss() {
  const map = ensureMap("metro");
  const arc = state.flags.openingArc;
  if (map.enemies.some((e) => e.id === "mira-trial")) {
    arc.bossSpawned = true;
    return;
  }
  map.enemies.push({ id: "mira-trial", name: "Mira's Trial Echo", x: 21, y: 12, hp: 58, maxHp: 58, atk: 5, xp: 36, boss: true, alive: true, flash: 0 });
  arc.bossSpawned = true;
  log("Mira's Trial Echo steps into the yard.");
  sfx("boss");
}

function showStarterTechniqueChoice() {
  ensureOpeningArcFlags();
  openModal("Choose Starter Technique", `<p>You earned a first growth choice. Pick the path your fighter starts building around.</p>
    <div class="grid">
      ${starterTechniques.map((tech) => `<button class="choice" type="button" data-starter="${tech.skill}">${tech.name}<br><span class="tiny">${tech.desc}</span></button>`).join("")}
    </div>`);
  ui.modalBody.querySelectorAll("[data-starter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tech = starterTechniques.find((entry) => entry.skill === btn.dataset.starter);
      if (!tech) return;
      if (!state.player.skills.includes(tech.skill)) state.player.skills.push(tech.skill);
      if (state.player.skillPoints > 0) state.player.skillPoints--;
      state.flags.openingArc.starterChosen = tech.skill;
      state.flags.pendingStarterChoice = false;
      completeObjective(8);
      log(`Starter technique chosen: ${tech.name}.`);
      sfx("skill");
      spawnOpeningBoss();
      persist();
      ui.modal.close();
    });
  });
}

function showOpeningCompleteModal() {
  state.flags.pendingOpeningCompleteModal = false;
  openModal("Training Complete", `<p>Mira nods toward the east gate. Your first save is written, and the Dust Barrens route is open.</p>
    <div class="grid">
      <button class="choice" type="button" data-open-skills="true">Review Skills<br><span class="tiny">Spend any remaining point before leaving.</span></button>
      <button class="choice" type="button" data-close-training="true">Head Out<br><span class="tiny">Return to the yard.</span></button>
    </div>`);
  ui.modalBody.querySelector("[data-open-skills]").addEventListener("click", showSkills);
  ui.modalBody.querySelector("[data-close-training]").addEventListener("click", () => ui.modal.close());
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

function getInteractionHint() {
  const map = ensureMap(state.zone);
  const nearNpc = activeNpcs(map).find((n) => dist(n, state.player) < 2);
  if (nearNpc) return `Talk: ${nearNpc.name}`;
  const nearEnemy = map.enemies.find((e) => e.alive && dist(e, state.player) < 2);
  if (nearEnemy) return `Engage: ${nearEnemy.name}`;
  const nearBreakable = map.destructibles.find((d) => d.hp > 0 && dist(d, state.player) < 2);
  if (nearBreakable) return `Break: ${nearBreakable.kind}`;
  const nearLoot = map.loot.find((l) => dist(l, state.player) < 1.4);
  if (nearLoot) return `Pick up: ${nearLoot.item}`;
  return "Explore";
}

function talk(npc) {
  sfx("talk");
  log(`${npc.name}: ${npc.text}`);
  if (npc.id === "mentor") {
    ensureOpeningArcFlags();
    state.flags.openingArc.metMira = true;
  }
  if (npc.role === "mentor" || npc.role === "training" || npc.role === "hidden") train(npc);
  if (npc.role === "shop") showShop(npc);
  if (npc.role === "branch") chooseBranch();
  if (npc.role === "quest") completeObjective(11);
  if (npc.role === "final") completeObjective(49);
  if (npc.role === "hidden") {
    state.flags.foundHiddenMentor = true;
    completeObjective(21);
  }
}

function train(npc) {
  ensureOpeningArcFlags();
  const firstMiraLesson = npc.id === "mentor" && !state.flags.openingArc.firstMiraLesson;
  const cost = firstMiraLesson ? 0 : 5;
  if (state.player.money < cost) return log("Need 5 crater coins for more training.");
  state.player.money -= cost;
  state.flags.openingArc.firstMiraLesson ||= firstMiraLesson;
  grantXp(firstMiraLesson ? 16 : 12, "training");
  applyWeatherTrainingBonus(npc);
  state.player.sp = state.player.maxSp;
  log(firstMiraLesson ? "Mira teaches a clean strike rhythm. Spirit restored." : `${npc.name} trains you. Spirit restored.`);
  sfx("level");
  completeObjective(3);
  levelCheck();
}

function applyWeatherTrainingBonus(npc) {
  if (!["Thunderstorm", "Dust Storm", "Snow", "Rain"].includes(state.weather)) return;
  const bonus = state.weather === "Thunderstorm" ? 12 : 6;
  grantXp(bonus, "training");
  if (state.player.form !== "Base") gainFormMastery(bonus * 0.35, "weather training");
  log(`${npc.name} turns ${state.weather} into training pressure. +${bonus} XP.`);
  if (state.weather === "Thunderstorm") completeObjective(32);
}

function showShop(npc) {
  const regional = zones[state.zone].theme === "water" ? ["Rice Ball", "Spirit Tea", "Weather Charm", "Training Capsule"] : ["Rice Ball", "Spirit Tea", "Training Wraps", "Weather Charm"];
  openModal(npc.name, `<p>${npc.text}</p><div class="grid">
    ${regional.map((item, i) => `<button class="choice" data-buy="${item}" data-cost="${10 + i * 8}">${item}<br><span class="tiny">${10 + i * 8} crater coins</span></button>`).join("")}
  </div>`);
  ui.modalBody.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cost = Number(btn.dataset.cost);
      if (state.player.money < cost) return log("Not enough crater coins.");
      state.player.money -= cost;
      state.player.inventory.push(btn.dataset.buy);
      log(`Bought ${btn.dataset.buy}.`);
      sfx("shop");
      ensureOpeningArcFlags();
      if (state.zone === "metro") state.flags.openingArc.shopVisited = true;
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
  state.flags.factionReputation ||= { "Ember League": 0, "Quiet Shrine": 0, "Rift Syndicate": 0 };
  if (state.branch === "Ember League") {
    state.player.basePower += 2;
    state.player.inventory.push("Tournament Pass");
    state.flags.factionReputation[state.branch] += 2;
  }
  if (state.branch === "Quiet Shrine") {
    if (!state.player.skills.includes("hidden")) state.player.skills.push("hidden");
    state.player.inventory.push("Shrine Seal");
    state.flags.factionReputation[state.branch] += 2;
  }
  if (state.branch === "Rift Syndicate") {
    state.player.inventory.push("Forbidden Scroll");
    state.player.maxSp += 10;
    state.flags.factionReputation[state.branch] += 2;
  }
}

function strike() {
  const target = nearestEnemy(1.8);
  if (!target) {
    log("No enemy in striking range.");
    sfx("swing");
    return;
  }
  sfx("swing");
  hitEnemy(target, 10 * forms[state.player.form].power);
}

function blast() {
  const cost = getCurrentSpecies().id === "bioarc" ? 7 : 8;
  if (state.player.sp < cost) return log("Not enough spirit.");
  const target = nearestEnemy(5);
  const breakable = ensureMap(state.zone).destructibles.find((d) => d.hp > 0 && dist(d, state.player) < 4);
  if (!target && !breakable) {
    log("No target for the blast.");
    return;
  }
  state.player.sp -= cost;
  sfx("blast");
  if (target) hitEnemy(target, 16 * forms[state.player.form].power);
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
    completeHiddenTrial();
  }
}

function completeHiddenTrial() {
  state.flags.hiddenTrialsCompleted ||= 0;
  state.flags.hiddenTrialsCompleted++;
  grantXp(10, "training");
  log(`Hidden trial complete: Quiet Pulse resonance ${state.flags.hiddenTrialsCompleted}.`);
}

function nearestEnemy(range) {
  return ensureMap(state.zone).enemies.filter((e) => e.alive && dist(e, state.player) <= range).sort((a, b) => dist(a, state.player) - dist(b, state.player))[0];
}

function hitEnemy(enemy, dmg) {
  const p = state.player;
  let finalDamage = dmg * weatherDamageModifier();
  if (getCurrentSpecies().id === "starforged" && p.hp / p.maxHp < 0.4) finalDamage *= 1.12;
  finalDamage *= getSpeciesFormDamageMultiplier();
  finalDamage *= 1 + registerCombatHit(enemy);
  if (p.speciesTimers.battleSurge > 0) {
    finalDamage *= 1.35;
    p.speciesTimers.battleSurge = 0;
  }
  const roundedDamage = Math.round(finalDamage);
  enemy.hp -= roundedDamage;
  gainFormMastery(enemy.boss ? 4 : 2, "hit");
  enemy.flash = 0.15;
  addFloatingText(`-${roundedDamage}`, enemy.x, enemy.y - 0.8, enemy.boss ? "#ff5a66" : "#ffd166");
  addImpact(enemy.boss ? 7 : 4, enemy.boss ? 0.08 : 0.04);
  sfx(roundedDamage >= 28 ? "heavyHit" : "hit");
  if (enemy.hp <= 0) defeatEnemy(enemy);
  else if (!encounter && (enemy.boss || state.rng.next() < 0.25)) startEncounter(enemy);
}

function defeatEnemy(enemy) {
  enemy.alive = false;
  const flowBonus = encounter?.enemy === enemy ? Math.min(18, Math.max(0, encounter.combo - 2) * 2) : 0;
  grantXp(enemy.xp + flowBonus, enemy.boss ? "boss" : "combat");
  state.player.money += enemy.boss ? 40 : 8;
  if (flowBonus > 0) {
    ensureCombatStats();
    state.flags.combatStats.flowBonuses++;
    state.player.money += Math.ceil(flowBonus / 3);
    log(`Combat flow bonus: ${flowBonus} XP.`);
  }
  log(`Defeated ${enemy.name}.`);
  sfx(enemy.boss ? "bossWin" : "pickup");
  if (enemy.id === "sparring-drone") {
    ensureOpeningArcFlags();
    state.flags.openingArc.droneDefeated = true;
    state.flags.pendingStarterChoice = true;
    completeObjective(7);
  }
  if (enemy.id === "mira-trial") {
    ensureOpeningArcFlags();
    const arc = state.flags.openingArc;
    arc.bossDefeated = true;
    arc.complete = true;
    arc.saved = true;
    state.flags.pendingOpeningCompleteModal = true;
    persist();
    log("Opening training saved. The Dust Barrens gate unlocks.");
  }
  if (enemy.id === "patrol") completeObjective(7);
  if (enemy.id === "ravik") {
    completeObjective(15);
    unlockForm("Flare");
    recordBossOutcome(enemy, "Ravik retreats with respect for your opening form.");
  }
  if (enemy.id === "mara") {
    completeObjective(23);
    unlockForm("Storm");
    recordBossOutcome(enemy, "Mara Coil's forest ambush network breaks apart.");
  }
  if (enemy.id === "sky-raider") completeObjective(30);
  if (enemy.id === "warden") {
    completeObjective(34);
    unlockForm("Iron Spirit");
    recordBossOutcome(enemy, "Thunder Plateau recognizes your weather discipline.");
  }
  if (enemy.id === "engine") {
    completeObjective(48);
    recordBossOutcome(enemy, `${state.branch} route pressure opens at Moonfall Citadel.`);
    if (state.branch !== "Undeclared") completeObjective(50);
  }
  gainFormMastery(enemy.boss ? 18 : 6, "victory");
  levelCheck();
}

function recordBossOutcome(enemy, outcome) {
  state.flags.bossOutcomes ||= {};
  state.flags.bossOutcomes[enemy.id] = outcome;
  if (state.branch !== "Undeclared") {
    state.flags.factionReputation ||= { "Ember League": 0, "Quiet Shrine": 0, "Rift Syndicate": 0 };
    state.flags.factionReputation[state.branch] = (state.flags.factionReputation[state.branch] || 0) + (enemy.boss ? 1 : 0);
  }
  log(`Outcome: ${outcome}`);
}

function damageDestructible(d, dmg) {
  d.hp -= dmg;
  sfx("break");
  addFloatingText("CRACK", d.x, d.y - 0.6, "#ffd166");
  if (d.hp <= 0) {
    log(`Destroyed ${d.kind}.`);
    if (d.kind === "training-crate") {
      ensureOpeningArcFlags();
      state.flags.openingArc.crateBroken = true;
      completeObjective(4);
    }
    grantXp(4, "destruction");
    const speciesLoot = getCurrentSpecies().id === "majinite" ? 0.18 : 0;
    if (state.rng.next() < (state.player.skills.includes("loot") ? 0.7 : 0.35) + speciesLoot) {
      const drop = state.rng.pick(["Crater Coin", "Herb Bundle", "Spirit Tea"]);
      ensureMap(state.zone).loot.push({ x: d.x, y: d.y, item: drop });
      log(`${drop} fell out.`);
    }
    if (d.kind !== "training-crate") completeObjective(10);
    levelCheck();
  }
}

function startEncounter(enemy) {
  if (!enemy?.alive) return;
  if (encounter?.enemy === enemy) return;
  encounter = {
    enemy,
    turn: 0,
    timer: 0,
    boss: enemy.boss,
    phase: 1,
    attackPeriod: enemyAttackPeriod(enemy, 1),
    attackName: enemyAttackName(enemy, 1),
    warned: false,
    guardTimer: 0,
    guardAt: -99,
    dodgeTimer: 0,
    hitStop: 0,
    combo: 0,
    comboTimer: 0,
  };
  sfx(enemy.boss ? "boss" : "encounter");
  log(enemy.boss ? `${enemy.name} challenges you!` : `${enemy.name} attacks!`);
}

function updateEncounter(dt) {
  const e = encounter.enemy;
  if (!e.alive) {
    encounter = null;
    return;
  }
  if (encounter.hitStop > 0) {
    encounter.hitStop = Math.max(0, encounter.hitStop - dt);
    drainForm(dt * 0.25);
    updateSpeciesPassives(dt * 0.25);
    return;
  }
  encounter.guardTimer = Math.max(0, encounter.guardTimer - dt);
  encounter.dodgeTimer = Math.max(0, encounter.dodgeTimer - dt);
  encounter.comboTimer = Math.max(0, encounter.comboTimer - dt);
  if (encounter.comboTimer === 0) encounter.combo = 0;
  updateEncounterPhase(e);
  encounter.timer += dt;
  if (actionPressed("strike")) hitEnemy(e, 13 * forms[state.player.form].power);
  if (actionPressed("blast")) blast();
  if (actionPressed("guard")) guard();
  if (actionPressed("dodge")) dodge();
  drainForm(dt);
  updateSpeciesPassives(dt);
  if (!e.alive) {
    encounter = null;
    return;
  }
  if (!encounter.warned && encounter.timer >= encounter.attackPeriod * 0.62) {
    encounter.warned = true;
    addFloatingText("!", e.x, e.y - 1.35, "#ff5a66");
    sfx("warning");
  }
  if (encounter.timer >= encounter.attackPeriod) resolveEnemyAttack(e);
}

function guard() {
  if (encounter) {
    encounter.guardTimer = state.player.skills.includes("guard") ? 0.52 : 0.38;
    encounter.guardAt = encounter.timer;
    addFloatingText("GUARD", state.player.x, state.player.y - 1.15, "#62d6ff");
  }
  state.player.sp = Math.min(state.player.maxSp, state.player.sp + (getCurrentSpecies().id === "android" ? 8 : 4));
  sfx("guard");
}

function dodge() {
  if (!encounter) return;
  const p = state.player;
  const cost = state.player.skills.includes("dash") ? 3 : 5;
  if (p.sp < cost) return log("Not enough spirit to dodge.");
  p.sp -= cost;
  const move = movementVector();
  let dx = move.x;
  let dy = move.y;
  if (!dx && !dy) {
    dx = p.x - encounter.enemy.x;
    dy = p.y - encounter.enemy.y;
  }
  const len = Math.hypot(dx, dy) || 1;
  const oldX = p.px;
  const oldY = p.py;
  const distance = TILE * (state.player.skills.includes("dash") ? 1.45 : 1.15);
  p.px += (dx / len) * distance;
  p.py += (dy / len) * distance;
  if (blocked(pixelToTile(p.px), pixelToTile(p.py))) {
    p.px = oldX;
    p.py = oldY;
  }
  p.x = pixelToTile(p.px);
  p.y = pixelToTile(p.py);
  encounter.dodgeTimer = 0.34;
  addFloatingText("DODGE", p.x, p.y - 1.1, "#b185ff");
  sfx("dodge");
}

function resolveEnemyAttack(enemy) {
  if (!encounter) return;
  const p = state.player;
  const dodged = encounter.dodgeTimer > 0;
  const guarded = encounter.guardTimer > 0;
  const perfectGuard = guarded && encounter.guardAt >= encounter.attackPeriod * 0.62;
  if (dodged) {
    ensureCombatStats();
    state.flags.combatStats.cleanDodges++;
    p.sp = Math.min(p.maxSp, p.sp + 5);
    addCombatRhythm(1, "EVADE", "#b185ff");
    addFloatingText("MISS", p.x, p.y - 1.25, "#b185ff");
    sfx("dodge");
    resetEnemyWindup(enemy);
    return;
  }
  if (perfectGuard) {
    ensureCombatStats();
    state.flags.combatStats.perfectGuards++;
    p.sp = Math.min(p.maxSp, p.sp + 12);
    const counter = Math.round(4 + p.basePower * 2);
    enemy.hp -= counter;
    enemy.flash = 0.22;
    addCombatRhythm(2, "PERFECT", "#64e690");
    addFloatingText(`-${counter}`, enemy.x, enemy.y - 0.8, "#64e690");
    addImpact(5, 0.04);
    sfx("perfect");
    if (enemy.hp <= 0) defeatEnemy(enemy);
    resetEnemyWindup(enemy);
    return;
  }
  const guardBoost = (forms[p.form].guard || 1) * p.guardStat * getSpeciesFormGuardMultiplier() * (p.speciesTimers.rootguard > 0 ? 1.8 : 1);
  let dmg = Math.max(1, Math.round(enemy.atk / guardBoost));
  if (guarded) dmg = Math.max(1, Math.round(dmg * 0.38));
  if (encounter.phase > 1 && enemy.boss) dmg += 2;
  p.hp -= dmg;
  addFloatingText(guarded ? `BLOCK -${dmg}` : `-${dmg}`, p.x, p.y - 0.8, guarded ? "#62d6ff" : "#ff5a66");
  sfx(guarded ? "guard" : "hurt");
  log(guarded ? `Blocked ${enemy.name}'s ${encounter.attackName} for ${dmg}.` : `${enemy.name}'s ${encounter.attackName} hits for ${dmg}.`);
  if (p.hp <= 0) {
    p.hp = Math.ceil(p.maxHp * 0.45);
    p.px -= TILE * 2;
    p.x = pixelToTile(p.px);
    log("You collapse, then crawl back up. Pride hurts more than ribs.");
    sfx("down");
    encounter = null;
    return;
  }
  resetEnemyWindup(enemy);
}

function resetEnemyWindup(enemy) {
  if (!encounter) return;
  encounter.timer = 0;
  encounter.warned = false;
  encounter.attackPeriod = enemyAttackPeriod(enemy, encounter.phase);
  encounter.attackName = enemyAttackName(enemy, encounter.phase);
}

function updateEncounterPhase(enemy) {
  if (!enemy.boss) return;
  const nextPhase = enemy.hp / enemy.maxHp <= 0.5 ? 2 : 1;
  if (nextPhase === encounter.phase) return;
  encounter.phase = nextPhase;
  encounter.attackPeriod = enemyAttackPeriod(enemy, nextPhase);
  encounter.attackName = enemyAttackName(enemy, nextPhase);
  encounter.timer = 0;
  encounter.warned = false;
  log(`${enemy.name} changes rhythm.`);
  addFloatingText("PHASE 2", enemy.x, enemy.y - 1.25, "#ff5a66");
  sfx("boss");
}

function enemyAttackPeriod(enemy, phase) {
  const base = enemy.boss ? 1.62 : 1.36;
  const phasePressure = phase > 1 ? 0.24 : 0;
  const lowHealthPressure = enemy.hp / enemy.maxHp < 0.3 ? 0.12 : 0;
  return Math.max(0.92, base - phasePressure - lowHealthPressure);
}

function enemyAttackName(enemy, phase) {
  if (enemy.id === "sparring-drone") return phase > 1 ? "Spin Feint" : "Palm Feint";
  if (enemy.id === "mira-trial") return phase > 1 ? "Echo Burst" : "Mirror Jab";
  if (enemy.boss) return phase > 1 ? "Burst Rush" : "Heavy Strike";
  return phase > 1 ? "Quick Rush" : "Quick Strike";
}

function registerCombatHit(enemy) {
  if (!encounter || encounter.enemy !== enemy) return 0;
  return addCombatRhythm(1, `FLOW x${encounter.combo + 1}`, "#62d6ff") * 0.04;
}

function addCombatRhythm(amount, label, color) {
  if (!encounter) return 0;
  encounter.combo += amount;
  encounter.comboTimer = 2.6;
  ensureCombatStats();
  state.flags.combatStats.bestCombo = Math.max(state.flags.combatStats.bestCombo, encounter.combo);
  if ([3, 6, 10].includes(encounter.combo) || label === "PERFECT" || label === "EVADE") {
    addFloatingText(label, state.player.x, state.player.y - 1.35, color);
    if (label.startsWith("FLOW")) sfx("success");
  }
  return Math.min(8, Math.max(0, encounter.combo - 1));
}

function addImpact(shake, stop) {
  screenShake = Math.max(screenShake, shake);
  if (encounter) encounter.hitStop = Math.max(encounter.hitStop || 0, stop);
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
  state.player.inventory.push(loot.item);
  state.player.money += loot.item.includes("Coin") ? 20 : 0;
  if (loot.item === "Training Capsule") {
    ensureOpeningArcFlags();
    state.flags.openingArc.capsuleFound = true;
    state.player.money += 8;
    grantXp(5, "exploration");
    completeObjective(6);
  }
  log(`Picked up ${loot.item}.`);
  sfx("pickup");
  if (loot.item === "Lost Capsule") completeObjective(6);
  if (loot.item === "Rare Training Capsule") {
    grantXp(10, "exploration");
    completeObjective(12);
  }
}

function checkExits() {
  const z = zones[state.zone];
  const exit = z.exits.find((ex) => state.player.x === ex.x && state.player.y === ex.y);
  if (!exit) return;
  ensureOpeningArcFlags();
  if (state.zone === "metro" && exit.to === "barrens" && !state.flags.openingArc.complete) {
    log("Mira keeps the east gate closed until the opening trial is complete.");
    sfx("fail");
    state.player.px = (exit.x - 1) * TILE;
    state.player.py = exit.y * TILE;
    state.player.x = exit.x - 1;
    state.player.y = exit.y;
    return;
  }
  state.zone = exit.to;
  state.player.px = exit.tx * TILE;
  state.player.py = exit.ty * TILE;
  state.player.x = exit.tx;
  state.player.y = exit.ty;
  sfx("travel");
  log(routeMemoryLine(z.name, zones[state.zone]));
  if (state.zone === "barrens") completeObjective(9);
  if (state.zone === "flight") completeObjective(28);
  if (state.zone === "plateau") completeObjective(31);
}

function routeMemoryLine(fromName, toZone) {
  return `Entered ${toZone.name}. Landmark: ${toZone.landmark}. Route from ${fromName} recorded.`;
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
  ensureFormMasteryDefaults();
  state.player.formMastery[name] ||= 0;
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
  ensureFormMasteryDefaults();
  const form = forms[state.player.form];
  if (!form.drain) {
    state.player.sp = Math.min(state.player.maxSp, state.player.sp + dt * 6);
    return;
  }
  if (state.player.speciesTimers.noFormDrain > 0) return;
  let mastery = state.player.skills.includes("form") ? 0.65 : 1;
  mastery *= Math.max(0.62, 1 - getCurrentFormMasteryRank() * 0.08);
  if (getCurrentSpecies().id === "starforged" && state.player.form === "Flare") mastery *= 0.85;
  mastery *= getSpeciesFormDrainMultiplier();
  state.player.sp -= form.drain * mastery * dt;
  gainFormMastery(dt * (encounter ? 2.2 : 0.7), "active");
  if (state.player.sp <= 0) {
    state.player.sp = 0;
    state.player.form = "Base";
    log("Your transformation drops.");
  }
}

function gainFormMastery(amount, reason = "use") {
  ensureFormMasteryDefaults();
  if (state.player.form === "Base") return;
  const species = getCurrentSpecies();
  let multiplier = 1;
  if (species.id === "starforged" && state.player.form === "Flare") multiplier += 0.25;
  if (species.id === "bioarc" && state.player.form === "Storm") multiplier += 0.2;
  if (species.id === "verdant" && state.player.form === "Iron Spirit") multiplier += 0.2;
  if (species.id === "majinite" && state.player.form === "Eclipse Break") multiplier += 0.2;
  if (species.id === "android") multiplier += 0.1;
  if (species.id === "celestial") multiplier += 0.15;
  const beforeRank = getCurrentFormMasteryRank();
  state.player.formMastery[state.player.form] += Math.max(0, amount * multiplier);
  const afterRank = getCurrentFormMasteryRank();
  if (afterRank > beforeRank) {
    log(`${state.player.form} mastery reached rank ${afterRank}.`);
    sfx("level");
  }
}

function getCurrentFormMasteryRank() {
  ensureFormMasteryDefaults();
  return getFormMasteryRank(state.player.formMastery[state.player.form] || 0);
}

function ensureFormMasteryDefaults() {
  state.player.formMastery ||= {};
  for (const formName of state.player.forms || ["Base"]) {
    state.player.formMastery[formName] ||= 0;
  }
}

function getSpeciesFormDrainMultiplier() {
  const species = getCurrentSpecies().id;
  const form = state.player.form;
  if (species === "majinite" && form === "Eclipse Break") return 0.88;
  if (species === "android") return 0.92;
  if (species === "celestial") return 0.9;
  return 1;
}

function getSpeciesFormDamageMultiplier() {
  const species = getCurrentSpecies().id;
  const form = state.player.form;
  if (species === "starforged" && form === "Flare") return 1.08;
  if (species === "bioarc" && form === "Storm") return 1.06;
  if (species === "majinite" && form === "Eclipse Break") return 1.08;
  return 1;
}

function getSpeciesFormGuardMultiplier() {
  const species = getCurrentSpecies().id;
  const form = state.player.form;
  if (species === "verdant" && form === "Iron Spirit") return 1.15;
  if (species === "android") return 1.08;
  return 1;
}

function currentFormAffinitySummary() {
  const species = getCurrentSpecies();
  if (species.id === "starforged" && state.player.form === "Flare") return "Starforged Flare affinity";
  if (species.id === "bioarc" && state.player.form === "Storm") return "Bio-Arc Storm affinity";
  if (species.id === "verdant" && state.player.form === "Iron Spirit") return "Verdant Iron Spirit affinity";
  if (species.id === "majinite" && state.player.form === "Eclipse Break") return "Majinite Eclipse affinity";
  if (species.id === "android" && state.player.form !== "Base") return "Android reactor stability";
  if (species.id === "celestial" && state.player.form !== "Base") return "Celestial form control";
  return species.affinity;
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
  p.formMastery ||= { Base: 0 };
  for (const formName of p.forms || ["Base"]) p.formMastery[formName] ||= 0;
}

function completeObjective(index) {
  if (state.completed.has(index)) return;
  state.completed.add(index);
  while (state.completed.has(state.activeObjective)) state.activeObjective++;
  log(`Objective complete: ${objectives[index]}`);
  rewardObjectiveMilestone(index);
  sfx("quest");
}

function rewardObjectiveMilestone(index) {
  const arc = questArcs.find((entry) => index >= entry.start && index <= entry.end);
  const isArcEnd = arc && index === arc.end;
  const isFifth = (index + 1) % 5 === 0;
  if (!isArcEnd && !isFifth) return;
  const xp = isArcEnd ? 18 : 8;
  const coins = isArcEnd ? 8 : 3;
  grantXp(xp, "quest");
  state.player.money += coins;
  log(`${isArcEnd ? arc.name : "Objective"} milestone: +${xp} XP, +${coins}c.`);
  levelCheck();
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
    sfx(weatherSfx(state.weather));
    if (state.weather === "Thunderstorm") completeObjective(19);
  }
}

function weatherSfx(weather) {
  if (weather === "Rain") return "rain";
  if (weather === "Wind" || weather === "Dust Storm") return "wind";
  if (weather === "Thunderstorm") return "thunder";
  if (weather === "Snow") return "snow";
  return "travel";
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

function showStartScreen() {
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));
  openModal("DBH RPG", `<p>Continue an existing save or start fresh.</p>
    <div class="grid">
      <button class="choice" data-start="continue" ${hasSave ? "" : "disabled"}>Continue<br><span class="tiny">${hasSave ? "Load your saved fighter" : "No save found"}</span></button>
      <button class="choice" data-start="new">New Game<br><span class="tiny">Reset the world and create a fighter</span></button>
      <button class="choice" data-start="controls">Controls<br><span class="tiny">View keyboard and controller basics</span></button>
    </div>`);
  ui.modalBody.querySelectorAll("[data-start]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.start === "continue") {
        loadGame();
        ui.modal.close();
      }
      if (btn.dataset.start === "new") startNewGame();
      if (btn.dataset.start === "controls") showControls();
    });
  });
}

function showControls() {
  openModal("Controls", `<div class="grid">
    <p>Move<br><span class="tiny">WASD, arrows, left stick, or D-pad</span></p>
    <p>Interact<br><span class="tiny">Space, Enter, or A</span></p>
    <p>Fight<br><span class="tiny">J/X strike, K/B blast, L/LB guard, Shift/RT dodge</span></p>
    <p>Forms<br><span class="tiny">F/Y transforms, E/LS species ability</span></p>
  </div>`);
}

function startNewGame() {
  const fresh = makeWorld();
  Object.assign(state, fresh);
  state.rng = fresh.rng;
  state.completed = fresh.completed;
  encounter = null;
  minigame = null;
  floaters = [];
  screenShake = 0;
  autosaveTimer = 0;
  weatherTimer = 0;
  applySpeciesToPlayer("terran");
  ensureRuntimeFlags();
  ensurePlayerCharacterDefaults();
  ensureFormMasteryDefaults();
  log("New game started.");
  showCharacterCreator();
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
  <button class="choice" type="button" data-begin-training="true">Begin Training<br><span class="tiny">Start in Mira's training yard with your current choices.</span></button>
  <p class="tiny">Move with WASD/arrows or controller stick/D-pad. Space/A talks. E/LS uses species ability. J/X strikes. K/B blasts. L/LB guards. Shift/RT dodges. F/Y transforms.</p>`);
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
  ui.modalBody.querySelector("[data-begin-training]").addEventListener("click", beginOpeningTraining);
}

function beginOpeningTraining() {
  ensureOpeningArcFlags();
  const arc = state.flags.openingArc;
  arc.started = true;
  state.zone = "metro";
  state.player.px = 10 * TILE;
  state.player.py = 14 * TILE;
  state.player.x = 10;
  state.player.y = 14;
  state.weather = "Clear";
  completeObjective(0);
  completeObjective(1);
  log("Mira is waiting in the training yard.");
  sfx("quest");
  ui.modal.close();
  persist();
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

function showForms() {
  ensureFormMasteryDefaults();
  openModal("Forms", `<p>${state.player.speciesName} affinity: ${currentFormAffinitySummary()}</p><div class="grid">
    ${Object.values(forms).map((form) => {
      const unlocked = state.player.forms.includes(form.name);
      const xp = state.player.formMastery[form.name] || 0;
      const rank = getFormMasteryRank(xp);
      const next = nextFormMasteryTarget(xp);
      const progress = rank >= 4 ? "Max rank" : `${Math.floor(xp)}/${next} mastery`;
      return `<button class="choice" data-form-choice="${form.name}" ${unlocked ? "" : "disabled"} style="border-color:${form.color}">${form.name}${state.player.form === form.name ? " (active)" : ""}<br><span class="tiny">Rank ${rank}. ${progress}. Power x${form.power}. Drain ${form.drain}.<br>${unlocked ? form.perks[Math.min(rank, form.perks.length - 1)] : `Unlock: ${form.unlock}`}</span></button>`;
    }).join("")}
  </div>`);
  ui.modalBody.querySelectorAll("[data-form-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.player.form = btn.dataset.formChoice;
      log(`Selected ${state.player.form}.`);
      sfx("transform");
      ui.modal.close();
    });
  });
}

function showAudioSettings() {
  ensureRuntimeFlags();
  openModal("Audio", `<div class="grid">
    ${["master", "music", "sfx", "weather"].map((key) => `<label>${key}<br><input type="range" min="0" max="1" step="0.05" data-audio="${key}" value="${state.audioSettings[key]}"></label>`).join("")}
  </div>`);
  ui.modalBody.querySelectorAll("[data-audio]").forEach((input) => {
    input.addEventListener("input", () => {
      state.audioSettings[input.dataset.audio] = Number(input.value);
      applyAudioSettings();
      persist();
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
  const currentArc = currentQuestArc();
  const waypoint = currentQuestWaypoint();
  openModal("Quest Log", `<p>Branch: ${state.branch}. Completed ${done.length}/${objectives.length} objectives.</p>
    <p>${questCompassLine()}</p>
    <p class="tiny">Next action: ${waypoint.action}</p>
    <p>${finalRouteStatus()}</p>
    <h3>${currentArc.name}</h3>
    <p class="tiny">${currentArc.summary}</p>
    ${next.map((o, i) => {
      const index = state.activeObjective + i;
      const target = objectiveTargets[index];
      const detail = target ? `${zones[target.zone]?.name || target.zone}: ${target.action}` : currentArc.summary;
      return `<p>${index + 1}. ${o}<br><span class="tiny">${detail}</span></p>`;
    }).join("")}
    <h3>Campaign Arcs</h3>
    <div class="grid">
      ${questArcs.map((arc) => {
        const total = arc.end - arc.start + 1;
        const complete = done.filter((index) => index >= arc.start && index <= arc.end).length;
        return `<p>${arc.name}<br><span class="tiny">${complete}/${total}. ${arc.summary}</span></p>`;
      }).join("")}
    </div>
    <h3>Completed</h3>
    <p class="tiny">${done.slice(-18).map((i) => objectives[i]).join(" | ") || "None yet"}</p>`);
}

function showCodex() {
  openModal("Codex", `${codexSection("Factions", codex.factions)}
    ${codexSection("Regions", codex.regions)}
    ${codexSection("Techniques", codex.techniques)}
    ${codexSection("Bosses", codex.bosses)}`);
}

function codexSection(title, rows) {
  return `<h3>${title}</h3><div class="grid">${rows.map((row) => `<p>${row.name}<br><span class="tiny">${row.note}</span></p>`).join("")}</div>`;
}

function ensureRuntimeFlags() {
  state.flags ||= {};
  state.audioSettings = { master: 0.18, music: 0.55, sfx: 0.9, weather: 0.55, ...(state.audioSettings || {}) };
  ensureOpeningArcFlags();
  ensureCombatStats();
}

function ensureOpeningArcFlags() {
  state.flags ||= {};
  state.flags.openingArc = { ...openingArcDefaults, ...(state.flags.openingArc || {}) };
  state.flags.pendingStarterChoice ||= false;
  state.flags.pendingOpeningCompleteModal ||= false;
}

function ensureCombatStats() {
  state.flags ||= {};
  state.flags.combatStats = { ...combatStatsDefaults, ...(state.flags.combatStats || {}) };
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

function startAuraForge() {
  minigame = { type: "forge", pulse: 0, score: 0, tries: 5 };
  openModal("Aura Forge", `<p>Press Space when the ring is near the bright center. Five tries.</p>
    <p class="tiny">Reward bands: 56+ Polished Aura Charm. 0-55 Warm Charm. Misses still produce a lesser upgrade.</p>
    <canvas id="forgeCanvas" width="320" height="180"></canvas>`);
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
  g.fillStyle = "#f4f7fb";
  g.font = "12px sans-serif";
  g.fillText(`Score ${minigame.score}  Tries ${minigame.tries}`, 12, 18);
  g.fillStyle = "#64e690";
  g.fillText("56+ polished", 220, 18);
  g.fillStyle = "#ffd166";
  g.fillText("0-55 warm", 220, 34);
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
  if (screenShake > 0) {
    camera.x += (Math.random() - 0.5) * screenShake;
    camera.y += (Math.random() - 0.5) * screenShake;
  }
  drawMap(map, z);
  drawEntities(map);
  drawOpeningMarker();
  drawQuestCompass();
  drawFloaters();
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
      drawTileAccent(t, x, y);
    }
  }
}

function drawTileAccent(tile, x, y) {
  const sx = x * TILE - camera.x;
  const sy = y * TILE - camera.y;
  if ((x * 31 + y * 17) % 11 !== 0) return;
  if (tile === "grass" || tile === "forest") {
    ctx.fillStyle = "rgba(100,230,144,0.24)";
    ctx.fillRect(sx + 7, sy + 19, 4, 8);
    ctx.fillRect(sx + 18, sy + 9, 3, 7);
  }
  if (tile === "sand") {
    ctx.fillStyle = "rgba(255,209,102,0.2)";
    ctx.fillRect(sx + 5, sy + 22, 16, 2);
  }
  if (tile === "stone" || tile === "city") {
    ctx.fillStyle = "rgba(255,255,255,0.11)";
    ctx.fillRect(sx + 4, sy + 5, 8, 2);
    ctx.fillRect(sx + 19, sy + 21, 7, 2);
  }
  if (tile === "lava") {
    ctx.fillStyle = "rgba(255,90,102,0.26)";
    ctx.fillRect(sx + 6, sy + 8, 20, 3);
  }
  if (tile === "shrine") {
    ctx.fillStyle = "rgba(177,133,255,0.22)";
    ctx.fillRect(sx + 14, sy + 4, 4, 22);
  }
}

function drawEntities(map) {
  drawLandmark();
  for (const loot of map.loot) drawDiamond(loot.x, loot.y, loot.item.includes("Training") ? "#ffd166" : "#64e690");
  for (const d of map.destructibles) if (d.hp > 0) drawBlock(d.x, d.y, d.kind);
  for (const npc of activeNpcs(map)) drawPerson(npc.x, npc.y, npc.role === "hidden" ? "#b185ff" : "#ffd166", npc.name);
  for (const e of map.enemies) if (e.alive) drawEnemy(e);
  drawPlayer();
}

function drawLandmark() {
  const zone = zones[state.zone];
  if (!zone.landmark) return;
  const x = Math.floor(zone.size[0] / 2);
  const y = Math.max(4, Math.floor(zone.size[1] / 4));
  const sx = x * TILE - camera.x;
  const sy = y * TILE - camera.y;
  if (sx < -80 || sy < -60 || sx > innerWidth + 80 || sy > innerHeight + 60) return;
  ctx.fillStyle = "rgba(255,209,102,0.24)";
  ctx.fillRect(sx - 18, sy - 30, 36, 48);
  ctx.strokeStyle = "#ffd166";
  ctx.strokeRect(sx - 18, sy - 30, 36, 48);
  label(zone.landmark, sx, sy - 38);
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
  const isEncounterTarget = encounter?.enemy === e;
  const isSoftTarget = !encounter && nearestEnemy(5) === e;
  if (isEncounterTarget || isSoftTarget) {
    ctx.strokeStyle = isEncounterTarget ? "rgba(255, 209, 102, 0.9)" : "rgba(98, 214, 255, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, isEncounterTarget ? 22 : 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (isEncounterTarget) {
    const progress = clamp(encounter.timer / encounter.attackPeriod, 0, 1);
    ctx.strokeStyle = progress >= 0.62 ? "rgba(255, 90, 102, 0.96)" : "rgba(255, 209, 102, 0.68)";
    ctx.lineWidth = progress >= 0.62 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(x, y, 18 + progress * 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    if (progress >= 0.62) {
      const px = state.player.px - camera.x;
      const py = state.player.py - camera.y;
      ctx.strokeStyle = "rgba(255, 90, 102, 0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
  }
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

function drawOpeningMarker() {
  const target = openingArcTarget();
  if (!target) return;
  const x = target.x * TILE - camera.x;
  const y = target.y * TILE - camera.y;
  const pulse = 16 + Math.sin(performance.now() / 160) * 4;
  ctx.strokeStyle = "rgba(255, 209, 102, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, pulse + 7, 0, Math.PI * 2);
  ctx.stroke();
}

function drawQuestCompass() {
  if (openingArcTarget()) return;
  const target = currentQuestWaypoint();
  if (!target || target.zone !== state.zone) return;
  const sx = target.x * TILE - camera.x;
  const sy = target.y * TILE - camera.y;
  const margin = 36;
  const visible = sx >= margin && sy >= margin && sx <= innerWidth - margin && sy <= innerHeight - margin;
  if (visible) {
    drawCompassRing(sx, sy, target.label);
    return;
  }
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const angle = Math.atan2(sy - cy, sx - cx);
  const x = clamp(cx + Math.cos(angle) * (innerWidth / 2 - margin), margin, innerWidth - margin);
  const y = clamp(cy + Math.sin(angle) * (innerHeight / 2 - margin), margin, innerHeight - margin);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(255, 209, 102, 0.92)";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (target.finalTarget) {
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(x - 76, y + 12, 152, 18);
    ctx.fillStyle = "#f4f7fb";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`toward ${target.finalTarget.label}`, x, y + 25);
    ctx.textAlign = "left";
  }
  label(target.label, x, y - 16);
}

function drawCompassRing(x, y, labelText) {
  const pulse = 20 + Math.sin(performance.now() / 180) * 3;
  ctx.strokeStyle = "rgba(100, 230, 144, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(100, 230, 144, 0.16)";
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  label(labelText, x, y - 28);
}

function addFloatingText(text, tx, ty, color) {
  floaters.push({ text, x: tx * TILE, y: ty * TILE, color, life: 0.8, age: 0 });
}

function updateFloaters(dt) {
  floaters = floaters
    .map((f) => ({ ...f, age: f.age + dt, y: f.y - dt * 18 }))
    .filter((f) => f.age < f.life);
}

function updateScreenEffects(dt) {
  screenShake = Math.max(0, screenShake - dt * 16);
}

function drawFloaters() {
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  for (const f of floaters) {
    const alpha = clamp(1 - f.age / f.life, 0, 1);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.42 * alpha})`;
    ctx.fillText(f.text, f.x - camera.x + 1, f.y - camera.y + 1);
    ctx.fillStyle = f.color.replace(")", `, ${alpha})`).startsWith("rgba") ? f.color : f.color;
    ctx.globalAlpha = alpha;
    ctx.fillText(f.text, f.x - camera.x, f.y - camera.y);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = "left";
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
  ctx.fillRect(innerWidth / 2 - 190, 92, 380, 76);
  ctx.fillStyle = encounter.boss ? "#ff5a66" : "#ffd166";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(encounter.enemy.name, innerWidth / 2, 126);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(innerWidth / 2 - 130, 134, 260, 5);
  const warned = encounter.timer / encounter.attackPeriod >= 0.62;
  ctx.fillStyle = warned ? "#ff5a66" : encounter.boss ? "#ff8f70" : "#ffd166";
  ctx.fillRect(innerWidth / 2 - 130, 134, 260 * clamp(encounter.timer / encounter.attackPeriod, 0, 1), 5);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = warned ? "#ffbdc3" : "#f4f7fb";
  ctx.fillText(`${encounter.attackName}: ${warned ? "guard or dodge now" : "watch the ring"}  |  Flow x${encounter.combo}`, innerWidth / 2, 154);
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
  ui.formText.textContent = `${p.form} R${getCurrentFormMasteryRank()}`;
  ui.moneyText.textContent = `${p.money}c`;
  ensureRuntimeFlags();
  ui.actionPanel.innerHTML = `<h3>Actions</h3><p>Space/A interact. E/LS ${getCurrentSpecies().active.name}. J/X strike. K/B blast. L/LB guard. Shift/RT dodge. F/Y form.</p><p>${techniques.map((t) => `${t.key}: ${t.name}${t.requires && !p.skills.includes(t.requires) ? " (locked)" : ""}`).join(" | ")}</p><p>${combatHudLine()}</p><p>Controller: ${gamepad.connected ? "connected" : "not connected"}. Weather effects: ${weatherSummary()}</p>`;
  ui.log.innerHTML = `<h3>Log</h3>${state.log.slice(-7).map((l) => `<p>${escapeHtml(l)}</p>`).join("")}`;
}

function combatHudLine() {
  ensureCombatStats();
  if (encounter) {
    const progress = Math.round((encounter.timer / encounter.attackPeriod) * 100);
    return `Combat: ${encounter.attackName} ${progress}%. Flow x${encounter.combo}. Guard or dodge on red.`;
  }
  const stats = state.flags.combatStats;
  return `Combat mastery: best flow x${stats.bestCombo}, perfect guards ${stats.perfectGuards}, clean dodges ${stats.cleanDodges}.`;
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
  localStorage.setItem(SAVE_KEY, serializeSave());
}

function serializeSave() {
  const serializable = {
    ...state,
    rng: state.rng.snap(),
    completed: [...state.completed],
  };
  return JSON.stringify(serializable, null, 2);
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return log("No save found.");
  const data = parseSave(raw);
  if (!data) return;
  hydrateSave(data);
  log("Loaded.");
  sfx("travel");
}

function parseSave(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    log("Save data is not valid JSON.");
    sfx("fail");
    return null;
  }
}

function hydrateSave(data) {
  const rng = data.rng || {};
  const completed = Array.isArray(data.completed) ? data.completed : [];
  Object.assign(state, data);
  state.schema ||= 1;
  state.rng = new Rng(rng.seed || Date.now(), rng.count || 0);
  state.completed = new Set(completed);
  state.flags ||= {};
  ensureRuntimeFlags();
  ensurePlayerCharacterDefaults();
  ensureFormMasteryDefaults();
}

function showExportSave() {
  persist();
  const text = escapeHtml(serializeSave());
  openModal("Export Save", `<p class="tiny">Save JSON can be stored outside the browser and imported later.</p>
    <textarea id="saveExportText" rows="12" spellcheck="false">${text}</textarea>
    <div class="grid">
      <button class="choice" type="button" data-select-export="true">Select Save Text<br><span class="tiny">Highlight the full export for copying.</span></button>
    </div>`);
  ui.modalBody.querySelector("[data-select-export]").addEventListener("click", () => {
    const field = document.getElementById("saveExportText");
    field.focus();
    field.select();
  });
}

function showImportSave() {
  openModal("Import Save", `<p class="tiny">Paste exported save JSON. Import replaces the current browser save.</p>
    <textarea id="saveImportText" rows="12" spellcheck="false"></textarea>
    <div class="grid">
      <button class="choice" type="button" data-import-save="true">Import Save<br><span class="tiny">Validate, load, and persist this save.</span></button>
    </div>`);
  ui.modalBody.querySelector("[data-import-save]").addEventListener("click", () => {
    const raw = document.getElementById("saveImportText").value;
    const data = parseSave(raw);
    if (!data) return;
    hydrateSave(data);
    persist();
    log("Imported save.");
    sfx("travel");
    ui.modal.close();
  });
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
  const musicGain = ac.createGain();
  const sfxGain = ac.createGain();
  const weatherGain = ac.createGain();
  musicGain.connect(master);
  sfxGain.connect(master);
  weatherGain.connect(master);
  master.connect(ac.destination);
  audio = { ac, master, musicGain, sfxGain, weatherGain, music: null, theme: "" };
  applyAudioSettings();
}

function applyAudioSettings() {
  if (!audio) return;
  ensureRuntimeFlags();
  audio.master.gain.value = state.audioSettings.master;
  audio.musicGain.gain.value = state.audioSettings.music;
  audio.sfxGain.gain.value = state.audioSettings.sfx;
  audio.weatherGain.gain.value = state.audioSettings.weather;
}

function tone(freq, dur, type = "sine", gain = 0.12, bus = "sfx") {
  if (!audio) return;
  const osc = audio.ac.createOscillator();
  const g = audio.ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, audio.ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.ac.currentTime + dur);
  osc.connect(g);
  g.connect(audio[`${bus}Gain`] || audio.sfxGain);
  osc.start();
  osc.stop(audio.ac.currentTime + dur);
}

function sfx(kind) {
  const table = {
    swing: [180, 0.06, "sawtooth"],
    hit: [90, 0.09, "square"],
    heavyHit: [58, 0.16, "square"],
    hurt: [70, 0.12, "sawtooth"],
    blast: [420, 0.18, "triangle"],
    guard: [220, 0.08, "sine"],
    perfect: [1180, 0.16, "triangle"],
    dodge: [720, 0.08, "sine"],
    warning: [520, 0.06, "sawtooth"],
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
    success: [900, 0.13, "sine"],
    fail: [110, 0.22, "sawtooth"],
    rain: [240, 0.35, "triangle", 0.05, "weather"],
    wind: [180, 0.45, "sine", 0.045, "weather"],
    thunder: [52, 0.7, "sawtooth", 0.08, "weather"],
    snow: [520, 0.24, "sine", 0.035, "weather"],
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
  gain.connect(audio.musicGain);
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
