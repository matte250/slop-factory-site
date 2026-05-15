## Concept

The player taps to split a traveling dot into two side‑by‑side dots, then taps again to merge them back. While split, both dots must survive independently generated obstacles that appear in either lane, creating a rhythmic pattern of split‑and‑merge to thread tight gaps.

## Player

The avatar is a simple glowing dot (or a pair of dots when split) moving forward automatically. The player’s only controls are **tap/click** to split and to merge. When split, the player can also slide the pair left or right across the two lanes to avoid lane‑specific hazards. No explicit speed or coordinate values are exposed.

## Core loop

Every few seconds a new set of obstacles scrolls toward the player. The player watches the incoming pattern, decides whether to stay single or split, and times the split/merge actions to keep both dots alive. Successful navigation yields a brief visual reward and a score bump, then the next wave begins.

## Hazards / Obstacles

- **Lane blockers**: stationary spikes that occupy one lane; a dot in that lane collides and dies.
- **Cross‑lane sweepers**: fast horizontal bars that traverse both lanes; any dot caught is destroyed.
- **Gap sequences**: alternating openings that require the player to be split for a narrow window before merging again.
- **Speed ramps**: obstacles that accelerate over time, forcing quicker decisions.

## Score

Score increases on discrete events:
1. Successfully passing a lane blocker while split.
2. Merging without collision after a split.
3. Surviving an entire wave of obstacles.
The score is displayed continuously.

## Win and lose

- **Lose**: any dot collides with an obstacle while split, or the single dot collides when not split. On death the screen shows a “Game Over” overlay with the final score and restart instructions.
- **Win**: reaching a predefined high‑score threshold (e.g., 1000 points) triggers a celebratory overlay “You Win!” and halts further spawning.

## Feel

The game feels fast‑paced and rhythmic, with a dark background and bright neon accents that pulse with each split or merge. Audio consists of crisp synth beeps for taps, obstacle passes, and hits, reinforcing the timing loop. The experience is a quick, intense burst of reaction and pattern‑reading.

## Why it's fun

The tension of deciding the exact moment to split and then merging just before a hazard hits creates a visceral “just‑in‑time” thrill that makes players grin, curse, and keep trying for a higher score.