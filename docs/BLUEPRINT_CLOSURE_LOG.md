# Blueprint Closure Log

This log tracks development blueprint closure. These entries are for implementation planning only and are not gameplay content.

## Cycle 1: Input And Comfort Pass

Status: Closed

Focus: Make long sessions easier to control and read.

### Stage 1: Control Audit

Status: Shipped

Evidence:
- `inputMap` centralizes keyboard and controller bindings for movement-adjacent actions.
- `actionPressed()` maps keyboard and gamepad button edges into one action vocabulary.
- `techPressed()` covers numbered keyboard technique slots and controller equivalents.

### Stage 2: Prompt Cleanup

Status: Shipped

Evidence:
- Controls copy includes keyboard and controller bindings.
- HUD action prompts derive from the current species ability, locked technique state, controller state, and weather effect.
- Combat HUD reports current telegraph timing instead of relying on static text.

### Stage 3: Modal Navigation

Status: Shipped

Evidence:
- `handleModalInput()` moves focus across enabled modal buttons with controller directions.
- Controller confirm activates the focused modal action.
- Controller cancel closes open modals.
- Native keyboard tab/enter behavior remains available through standard buttons.

### Stage 4: Flight Tuning

Status: Shipped

Evidence:
- Flight zones use a higher movement speed and read analog stick axes through `movementVector()`.
- `updateFlightHazards()` handles storm mines, route punishment, and wind spirit recovery.
- `weatherMoveModifier()` gives Wind a flight-route movement effect.

### Stage 5: Regression Pass

Status: Shipped

Evidence:
- `scripts/smoke.mjs` now guards the input map, modal navigation, controls copy, flight route behavior, controller support, and the rule that blueprints stay out of gameplay.

## Cycle 2: Save And Continuity Pass

Status: Closed

Focus: Make long RPG progress feel persistent and recoverable.

### Stage 1: Schema Review

Status: Shipped

Evidence:
- Save data includes `schema`, RNG snapshot, completed objectives, player state, map state, flags, time, weather, and branch state.
- `serializeSave()` centralizes save JSON generation.

### Stage 2: Blueprint Progress

Status: Shipped

Evidence:
- Development blueprints are intentionally excluded from save data and gameplay state.
- Smoke coverage guards against blueprint UI, rewards, and player controls returning.

### Stage 3: Export Path

Status: Shipped

Evidence:
- `showExportSave()` persists the current state, renders exportable JSON, and provides a select action.
- `showImportSave()` accepts pasted JSON, validates it, hydrates state, persists it, and closes the modal.

### Stage 4: Load Guard

Status: Shipped

Evidence:
- `parseSave()` catches invalid JSON without crashing the game loop.
- `hydrateSave()` backfills schema, RNG, completed objectives, runtime flags, character defaults, and form mastery defaults.

### Stage 5: Round Trip

Status: Shipped

Evidence:
- `saveGame()`, `loadGame()`, `persist()`, `serializeSave()`, `parseSave()`, and `hydrateSave()` share one continuity path.
- `scripts/smoke.mjs` guards export/import controls, save parsing, hydration defaults, and blueprint exclusion from saves.

## Cycle 3: Quest Density Pass

Status: Closed

Focus: Make the 55-objective campaign easier to follow.

### Stage 1: Arc Labels

Status: Shipped

Evidence:
- `questArcs` groups the 55 objectives into six campaign arcs.
- `showQuestLog()` displays the current arc and all campaign arc completion counts.

### Stage 2: Branch Echoes

Status: Shipped

Evidence:
- The HUD and Quest Log both surface the current branch state.
- `chooseBranch()` applies faction-specific bonuses and logs the chosen faction.

### Stage 3: Hidden Leads

Status: Shipped

Evidence:
- `objectiveTargets` includes hidden mentor and route hints.
- `currentQuestTarget()` and `questCompassLine()` convert objective state into contextual target guidance.
- Hidden NPC availability is tied to night or the hidden skill through `activeNpcs()`.

### Stage 4: Completion Rhythm

Status: Shipped

Evidence:
- `rewardObjectiveMilestone()` gives small XP and coin rewards on every fifth objective and at arc endings.
- `completeObjective()` calls the milestone reward path exactly once per objective because completed objectives are set-guarded.

### Stage 5: Quest Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards objective count, arc metadata, target metadata, quest compass resolver, visual compass hooks, quest log grouping, branch echoes, hidden leads, and milestone rewards.

