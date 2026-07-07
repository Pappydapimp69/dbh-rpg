# Next Slice Contract

This contract defines how future DBH RPG work should move from blueprint to build.

## Slice Rule

Each slice must ship a playable vertical result: player-facing behavior, state/data support, and validation in the same pass.

## Required Loop

1. Query Brain for the target cycle or stage.
2. Do focused external research before code changes.
3. Build the smallest playable slice that satisfies the stage.
4. Keep development blueprints out of gameplay UI, save data, rewards, and controls.
5. Update `docs/BLUEPRINT_CLOSURE_LOG.md` with evidence.
6. Add or update smoke checks.
7. Run `npm.cmd run check`.
8. Mine and sync Brain after the stage batch.

## Data Boundaries

- `src/characterCreation.js`: playable species identity and growth data.
- `src/formMastery.js`: form catalog, mastery ranks, and transformation blueprint notes.
- `src/expansionBlueprints.js`: internal agent backlog only.
- `src/main.js`: current prototype simulation, rendering, UI, and content glue.
- `docs/BLUEPRINT_CLOSURE_LOG.md`: source of truth for closed development cycles.

## Acceptance Criteria

- The game starts from `index.html` without a build step.
- `npm.cmd run check` passes.
- Any new player-facing feature has save/load compatibility defaults if it writes state.
- Any new internal blueprint work remains internal.
- The closure log names the cycle, stage evidence, and validation hook.
