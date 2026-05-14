## Concept
The player controls a luminous dot that can be toggled between its normal size, half size, or double size for a brief period. Shrinking lets the dot slip through narrow gaps, while expanding lets it bypass small obstacles that would otherwise block it.

## Player
A simple glowing dot is the avatar. It can move around the play area and the player can trigger a size change (shrink or expand) that lasts for a few seconds.

## Core loop
Obstacles continuously approach the dot. The player watches the incoming patterns, decides whether to stay at normal size, shrink, or expand, and activates the size change at the right moment to avoid collision. This decision‑and‑reaction cycle repeats every few seconds.

## Hazards / Obstacles
- Narrow gaps that only a shrunken dot can pass.
- Small spikes or protrusions that a normal‑sized dot would hit but a doubled dot can push past.
- Moving walls with opening sizes that require the correct size to traverse.
- Timed laser sweeps that a shrunken dot can duck under.

## Score
Points are awarded each time an obstacle is successfully navigated. Consecutive successful passes build a combo multiplier, and surviving longer adds incremental bonuses.

## Win and lose
The player loses when colliding with an obstacle while at an inappropriate size; a Game Over overlay appears showing the final score and a restart prompt. The player wins by reaching a predefined distance or score target, triggering a celebratory visual and a victory message.

## Feel
Fast‑paced, reflex‑driven arcade action with a neon glow aesthetic and pulsing synth soundtrack. The bright dot against a dark background creates tension and flow, encouraging quick, satisfying size‑shift decisions.

## Why it's fun
The thrill of instantly reshaping yourself to fit impossible spaces creates a satisfying “aha!” moment each time you slip through a tight gap.