## Cycle 4: World Texture Pass

Status: Closed

Focus: Make maps feel less like placeholders.

Research:
- Wayfinding research emphasizes paths, districts, nodes, and landmarks as orientation aids.
- Landmark-based navigation studies support using recognizable anchors for virtual navigation.

### Stage 1: Tile Accent

Status: Shipped

Evidence:
- `drawTileAccent()` adds theme-specific visual marks to terrain tiles.

### Stage 2: Destruction Rewards

Status: Shipped

Evidence:
- `damageDestructible()` grants XP and can drop items through deterministic RNG.

### Stage 3: Landmark Names

Status: Shipped

Evidence:
- Each major zone has a `landmark` value.
- `drawLandmark()` renders and labels the current zone landmark.

### Stage 4: Route Memory

Status: Shipped

Evidence:
- `routeMemoryLine()` records origin, destination, and landmark on travel.

### Stage 5: World Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards tile accents, destructible rewards, landmark data/rendering, route memory, and world content.

## Cycle 5: Combat Feel Pass

Status: Closed

Focus: Sharpen action RPG combat readability.

### Stage 1: Technique Roles

Status: Shipped

Evidence:
- `techniques` defines named slots, spirit costs, ranges, prerequisites, and special roles such as area and reveal.
- HUD action text marks locked techniques.

### Stage 2: Boss Pressure

Status: Shipped

Evidence:
- Encounters track phase, attack period, attack name, warning state, hit stop, and combo state.
- `enemyAttackPeriod()`, `enemyAttackName()`, and `updateEncounterPhase()` make boss pressure more readable.
- `drawEncounterBanner()` shows attack timing, warning state, and flow.

### Stage 3: Guard Value

Status: Shipped

Evidence:
- `guard()` creates a timed guard window and restores spirit.
- `resolveEnemyAttack()` distinguishes dodge, guard, perfect guard, counter damage, spirit recovery, and reduced block damage.
- Combat mastery stats track perfect guards and clean dodges.

### Stage 4: Weather Synergy

Status: Shipped

Evidence:
- `weatherDamageModifier()` changes combat output based on form, weather, and style.
- `weatherSummary()` surfaces weather effects in the HUD.

### Stage 5: Combat Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards technique role data, boss telegraphs, guard/dodge resolution, combat mastery stats, impact feedback, combat HUD, and weather modifier hooks.

## Cycle 6: Transformation Identity Pass

Status: Closed

Focus: Make forms feel like distinct builds.

### Stage 1: Form Copy

Status: Shipped

Evidence:
- `src/formMastery.js` defines the form catalog with names, unlock routes, colors, power, guard, drain, mastery targets, and perks.
- `showForms()` displays unlocked state, rank, progress, power, drain, perks, and unlock copy.

### Stage 2: Drain Readability

Status: Shipped

Evidence:
- HUD form text shows the active form and mastery rank.
- `showForms()` displays each form's drain value.
- `drainForm()` applies mastery, skills, and species modifiers to active form drain.

### Stage 3: Unlock Routes

Status: Shipped

Evidence:
- Boss victories and items unlock Flare, Storm, Iron Spirit, and Eclipse Break through `unlockForm()` and `applyItem()`.
- Faction rewards can add hidden/form-related paths.

### Stage 4: Visual Aura

Status: Shipped

Evidence:
- `drawPlayer()` uses form color, thicker aura rings, pulsing transformed radius, and flight trails.

### Stage 5: Form Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards the form catalog, mastery rank helpers, gameplay mastery hooks, Forms UI, unlock routes, drain hooks, and visual aura hooks.

## Cycle 7: NPC And Schedule Pass

Status: Closed

Focus: Make towns and mentors feel alive offline.

### Stage 1: Schedule Rules

Status: Shipped

Evidence:
- `isNight()` derives schedule state from deterministic save time.
- `activeNpcs()` filters hidden NPCs and shop availability by time and skills.

### Stage 2: Mentor Value

Status: Shipped

Evidence:
- `train()` restores spirit, grants XP, supports the free first Mira lesson, and remains useful after the tutorial for a coin cost.

### Stage 3: Shop Hours

Status: Shipped

Evidence:
- `activeNpcs()` closes ordinary shops at night while leaving Mirror Lake's food shop available.

