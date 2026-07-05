# DBH RPG Blueprint

## North Star

Build an offline, 2D top-down, tile-based martial-arts RPG with explorable overworlds, flight maps, training arcs, transformation-driven progression, destructible terrain, quests, bosses, shops, loot, and minigames.

The game should feel like a high-energy anime power fantasy, but all shipped characters, places, music, sprites, writing, and names must be original project assets. The working inspiration is "open-world battle shonen RPG"; the implementation target is a legally distinct original game.

## Core Pillars

1. **Fast readable action**
   - Top-down tile maps for towns, wild zones, interiors, dungeons, arenas, shops, and training grounds.
   - Real-time overworld movement with contact-based encounters, random encounters in danger zones, and scripted boss triggers.
   - Tile-scale destruction: rocks, trees, walls, crates, barricades, fragile buildings, cracked cliffs, and hidden cave doors.

2. **Power fantasy with structure**
   - Leveling, stats, gear, consumables, aura upgrades, transformations, and branching skill trees.
   - Hidden techniques discovered through mentors, rare encounters, exploration puzzles, and story choices.
   - Training options that are useful throughout the game, not only tutorial flavor.

3. **Living offline world**
   - Deterministic simulation using a seeded RNG stored in the save file as `{ seed, count }`.
   - No ambient `Math.random()` or wall-clock-driven simulation logic.
   - Weather, day/night, NPC schedules, encounter rolls, loot rolls, and figurine spawns derive from the world RNG or explicit save state.

4. **Player-authored identity**
   - Character customization at start and through shops/training rewards.
   - Build identity comes from species/origin, fighting style, transformations, skill tree choices, mentor bonds, and collectible figurine team.

5. **Big journey, small safe slices**
   - The full game has 45+ objectives and multiple branches.
   - Implementation should ship in vertical slices: deterministic core first, then systems, then content expansion.

## Technical Architecture

### Recommended Engine

Use a browser-first HTML5 game stack:

- `Phaser 3` for rendering, tilemaps, animation, input, audio, particles, and camera.
- `Tiled`-style JSON maps or generated JSON tilemaps for levels.
- Plain TypeScript or JavaScript modules for the authoritative simulation.
- Local save through IndexedDB or localStorage, with export/import JSON.

This keeps the game offline, easy to run, easy to package, and asset-generation friendly.

### Simulation Boundary

Keep one authoritative `world` state object:

- Entities: player, NPCs, enemies, destructibles, projectiles, pickups, shops, quest markers.
- Maps: tile layers, collision, destructible state, zone metadata, weather state.
- Progression: level, XP, stats, forms, techniques, skill trees, inventory.
- Story: objective state, flags, branch choices, faction reputation, mentor trust.
- RNG: `{ seed, count }`.

Renderer reads from simulation state. Renderer must not mutate authoritative state directly.

Required guardrails:

- Freeze or proxy authoritative state outside sim update paths during development.
- Use a single `clearAndRespawnMapView()` path whenever loading/reloading maps.
- Rebuild derived display objects, collision caches, and entity views from authoritative state after every source-of-truth replacement.
- Keep physics visual-only where possible; authoritative movement and combat use deterministic tile/grid math.

## Game Loop

1. Explore a zone.
2. Talk, shop, train, gather loot, trigger quests.
3. Fight enemies through field encounters, random encounters, or bosses.
4. Gain XP, items, figurines, techniques, skill points, form progress.
5. Unlock paths through power, story choices, flight routes, destructible obstacles, or hidden technique requirements.
6. Return to hubs for shops, mentors, minigames, and branching story decisions.

## World Structure

### Ground Maps

Ground maps are 2D top-down tile maps.

- **Metro Crater**: starting city, shops, arena, capsule courier, tutorial quests.
- **Dust Barrens**: early combat zone, bandits, buried ruins, destructible rock gates.
- **Green Crown Forest**: weather-heavy zone, ambushes, hidden mentor, stealth/night events.
- **Mirror Lake Village**: branching faction hub, fishing/training minigame, rare figurine spawns.
- **Thunder Plateau**: midgame power storms, flight launch pads, boss tower.
- **Ashen Badlands**: late-game enemy patrols, crater dungeons, unstable weather.
- **Sky Monastery**: mentor hub, advanced skills, transformation trials.
- **Moonfall Citadel**: final act dungeon, branching boss route.

### Flight Maps

Flight maps are "2.5D" routes: top-down horizontal/vertical movement with parallax, altitude lanes, clouds, weather, and fast enemy flybys.

