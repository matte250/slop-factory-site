## Concept
Control a luminous dot that constantly leaves a delayed echo of its path. By tapping, you instantly swap the dot with its echo, letting you slip past obstacles that target only one of the two.

## Player
The avatar is a bright moving dot with a translucent trailing echo. Verbs: move (steer the dot continuously), tap (swap positions with the echo).

## Core loop
Each frame the dot moves under player control while the echo faithfully follows the same trajectory with a short lag. Obstacles appear, some affecting only the dot, others only the echo. The player judges the right moment to tap, swapping positions, then continues guiding the dot as the echo resumes its delayed trail. The cycle repeats, with new hazards and opportunities emerging constantly.

## Hazards / Obstacles
- **Solid spikes** that instantly end the game if the dot touches them.
- **Moving barriers** that sweep across the play area and only collide with the dot.
- **Ghost walls** that are harmless to the dot but destroy the echo on contact, forcing the player to avoid swapping at the wrong time.
- **Laser sweeps** that trigger on the dot’s current location but ignore the echo’s delayed position, rewarding precise timing.

## Score
Score increases each time the player successfully swaps to avoid a hazard, each time a swap is performed, and each time a collectible orb is passed while moving.

## Win and lose
The player loses when the dot contacts a solid spike, a moving barrier, or any hazard that kills it. The player wins by reaching a designated exit zone after surviving a set number of swaps (or a time limit) and triggering a final “escape” swap. Upon win or loss a bold overlay appears showing the result and the final score.

## Feel
A fast‑paced, reflex‑driven experience with a neon‑glow aesthetic; the background pulses with subtle gradients while the dot and its echo emit bright cyan‑magenta trails. Minimalistic synth chimes signal swaps and hazard interactions, creating a sleek, arcade‑like atmosphere.

## Why it's fun
Swapping places with your own delayed echo lets you magically “step through” walls, delivering a satisfying moment of surprise and mastery whenever a tight timing swap lets you survive an otherwise impossible obstacle.