### Stage 4: Hidden NPCs

Status: Shipped

Evidence:
- Hidden mentor Vey is gated by night or the hidden skill.
- Hidden mentor interaction sets discovery flags and completes the relevant objective.

### Stage 5: NPC Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards NPC schedule hooks, mentor training value, shop hours, hidden NPC gating, and hidden objective completion.

## Cycle 8: Economy And Loot Pass

Status: Closed

Focus: Make pickups, shops, and rewards coherent.

### Stage 1: Loot Table

Status: Shipped

Evidence:
- Zone maps include structured loot arrays.
- Destructibles can drop useful items through a deterministic RNG path modified by skills/species.

### Stage 2: Shop Identity

Status: Shipped

Evidence:
- `showShop()` gives water-region shops a different inventory from general shops.

### Stage 3: Item Effects

Status: Shipped

Evidence:
- `itemEffects` maps consumables, gear, charms, skills, and form unlocks into structured effects.
- `applyItem()` applies those effects through one code path.

### Stage 4: Reward Scale

Status: Shipped

Evidence:
- Combat, bosses, training, destruction, minigames, objective milestones, and shops use small differentiated XP/coin values.

### Stage 5: Economy Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards loot arrays, destructible drops, regional shops, item effects, objective rewards, and economy hooks.

## Cycle 9: Figurine Tactics Pass

Status: Closed

Focus: Strengthen the collectible tactics minigame.

Research:
- Collectible game research emphasizes collections, categories, rarity/spawn clarity, and strategic composition.
- Tactics design benefits from readable unit roles and small squads with persistent affinity.

### Stage 1: Collection UI

Status: Shipped

Evidence:
- The Figures button opens `showFigurineCollection()`.
- The modal shows collected count, owned figures, unknown figures, and team behavior.

### Stage 2: Type Roles

Status: Shipped

Evidence:
- `figurineTypeRoles` defines Strike, Blast, Guard, Trick, and Spirit roles plus strong matchups.
- Duel copy surfaces strong-type damage.

### Stage 3: Spawn Logic

Status: Shipped

Evidence:
- Figurines spawn as zone loot and collection copy points players toward zone glints.
- Existing pickups add discovered figurines to the player's collection.

### Stage 4: Duel Rewards

Status: Shipped

Evidence:
- Duel wins grant money, figurine XP, and objective progress without changing core economy balance.
- Type advantage adds tactical depth without raw rarity escalation.

### Stage 5: Figurine Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards collection UI, type roles, spawn pickup logic, duel rewards, and type advantage damage.

## Cycle 10: Aura Forge Pass

Status: Closed

Focus: Make crafting feel skillful, not random.

### Stage 1: Timing Loop

Status: Shipped

Evidence:
- `startAuraForge()` opens a modal canvas with a pulsing timing ring.
- `updateMinigame()` scores interaction timing from the pulse accuracy.

### Stage 2: Reward Bands

Status: Shipped

Evidence:
- The Aura Forge modal and canvas show reward bands.
- Scores above 55 produce `Polished Aura Charm`; lower scores produce `Warm Charm`.

### Stage 3: Failure Softness

Status: Shipped

Evidence:
- Missed timing still contributes to a lesser score.
- The player always receives a completed upgrade item when tries run out.

### Stage 4: Audio Feedback

Status: Shipped

Evidence:
- Accurate hits use `success`; weak timing uses `fail`.

### Stage 5: Forge Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards forge timing, reward bands, soft failure, and success/fail audio hooks.

## Cycle 11: Sky Courier Pass

Status: Closed

Focus: Make 2.5D flight routes earn their place.

### Stage 1: Altitude Feel

Status: Shipped

Evidence:
- Sky Courier uses vertical lane movement through `movementVector()` and clamps altitude inside the canvas.

### Stage 2: Hazard Readability

Status: Shipped

Evidence:
- Courier hazards are visible storm columns with collision state.
- Lift drafts are visible green boost pickups.

### Stage 3: Cargo Stakes

Status: Shipped

Evidence:
- Cargo drains over time, storm columns damage cargo, lift drafts restore cargo, failed cargo ends the run, and clean delivery grants a bonus.

### Stage 4: Route Unlocks

Status: Shipped

Evidence:
- Completing Sky Courier grants the route objective and a Courier Token.

### Stage 5: Courier Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards courier altitude movement, hazards, boosts, cargo stakes, clean-route rewards, and objective completion.