- Use tile lanes with altitude metadata.
- Camera zooms out and scrolls faster.
- Obstacles include storm columns, floating rocks, energy mines, sky patrols.
- Flight maps connect distant regions, hide sky loot, and host chase encounters.

## Player Customization

### Start Choices

- Body type: light, balanced, heavy.
- Origin: exile, prodigy, scavenger, shrine student.
- Aura color: blue, gold, green, red, violet, white.
- Hair style, outfit palette, emblem.
- Starting style:
  - Striker: melee combos and counters.
  - Blaster: ranged energy attacks and charge control.
  - Guardian: defense, taunts, endurance.
  - Trickster: movement, traps, status effects.

### Persistent Build Axes

- Stats: Power, Guard, Spirit, Speed, Focus, Luck.
- Forms: unlocked through story, training, and hidden trials.
- Skill trees: style tree, aura tree, form tree, survival tree, figurine commander tree.
- Mentor bonds: unlock techniques and branch dialogue.

## Progression Systems

### Leveling

- XP from combat, quests, training milestones, exploration discoveries, and minigame victories.
- Level grants stat points and occasional skill points.
- Bosses grant form progress or unique technique fragments.

### Transformations

Forms are temporary states with drain and mastery.

- **Flare Form**: early speed/power boost, unstable drain.
- **Storm Form**: ranged energy and weather synergy.
- **Iron Spirit**: guard, stagger resistance, destructible damage.
- **Solar Apex**: late-game high drain, unlocks secret routes.
- **Eclipse Break**: branch-dependent form tied to story choices.

Each form has:

- Unlock quest.
- Mastery XP.
- Combat animation set.
- Aura sound loop.
- Environmental interaction bonus.

### Skill Trees

Skill trees use nodes with prerequisites.

- Style tree: combo finishers, counters, dodge cancels.
- Aura tree: charge speed, blast types, shield, beam clash.
- Form tree: drain reduction, form-specific moves, mastery effects.
- Survival tree: loot, crafting, cooking, weather resistance.
- Commander tree: figurine minigame bonuses and overworld spawn tracking.

## Combat

### Overworld Action Combat

- Movement: 4-way or 8-way tile-assisted movement.
- Basic melee combo.
- Charged energy blast.
- Dash and guard.
- Technique slots.
- Form toggle.
- Knockback and destructible impact.
- Status effects: stunned, burned, chilled, shocked, exhausted, focused.

### Random Encounters

Danger zones roll deterministic encounter checks based on step count, weather, time, and zone threat.

Encounter types:

- Ambush.
- Duel.
- Patrol group.
- Rare elite.
- Weather anomaly.
- Figurine challenger.

### Boss Fights

Bosses have phases, arena destruction, unique music, and story consequences.

Example bosses:

- Ravik the Glass Fist: counter tutorial boss.
- Mara Coil: forest ambush leader with clone decoys.
- The Thunder Warden: flight-to-ground phase boss.
- Null Champion: anti-transformation duel.
- Crown Engine: destructible arena core.
- Eclipse Heir: final branch rival.

## Items, Loot, Shops

### Item Types

- Consumables: food, capsules, tonics, weather cures.
- Gear: gloves, boots, gi, belts, charms, scouters.
- Crafting: ore, herbs, monster cores, machine parts.
- Techniques: scrolls, memory crystals, mentor tokens.
- Figurines: collectible minigame pieces.
- Key items: passcards, shrine seals, flight licenses.

### Shops

Each hub has at least one shop type:

- General goods.
- Technique dojo.
- Gear tailor.
- Capsule mechanic.
- Figurine trader.
- Food stall.
- Black-market rare goods.

Shop inventory changes by story act, reputation, weather event, and hidden flags.

## NPCs

NPCs have:

- Name, portrait sprite, schedule, dialogue state, faction, trust, services.
- Optional combat profile.
- Quest role: giver, blocker, target, witness, mentor, rival, shopkeeper.

NPC categories:

- Town civilians.
- Trainers and mentors.
- Patrol guards.
- Rival fighters.
- Traveling merchants.
- Figurine collectors.
- Faction leaders.
- Secret technique keepers.

## Quest And Story Design

### Branching Structure

The story is built around three factions:

- **The Ember League**: power through public tournaments.
- **The Quiet Shrine**: discipline, hidden forms, restraint.
- **The Rift Syndicate**: forbidden techniques and fast shortcuts.

Player choices affect:

