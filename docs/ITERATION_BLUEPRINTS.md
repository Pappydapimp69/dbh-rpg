# Iteration Blueprints

This file records the 20 autonomous expansion cycles requested after the initial DBH RPG build. Each cycle is a development blueprint split into 5 stages. The matching structured data lives in `src/expansionBlueprints.js` for agent planning and validation only; blueprints are not gameplay content and should not appear in the player UI, save data, rewards, or controls.

## Workflow Contract

For each cycle:

1. Query Brain for the new blueprint.
2. Split the blueprint into 5 stages.
3. Query Brain before each stage.
4. Do the stage work.
5. Mine Brain and sync Brain after the stage.
6. Continue automatically into the next stage and next cycle.

## Cycle List

1. Input And Comfort Pass
2. Save And Continuity Pass
3. Quest Density Pass
4. World Texture Pass
5. Combat Feel Pass
6. Transformation Identity Pass
7. NPC And Schedule Pass
8. Economy And Loot Pass
9. Figurine Tactics Pass
10. Aura Forge Pass
11. Sky Courier Pass
12. Audio Stage Pass
13. Accessibility Pass
14. Performance Pass
15. GitHub Pages Pass
16. Lore And Codex Pass
17. Training Systems Pass
18. Branching Story Pass
19. QA And Regression Pass
20. Next-Slice Production Pass

Each cycle has exactly five stages in the data module. The smoke test guards both the 20-cycle count and the 5-stage-per-cycle shape.
