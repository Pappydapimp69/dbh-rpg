# DBH RPG

Offline 2D top-down tile RPG prototype built from the five-stage blueprint in `BLUEPRINT.md`.

The game uses original in-project names, generated pixel-style canvas visuals, and procedural WebAudio sounds/music. It is inspired by high-energy martial-arts anime RPGs, but it does not ship licensed characters, locations, music, or sprites.

Hosted build:

```text
https://pappydapimp69.github.io/dbh-rpg/
```

## Run

Start a static server in this folder and open the local URL:

```powershell
python -m http.server 4173
```

Then visit:

```text
http://localhost:4173
```

## Controls

- Move: `WASD` or arrow keys
- Controller move: left stick or D-pad
- Interact: `Space`
- Strike: `J`
- Blast: `K`
- Transform: `F`
- Techniques: `1`, `2`, `3`, `4`
- Aura Forge minigame: `M`
- Sky Courier minigame: `N`
- Controller actions: `A` interact/confirm, `X` strike, `B` blast, `Y` transform, `LB/RB/Back/RS` techniques, `LT` Aura Forge, `RT` Sky Courier, `Start` quest log

## Built Features

- Offline browser game with no runtime dependency install.
- Top-down tile maps with multiple regions.
- 2.5D-style flight route with parallax, hazards, and lift visuals.
- Character creation with seven original species, origin, style, aura color, stats, XP growth, passives, and active abilities.
- NPCs, shops, mentors, enemies, bosses, loot, destructibles, random encounters, and pickups.
- Leveling, stats, skill points, skill tree, inventory, equipment, techniques, and transformations.
- Weather, day/night, branch choice, NPC availability, and 55-objective campaign track.
- Three minigames: Figurine Tactics, Aura Forge, and Sky Courier.
- Procedural sound effects and location/combat music.
- Deterministic saved RNG state through `{ seed, count }`.
- 20 structured expansion blueprints, each split into 5 in-game stages.

## Validation

Run:

```powershell
node scripts/smoke.mjs
```

The smoke check validates the presence of core systems, objective count, generated audio hooks, deterministic RNG, and launch files.