- Which mentor teaches advanced skills.
- Which city district is damaged or protected.
- Which boss joins, escapes, or mutates.
- Which final route opens.
- Which transformation reaches full mastery.

### Objective List

At least 45 objectives:

1. Wake in Metro Crater.
2. Customize fighter.
3. Complete movement trial.
4. Learn basic strike combo.
5. Learn aura charge.
6. Visit first shop.
7. Help courier recover stolen capsule.
8. Fight alley patrol.
9. Choose first mentor lead.
10. Unlock Dust Barrens gate.
11. Clear rockslide with charged blast.
12. Rescue stranded scavenger.
13. Find first figurine spawn.
14. Win first figurine duel.
15. Locate buried training bell.
16. Defeat Ravik the Glass Fist.
17. Return to Metro Crater.
18. Choose faction contact.
19. Investigate forest disappearances.
20. Survive storm weather event.
21. Learn stealth approach at night.
22. Discover hidden forest mentor.
23. Unlock Flare Form.
24. Defeat Mara Coil.
25. Protect or abandon Mirror Lake convoy.
26. Open Mirror Lake shop district.
27. Complete fishing-focus minigame.
28. Gather shrine seals.
29. Unlock flight license.
30. Complete first flight route.
31. Chase sky raider.
32. Land on Thunder Plateau.
33. Train under lightning weather.
34. Unlock Storm Form.
35. Defeat Thunder Warden.
36. Choose public tournament or secret shrine route.
37. Enter midgame tournament bracket.
38. Expose rigged match.
39. Recover forbidden scroll.
40. Unlock Iron Spirit.
41. Break Ashen Badlands siege.
42. Find Null Champion arena.
43. Defeat Null Champion without relying on forms.
44. Complete advanced figurine championship.
45. Unlock Sky Monastery.
46. Pass three mentor trials.
47. Choose whether to seal or use Eclipse technique.
48. Infiltrate Moonfall Citadel.
49. Defeat Crown Engine.
50. Face branch rival.
51. Unlock final route based on faction reputation.
52. Defeat Eclipse Heir.
53. Resolve faction ending.
54. Enter postgame sky rift.
55. Hunt legendary figurine spawns.

## Minigames

### 1. Figurine Tactics

Turn-based battle minigame using collectible figurines.

Systems:

- Figurines spawn around maps based on zone, weather, time, and story act.
- Player builds a team of 3 to 5.
- Board is a small grid.
- Turns use energy pips.
- Figurines have types: Strike, Blast, Guard, Trick, Spirit.
- Rarity affects ability complexity, not raw automatic victory.
- Winning duels unlocks cosmetics, items, and commander skill XP.

### 2. Aura Forge

Timing and pattern minigame for upgrading gear and techniques.

- Match pulsing aura rings.
- Better timing improves upgrade quality.
- Weather and mentor bonuses alter ring behavior.
- Failed attempts produce lesser upgrades, not hard loss.

### 3. Sky Courier

Flight-route delivery minigame.

- Navigate altitude lanes.
- Avoid storm columns and patrols.
- Collect boost drafts.
- Deliver cargo before it destabilizes.
- Rewards include money, rare shop stock, and route shortcuts.

## Audio Blueprint

All audio is generated in-project using procedural synthesis or generated assets.

### Sound Effects

Required event coverage:

- Footsteps per terrain.
- Dash.
- Melee swing.
- Melee hit.
- Guard block.
- Charged blast.
- Beam loop.
- Beam clash.
- Explosion.
- Terrain break.
- Pickup.
- Shop buy/sell.
- Menu select/back.
- Quest accepted/completed.
- Level up.
- Skill unlock.
- Transformation start, loop, end.
- Weather: rain, thunder, wind, dust, snow.
- NPC talk chirps.
- Random encounter sting.
- Boss phase shift.
- Figurine summon, attack, defeat.
- Minigame success/fail.

### Music

Music changes by location and game state.

- Metro Crater: busy percussion and warm synth bass.
- Dust Barrens: dry plucked strings, low drums.
- Green Crown Forest: soft pads, hand percussion, birds/rain layers.
- Mirror Lake: calm bells, water texture.
- Thunder Plateau: tense arpeggios, thunder percussion.
- Ashen Badlands: distorted bass, sparse drums.
- Sky Monastery: choir pads, chimes, wind.
- Moonfall Citadel: dark pulse, metallic hits.
- Random encounter: faster combat loop.
- Boss battle: unique boss themes with phase layers.
- Figurine tactics: playful strategic loop.