## Cycle 12: Audio Stage Pass

Status: Closed

Focus: Give every state a sound identity.

Research:
- MDN describes WebAudio as a modular routing graph built from source, effect, gain, and destination nodes.
- GainNode is the right lightweight control for separate music, SFX, weather, and master volume buses.

### Stage 1: SFX Coverage

Status: Shipped

Evidence:
- `sfx()` covers combat, UI, loot, weather, transformation, minigames, quest, and failure/success events.

### Stage 2: Music Layers

Status: Shipped

Evidence:
- `updateMusic()` switches location, encounter, and boss loops through the music bus.

### Stage 3: Weather Sound

Status: Shipped

Evidence:
- `weatherSfx()` maps weather states to distinct weather sounds.
- Weather sounds route through a weather gain bus.

### Stage 4: Volume Future

Status: Shipped

Evidence:
- `audioSettings` stores master, music, SFX, and weather gains.
- `showAudioSettings()` exposes compact range controls without introducing a full settings system.

### Stage 5: Audio Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards audio graph buses, settings UI, weather SFX, music routing, and SFX table coverage.

## Cycle 13: Accessibility Pass

Status: Closed

Focus: Keep the game playable for more hands and screens.

### Stage 1: Readable Panels

Status: Shipped

Evidence:
- HUD, panel, modal, and controls use constrained sizes, readable font sizes, scrollable panels, and mobile-specific layout rules.

### Stage 2: Input Redundancy

Status: Shipped

Evidence:
- Core actions support keyboard and controller inputs through `inputMap`.

### Stage 3: Modal Focus

Status: Shipped

Evidence:
- `handleModalInput()` provides controller focus traversal, confirm, and cancel.
- Native buttons preserve keyboard focus behavior.

### Stage 4: Color Meaning

Status: Shipped

Evidence:
- Combat, objective, form, branch, weather, and interaction states are communicated through labels and text in addition to color.

### Stage 5: Access Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards readable layout CSS, redundant inputs, modal focus, text state labels, and controller hooks.

## Cycle 14: Performance Pass

Status: Closed

Focus: Keep the single-file renderer responsive.

### Stage 1: Draw Budget

Status: Shipped

Evidence:
- `drawMap()` only iterates visible tile bounds derived from the camera and viewport.

### Stage 2: Generated Maps

Status: Shipped

Evidence:
- `ensureMap()` caches generated maps in `state.maps` after first creation.

### Stage 3: Audio Budget

Status: Shipped

Evidence:
- Audio uses lightweight WebAudio oscillators and event-driven `sfx()`/`updateMusic()` paths.

### Stage 4: DOM Budget

Status: Shipped

Evidence:
- HUD updates are centralized in `updateHud()` and bounded to compact panel markup.

### Stage 5: Perf Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards visible-slice drawing, cached generated maps, simple audio paths, HUD centralization, and launch files.

## Cycle 15: GitHub Pages Pass

Status: Closed

Focus: Make the hosted build clean and self-describing.

### Stage 1: Static Root

Status: Shipped

Evidence:
- `index.html`, `styles.css`, and module scripts are served from the repository root without a build step.

### Stage 2: No Jekyll

Status: Shipped

Evidence:
- `.nojekyll` exists at the static root.

### Stage 3: Hosted Link

Status: Shipped

Evidence:
- `README.md` documents the hosted GitHub Pages URL.

### Stage 4: Offline Shape

Status: Shipped

Evidence:
- `package.json` has no runtime dependency list.
- Runtime code uses browser APIs and local modules only.

### Stage 5: Deploy Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards launch files, `.nojekyll`, hosted link text, offline shape, and the absence of blueprint player UI.

## Cycle 16: Lore And Codex Pass

Status: Closed

Focus: Make original worldbuilding easier to discover.

Research:
- Structured RPG worldbuilding research emphasizes explicit schemas and staged dependencies to keep factions, regions, quests, and characters coherent.

### Stage 1: Faction Notes

Status: Shipped

Evidence:
- `codex.factions` summarizes Ember League, Quiet Shrine, and Rift Syndicate identities.

### Stage 2: Region Notes

Status: Shipped

Evidence:
- `codex.regions` explains the purpose of major maps.

### Stage 3: Technique Notes

Status: Shipped

Evidence:
- `codex.techniques` explains the role of each technique without requiring external docs.

