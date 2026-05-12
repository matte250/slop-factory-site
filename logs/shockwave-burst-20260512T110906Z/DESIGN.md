## Concept
The player controls a tiny dot navigating a dense field of obstacles. By tapping (or clicking) they emit a short‑lived outward shockwave that pushes nearby obstacles away, briefly carving a safe corridor; a cooldown forces careful timing and strategic placement of each wave.

## Player
The avatar is a simple glowing dot that drifts through the play area. It can move in any direction (up, down, left, right, diagonally) using keyboard or touch input, and it can **emit shockwave** on demand. The verbs are *move* and *shockwave*.

## Core loop
Every few seconds new obstacles appear and drift toward the dot. The player steers to avoid collisions, watches the obstacle patterns, and decides when to trigger a shockwave to clear a path. After each wave a short cooldown prevents spamming, so the player must anticipate the next hazard and time the next wave for maximum effect. The loop repeats: navigate → evaluate → shockwave (if needed) → wait for cooldown.

## Hazards / Obstacles
- **Roaming blocks**: solid squares that travel in straight lines, bouncing off the arena edges. They form moving walls that can engulf the dot.
- **Spinning rotors**: rotating blades that sweep a fixed radius; they telegraph rotation direction before each spin.
- **Static clusters**: groups of stationary obstacles that create narrow choke points. They are immune to movement except when displaced by a shockwave.
- **Pulsing mines**: entities that expand briefly before retracting, creating temporary zones the dot must dodge.
All hazards are pushable by the shockwave but return to their original trajectories after the wave fades.

## Score
Score increases on discrete events:
- Each obstacle successfully passed without collision.
- Each successful shockwave that creates a clear corridor (i.e., after the wave the dot moves a measurable distance without hitting anything).
- Collecting occasional bonus pickups that appear in the cleared space (e.g., glowing orbs). 
The score is displayed constantly on the screen.

## Win and lose
The player loses instantly on any collision with a hazard. The game ends with a “Game Over” overlay and the final score.
The player wins by surviving a predefined number of waves (or reaching a distant exit point) without dying, triggering a “You Win!” celebration overlay.

## Feel
A frantic, high‑energy arcade pace that rewards quick decision‑making. The aesthetic is crisp neon on a dark backdrop, with sharp sound cues for each shockwave, collision, and score event. The game feels like a constant pulse of tension punctuated by satisfying bursts of clearance.

## Why it's fun
The thrill of timing a single shockwave just before an imminent collision, watching obstacles scatter and the dot slip through the newly‑opened gap, delivers that perfect blend of tension and cathartic release.