# Quest Compass Proposal

## Research Notes

- Game Accessibility Guidelines recommends interactive tutorials, clear language, current objective reminders during gameplay, contextual guidance, and visual reinforcement for important instructions.
- Tutorial-generation research points in the same direction: simple rule text is not enough for larger games; guidance needs to understand the player state and current objective.
- The existing DBH prototype already has an opening arc, objective list, quest log, nearby interaction hint, and target marker. The narrow opportunity is to connect those pieces into one readable quest compass.

## Single Focus

Make the current objective easier to understand without adding new story content.

## Blueprint

1. Group the 55 objectives into named campaign arcs.
2. Add a quest target resolver that can name the target zone, target label, and next action.
3. Show compact compass text in the HUD.
4. Draw a visual compass marker for same-zone targets, including off-screen edge direction.
5. Expand smoke coverage for the quest compass surface.

## Build Proposal

Use objective metadata instead of a new quest system. The current save format already tracks `completed` and `activeObjective`, so the build should derive guidance from that state and avoid new persistence risk.

The first implementation should emphasize the opening arc and major region route targets, then fall back to simple arc language for objectives without exact coordinates.
