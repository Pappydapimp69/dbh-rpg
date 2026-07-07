# LOCAL IDEAS

## Opening Arc Overlay

For early RPG onboarding, layer a small `flags.openingArc` controller over existing verbs instead of creating a separate tutorial mode or rewriting the campaign objective array. Let the guide listen to real actions such as talk, move, break, loot, shop, fight, choose skill, boss, save, and gate the first exit until those actions are learned.

## Combat Feel Overlay

For a compact action RPG prototype, add feel through an overlay on the existing encounter object before replacing combat architecture. Store transient timing fields on the encounter, show the enemy's attack window in the world and HUD, and save only durable mastery stats such as best combo, perfect guards, and clean dodges.

## Internal Blueprint Closure

When an agent-facing backlog exists inside a game repo, keep it out of gameplay and close it with evidence. Use an internal closure log for human-readable proof, smoke assertions for machine-checkable proof, and negative tests that prevent roadmap UI, rewards, controls, or save fields from leaking into the player experience.

## Focus Pruning Contract

When a prototype gets a clearer genre target, convert the new focus into validation. Remove side systems whose loops do not feed the target pillars, rename or replace their objectives with core-loop equivalents, and add negative smoke tests so old experiments do not quietly return through UI, controls, rewards, or save state.