### Stage 4: Boss Notes

Status: Shipped

Evidence:
- `codex.bosses` ties major bosses to world stakes and progression lessons.

### Stage 5: Lore Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards the codex button, structured lore sections, and render path.

## Cycle 17: Training Systems Pass

Status: Closed

Focus: Make non-combat progression matter.

Research:
- Mastery learning uses repeat practice, feedback, and thresholds before advancement.
- Reward-loop research warns that repeatable rewards should be meaningful but bounded.

### Stage 1: Mentor Training

Status: Shipped

Evidence:
- `train()` grants XP, restores spirit, supports a free first Mira lesson, and remains repeatable for coins.

### Stage 2: Weather Training

Status: Shipped

Evidence:
- `applyWeatherTrainingBonus()` rewards training during risky weather and advances the storm training objective.

### Stage 3: Form Mastery

Status: Shipped

Evidence:
- `gainFormMastery()` rewards active transformed time, hits, boss wins, species affinities, and weather training.

### Stage 4: Hidden Trials

Status: Shipped

Evidence:
- `completeHiddenTrial()` rewards Quiet Pulse discovery and tracks hidden trial completion.

### Stage 5: Training Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards mentor training, weather training, form mastery, hidden trials, and training reward hooks.

## Cycle 18: Branching Story Pass

Status: Closed

Focus: Make choices create visible ripples.

Research:
- Branching narrative research highlights meaningful decision points, visible consequences, and converging branches as a practical way to control complexity.

### Stage 1: Faction Bonus

Status: Shipped

Evidence:
- `applyBranchBonus()` gives distinct Ember, Shrine, and Rift rewards.
- Faction reputation is stored under `state.flags.factionReputation`.

### Stage 2: Quest Echo

Status: Shipped

Evidence:
- HUD and Quest Log show current branch and `finalRouteStatus()`.

### Stage 3: Boss Outcome

Status: Shipped

Evidence:
- `recordBossOutcome()` stores boss-specific outcome text and logs consequences.

### Stage 4: Final Route

Status: Shipped

Evidence:
- Crown Engine resolution records final route pressure and can complete the final-route reputation objective when a branch exists.

### Stage 5: Branch Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards faction bonuses, reputation, quest echoes, boss outcomes, final route status, and branch objective hooks.

## Cycle 19: QA And Regression Pass

Status: Closed

Focus: Make the project safer to keep expanding.

### Stage 1: Smoke Coverage

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards core systems, objective counts, blueprint data shape, closed cycle criteria, and player-facing exclusions.

### Stage 2: Syntax Gate

Status: Shipped

Evidence:
- `scripts/check.mjs` runs `node --check src/main.js` before smoke.
- `package.json` exposes the gate through `npm run check`.

### Stage 3: Content Counts

Status: Shipped

Evidence:
- Smoke guards the 45+ objective minimum and 20-by-5 internal blueprint structure.

### Stage 4: Pages Check

Status: Shipped

Evidence:
- Smoke guards `index.html`, `styles.css`, `.nojekyll`, README hosted URL, and offline package shape.

### Stage 5: QA Smoke

Status: Shipped

Evidence:
- `npm run check` is the single command for syntax plus smoke.

## Cycle 20: Next-Slice Production Pass

Status: Closed

Focus: Turn this prototype into a repeatable content pipeline.

Research:
- Vertical slice practice emphasizes shipping a working cross-section through data, behavior, UI, and validation.
- Game development process research supports explicit production-phase validation and maintainable boundaries.

### Stage 1: Slice Contract

Status: Shipped

Evidence:
- `docs/NEXT_SLICE_CONTRACT.md` defines the repeatable slice rule, loop, and acceptance criteria.

### Stage 2: Data Boundaries

Status: Shipped

Evidence:
- `docs/NEXT_SLICE_CONTRACT.md` records current data/module ownership boundaries.

### Stage 3: Authoring Loop

Status: Shipped

Evidence:
- The contract requires Brain query, research, build, closure log, smoke, check, mine, and sync.

### Stage 4: Playable Review

Status: Shipped

Evidence:
- The contract requires every slice to ship player-facing behavior, state/data support, and validation when applicable.

### Stage 5: Production Smoke

Status: Shipped

Evidence:
- `scripts/smoke.mjs` guards the slice contract and verifies all 20 cycles are represented in this closure log.
