## Concept
The player controls a rotating dot orbiting a fixed center; the dot continuously circles while moving outward, and each tap toggles the dot between an inner and outer orbital radius, letting the player weave through incoming obstacles.

## Player
A single glowing dot that orbits the screen’s center. Verbs: rotate (automatic), toggle radius (tap), dodge (by positioning via radius toggle).

## Core loop
The dot continuously revolves around the central axis. Obstacles appear on either the inner or outer track and travel toward the player’s path. Each tap flips the dot’s orbit, forcing the player to choose the safe track at the right moment. The player watches incoming obstacles, anticipates their arrival, and times the toggle to slip through gaps, while the game gradually introduces new patterns.

## Hazards / Obstacles
- **Static rings**: Fixed circular barriers that occupy either the inner or outer track, requiring the player to be on the opposite radius.
- **Sweeping arcs**: Rotating arcs that move along the orbit, temporarily blocking sections of a track.
- **Spiral projectiles**: Objects that spiral inward from the outer edge toward the center, crossing both tracks but leaving narrow safe windows.
- **Burst bursts**: Sudden radial bursts that expand outward, filling one track briefly.
All obstacles are purely positional; they do not rely on speed numbers.

## Score
- Successfully passing an obstacle without collision.
- Executing a perfect toggle exactly as an obstacle gap aligns, granting a bonus.
- Surviving a complete rotation cycle without a hit.

## Win and lose
The player loses when the dot collides with any obstacle, triggering a “Game Over” overlay with the final score and restart instructions. There is no timed win; the game ends only on collision, encouraging the highest possible score.

## Feel
A sleek, neon‑lit aesthetic with a dark, star‑filled backdrop. The orbit glows cyan, while obstacles flash magenta and yellow. The audio is minimal, featuring crisp beeps for toggles and a subtle bass pulse on collisions. The experience feels rhythmic yet tense, rewarding quick reflexes and pattern recognition.

## Why it's fun
The instant satisfaction of flipping the orbit at the exact split‑second to slip through a closing gap, making the player feel like they’re dancing on a razor‑thin line.