Implementation path:

- Start with WebAudio procedural tones/noise envelopes.
- Add generated `.wav` assets later for richer texture.
- Use event-driven audio routing so locations, weather, combat, and boss state crossfade cleanly.

## Visual Asset Blueprint

All assets should be original and generated locally or drawn in-code.

### Sprite Sets

- Player base body with palette swaps.
- Hair/outfit overlays.
- NPC templates by region.
- Enemy families: bandit, drone, beast, spirit, elite fighter.
- Boss sprites with large silhouettes.
- Aura overlays and transformation effects.
- Figurine icons and board tokens.

### Tile Sets

- City tiles.
- Desert tiles.
- Forest tiles.
- Lake village tiles.
- Plateau tiles.
- Badlands tiles.
- Monastery tiles.
- Citadel tiles.
- Interior/shop tiles.
- Destructible variants.

### Animation Requirements

- Idle.
- Walk/run.
- Dash.
- Melee combo.
- Blast charge.
- Blast fire.
- Guard.
- Hit react.
- Knockback.
- Downed.
- Transform.
- Form idle.
- NPC talk.
- Enemy patrol.
- Boss phase transition.
- Destructible crack/break.

## Weather And Time

Weather is realistic enough to affect play:

- Rain lowers fire damage, boosts lightning encounters, changes footstep sounds.
- Thunderstorms create danger tiles and rare power-up opportunities.
- Dust storms reduce sight and increase ambush odds.
- Snow slows movement unless gear resists it.
- Wind affects flight routes and projectile drift visuals.

Day/night:

- NPC schedules.
- Shop hours.
- Patrol strength.
- Rare spawns.
- Stealth routes.
- Night-only hidden techniques.

## Save Format

Save must include:

- Schema version.
- Player customization and stats.
- Inventory and equipment.
- Skill tree nodes.
- Forms and mastery.
- Quest flags and objective states.
- NPC trust/faction reputation.
- Map destructible state.
- Figurine collection and teams.
- Weather/time state.
- RNG `{ seed, count }`.

Do not promise future lockstep co-op unless the save schema and deterministic simulation are preserved from day one.

## Implementation Phases

### Phase 0: Project Foundation

- Create Phaser project.
- Add offline asset pipeline.
- Add deterministic RNG.
- Add save/load/export/import.
- Add map loader and entity registry.
- Add renderer/sim boundary guard.

### Phase 1: Vertical Slice

- One hub: Metro Crater.
- One wild zone: Dust Barrens.
- Player movement and camera.
- One NPC, one shop, one trainer.
- Basic combat.
- Loot pickups.
- One destructible obstacle.
- One random encounter enemy.
- One boss.
- Five objectives.
- Basic procedural SFX and two music loops.

### Phase 2: Progression Slice

- Leveling.
- Inventory/equipment.
- Skill tree UI.
- First transformation.
- Training option.
- Hidden technique.
- Save/load regression test.

### Phase 3: World Slice

- Add forest and lake zones.
- Add day/night and weather.
- Add NPC schedules.
- Add branch choice.
- Add shops with changing inventory.
- Add 20 objectives total.

### Phase 4: Flight And Minigames

- Add 2.5D flight maps.
- Add Sky Courier.
- Add Aura Forge.
- Add Figurine Tactics with collectible spawns.

### Phase 5: Full Campaign Expansion

- Add all major regions.
- Add boss roster.
- Add 45+ objectives.
- Add final branching route.
- Add postgame legendary figurines.
- Add expanded music and SFX set.

## Verification

Automated checks:

- Save/load round-trip.
- Deterministic replay golden run.
- No direct renderer mutation of world state.
- Map reload does not duplicate entities.
- Quest objective graph has no unreachable required node.
- Skill tree prerequisites validate.
- Loot tables sum and roll deterministically.
- Audio event IDs resolve.

Manual/playtest checks:

- Combat feel.
- Camera framing.
- Destruction satisfaction.
- Weather readability.
- Flight readability.
- Boss clarity.
- Minigame pacing.
- Branch consequence clarity.

## Immediate Next Build Target

Build Phase 0 and Phase 1 as a playable browser game:

- Start screen goes directly into character creation.
- Metro Crater and Dust Barrens exist as tile maps.
- Player can move, talk, shop, fight, loot, break rocks, level up, and finish the first five objectives.
- Use simple generated pixel assets and procedural audio first.
- Keep every system data-driven enough to expand into the full blueprint without rewriting the core.
