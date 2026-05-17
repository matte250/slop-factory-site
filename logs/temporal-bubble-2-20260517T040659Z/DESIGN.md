## Concept
The player navigates a lone dot through a dense field of moving obstacles by tapping to generate a temporal bubble that briefly freezes everything within it, letting the dot slip through tight gaps. The tension comes from timing the bubble’s short freeze and managing its cooldown.

## Player
The avatar is a small glowing dot that the player steers by swiping or using directional input. Verbs: move (directional navigation), tap (create temporal bubble). No other abilities.

## Core loop
Every few seconds the player scans the approaching cluster of obstacles, decides when to place a bubble to pause them, and guides the dot through the newly opened path. The loop repeats: observe movement, time a bubble, navigate the freed corridor, then wait for the next obstacle wave.

## Hazards / Obstacles
- **Sweeping bars**: long rectangular obstacles that slide horizontally or vertically, constantly moving along a fixed path and reappearing after exiting the screen. They can trap the dot if not frozen in time.
- **Rotating gears**: circular clusters that spin around a pivot, extending spiked arms that sweep the area. They briefly pause when frozen, but resume rotation once the bubble expires.
- **Pulsing mines**: stationary or slowly drifting mines that emit a short-range pulse when the dot gets too close, causing instant failure unless the pulse is halted by a bubble.
- **Spawned blockers**: occasional bursts of small, fast-moving dots that bounce off walls; they cannot be frozen individually but are stopped while inside the bubble’s radius.

## Score
- **Successful passage**: each time the dot exits a cluster of obstacles after a bubble, the player earns a point.
- **Bubble efficiency**: using a bubble that frees multiple obstacles at once grants a bonus.
- **Combo survival**: navigating three consecutive clusters without a missed bubble adds a streak multiplier.
- **Collectable orbs** (optional): glowing orbs that appear inside frozen zones give extra points when collected.

## Win and lose
The player loses when the dot contacts any active obstacle outside a bubble or runs out of lives. The screen flashes red, and a “Game Over” overlay appears with the final score. The player wins by surviving a predefined number of obstacle waves (e.g., the final wave) or reaching a target score, at which point a celebratory burst of frozen bubbles expands outward, revealing the final score and a “You Win” banner.

## Feel
The game feels frantic yet rhythmic, with a pulse‑driven visual style of neon outlines against a dark void. Each bubble produces a subtle time‑warp distortion and a soft chime, while obstacles emit whooshing tones that halt on freeze, creating a satisfying contrast between motion and stillness.

## Why it's fun
The moment you tap and watch a chaotic swarm freeze in place, carving a perfect path for the dot, delivers an instant “aha!” that makes you want to do it again and again.
