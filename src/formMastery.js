export const forms = {
  Base: {
    id: "Base",
    name: "Base",
    tier: 0,
    drain: 0,
    color: "#62d6ff",
    power: 1,
    guard: 1,
    unlock: "Starting state",
    masteryTheme: "Control",
    perks: ["Stable spirit recovery", "All species can use every core technique"],
  },
  Flare: {
    id: "Flare",
    name: "Flare",
    tier: 1,
    drain: 5,
    color: "#ffd166",
    power: 1.35,
    guard: 1,
    unlock: "Defeat Ravik the Glass Fist",
    masteryTheme: "Pressure",
    perks: ["Lower spirit drain", "Low-health damage steadies", "Dash speed increases during combat"],
  },
  Storm: {
    id: "Storm",
    name: "Storm",
    tier: 2,
    drain: 7,
    color: "#62d6ff",
    power: 1.55,
    guard: 1.05,
    unlock: "Defeat Mara Coil or use a Storm Seal",
    masteryTheme: "Weather",
    perks: ["Thunderstorm damage improves", "Blast cost falls", "Flight wind penalties become bonuses"],
  },
  "Iron Spirit": {
    id: "Iron Spirit",
    name: "Iron Spirit",
    tier: 2,
    drain: 4,
    color: "#dbe9ef",
    power: 1.2,
    guard: 1.6,
    unlock: "Defeat Thunder Warden",
    masteryTheme: "Endurance",
    perks: ["Guard grows stronger", "Destructible damage improves", "Boss hits refund spirit"],
  },
  "Solar Apex": {
    id: "Solar Apex",
    name: "Solar Apex",
    tier: 4,
    drain: 11,
    color: "#fff1a6",
    power: 2.1,
    guard: 1.1,
    unlock: "Late-game mastery fragments",
    masteryTheme: "Radiance",
    perks: ["High power drain reduction", "Secret routes respond to aura", "Final bosses stagger sooner"],
  },
  "Eclipse Break": {
    id: "Eclipse Break",
    name: "Eclipse Break",
    tier: 5,
    drain: 13,
    color: "#b185ff",
    power: 2.35,
    guard: 0.95,
    unlock: "Forbidden Scroll or Eclipse route choice",
    masteryTheme: "Risk",
    perks: ["Backlash reduction", "Hidden technique damage rises", "Branch-rival fights reveal extra dialogue"],
  },
};

export const formMasteryBlueprint = {
  title: "Transformation Mastery Blueprint",
  stages: [
    "Form catalog and unlock routes",
    "Mastery XP, ranks, drain scaling, and perks",
    "Species affinities and form behavior",
    "Forms UI and save compatibility",
    "Documentation and validation",
  ],
};

export function masteryRequiredForRank(rank) {
  return [0, 40, 120, 260, 480][rank] ?? 480 + (rank - 4) * 260;
}

export function getFormMasteryRank(xp = 0) {
  if (xp >= masteryRequiredForRank(4)) return 4;
  if (xp >= masteryRequiredForRank(3)) return 3;
  if (xp >= masteryRequiredForRank(2)) return 2;
  if (xp >= masteryRequiredForRank(1)) return 1;
  return 0;
}

export function nextFormMasteryTarget(xp = 0) {
  const rank = getFormMasteryRank(xp);
  return masteryRequiredForRank(rank + 1);
}
